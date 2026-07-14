import AVFoundation
import Foundation

enum PlaybackSource: String {
    case recommend
    case following
    case favorites
}

/// 保留页面自己的播放状态，但只在页面真正需要播放时持有原生播放器。
///
/// `TabView` 会提前创建所有标签页。如果直接把 `PlaybackCoordinator` 放在
/// 每个标签页的 `@StateObject` 中，会在启动时常驻多套 AVPlayer 和
/// AVPlayerViewController。即使清空 currentItem，原生解码/渲染缓存也可能继续
/// 跟随播放器实例存活。这个容器让列表页可以常驻，同时在离开播放页面后释放
/// 整个原生播放会话。
@MainActor
final class PlaybackSessionSlot: ObservableObject {
    @Published private(set) var session: PlaybackCoordinator?

    private let source: PlaybackSource

    init(source: PlaybackSource) {
        self.source = source
    }

    @discardableResult
    func activate() -> PlaybackCoordinator {
        if let session { return session }
        let session = PlaybackCoordinator(source: source)
        self.session = session
#if DEBUG
        PlaybackDiagnostics.shared.event(
            "activated",
            category: "session-slot",
            fields: ["source": source.rawValue]
        )
#endif
        return session
    }

    func deactivate() {
        guard let session else { return }
        session.stop()
        self.session = nil
#if DEBUG
        PlaybackDiagnostics.shared.event(
            "released",
            category: "session-slot",
            fields: ["source": source.rawValue]
        )
#endif
    }
}

@MainActor
final class PlaybackCoordinator: ObservableObject {
    let player: AVPlayer
    let playerViewController: DouyinPlayerViewController
    @Published private(set) var isTransitioning = false
    @Published private(set) var presentationOpacity = 1.0
    @Published private(set) var playbackError: String?

    private let instanceID = String(UUID().uuidString.prefix(6))
    private let source: PlaybackSource
    private(set) var generation: UInt = 0
    private var assetTask: Task<Void, Never>?
    private var loadingAsset: AVURLAsset?
    private var itemStatusObservation: NSKeyValueObservation?
    private var currentPlaybackToken: UInt64?
    private var currentAwemeID: String?
#if DEBUG
    private var diagnosticsTask: Task<Void, Never>?
#endif

    init(source: PlaybackSource) {
        self.source = source
        let player = AVPlayer()
        let playerViewController = DouyinPlayerViewController()
        playerViewController.player = player
        self.player = player
        self.playerViewController = playerViewController
#if DEBUG
        diagnosticsEvent("init", category: "session")
#endif
    }

    deinit {
#if DEBUG
        PlaybackDiagnostics.shared.event(
            "deinit",
            category: "session",
            fields: ["instance": instanceID, "source": source.rawValue]
        )
#endif
    }

    func play(_ aweme: Aweme, cookie: String, playbackToken: UInt64) {
        if currentPlaybackToken == playbackToken,
           currentAwemeID == aweme.aweme_id {
            if player.currentItem != nil {
                resume()
#if DEBUG
                diagnosticsEvent(
                    "existing-play-resumed",
                    category: "session",
                    fields: ["token": playbackToken, "aweme": aweme.aweme_id]
                )
                debugSnapshot(label: "resumed-same-token")
#endif
            }
            return
        }

        generation &+= 1
        let requestedGeneration = generation
        cancelPendingLoad()
        isTransitioning = true
        presentationOpacity = 0.82
        playbackError = nil
        releaseCurrentItem()
        if playerViewController.player !== player {
            playerViewController.player = player
        }
        currentPlaybackToken = playbackToken
        currentAwemeID = aweme.aweme_id
#if DEBUG
        diagnosticsTask?.cancel()
        diagnosticsEvent(
            "play-request",
            category: "session",
            fields: ["token": playbackToken, "aweme": aweme.aweme_id]
        )
#endif

        let urls = preferredURLs(for: aweme)
        guard !urls.isEmpty else {
            failPlayback(generation: requestedGeneration, message: "该视频没有可用的播放地址")
            return
        }

        var headers = ["User-Agent": "Mozilla/5.0", "Referer": "https://www.douyin.com/"]
        if !cookie.isEmpty { headers["Cookie"] = cookie }

        loadCandidates(
            urls,
            startingAt: 0,
            aweme: aweme,
            headers: headers,
            requestedGeneration: requestedGeneration
        )
    }

    func resume() {
        guard playbackError == nil,
              let item = player.currentItem,
              item.status != .failed else { return }
        if playerViewController.player !== player {
            playerViewController.player = player
        }
        guard player.timeControlStatus != .playing || player.rate == 0 else { return }
        player.play()
#if DEBUG
        diagnosticsEvent("resume", category: "session")
#endif
    }

    private func loadCandidates(
        _ urls: [URL],
        startingAt startIndex: Int,
        aweme: Aweme,
        headers: [String: String],
        requestedGeneration: UInt
    ) {
        assetTask = Task { [weak self] in
            guard let self else { return }
            for candidateIndex in startIndex..<urls.count {
                let url = urls[candidateIndex]
                guard !Task.isCancelled, requestedGeneration == generation else { return }
#if DEBUG
                diagnosticsEvent(
                    "load-candidate",
                    category: "asset",
                    fields: ["candidate": candidateIndex, "host": url.host ?? "unknown"]
                )
#endif
                let asset = AVURLAsset(
                    url: url,
                    options: ["AVURLAssetHTTPHeaderFieldsKey": headers]
                )
                loadingAsset = asset
                do {
                    let isPlayable = try await asset.load(.isPlayable)
                    clearLoadingAsset(ifMatching: asset)
                    guard isPlayable else {
#if DEBUG
                        diagnosticsEvent(
                            "candidate-not-playable",
                            category: "asset",
                            fields: ["candidate": candidateIndex, "host": url.host ?? "unknown"]
                        )
#endif
                        continue
                    }
                    guard !Task.isCancelled, requestedGeneration == generation else { return }

                    let item = AVPlayerItem(asset: asset)
                    item.externalMetadata = metadata(for: aweme)
                    item.preferredForwardBufferDuration = 8
                    item.canUseNetworkResourcesForLiveStreamingWhilePaused = false
                    player.replaceCurrentItem(with: item)
                    observeStatus(
                        of: item,
                        candidateIndex: candidateIndex,
                        urls: urls,
                        aweme: aweme,
                        headers: headers,
                        requestedGeneration: requestedGeneration
                    )
                    player.play()
                    assetTask = nil
#if DEBUG
                    diagnosticsEvent(
                        "item-replaced-and-play-called",
                        category: "item",
                        fields: ["candidate": candidateIndex, "host": url.host ?? "unknown"]
                    )
#endif
                    return
                } catch {
                    clearLoadingAsset(ifMatching: asset)
#if DEBUG
                    diagnosticsEvent(
                        "candidate-load-failed",
                        category: "asset",
                        fields: [
                            "candidate": candidateIndex,
                            "host": url.host ?? "unknown",
                            "errorType": String(describing: type(of: error)),
                            "error": error.localizedDescription
                        ]
                    )
#endif
                    continue
                }
            }

            guard requestedGeneration == generation else { return }
            assetTask = nil
            failPlayback(generation: requestedGeneration, message: "该视频暂时无法播放，按上下键切换")
        }
    }

    private func observeStatus(
        of item: AVPlayerItem,
        candidateIndex: Int,
        urls: [URL],
        aweme: Aweme,
        headers: [String: String],
        requestedGeneration: UInt
    ) {
        itemStatusObservation?.invalidate()
        itemStatusObservation = item.observe(\.status, options: [.initial, .new]) { [weak self, weak item] _, _ in
            Task { @MainActor [weak self, weak item] in
                guard let self, let item,
                      requestedGeneration == self.generation,
                      self.player.currentItem === item else { return }

                switch item.status {
                case .unknown:
                    break
                case .readyToPlay:
#if DEBUG
                    self.diagnosticsEvent(
                        "item-ready",
                        category: "item",
                        fields: ["candidate": candidateIndex, "host": urls[candidateIndex].host ?? "unknown"]
                    )
                    self.startDiagnostics(generation: requestedGeneration)
#endif
                    self.completeTransition(for: requestedGeneration)
                case .failed:
                    let error = item.error
#if DEBUG
                    self.diagnosticsEvent(
                        "item-failed-try-next-candidate",
                        category: "item",
                        fields: [
                            "candidate": candidateIndex,
                            "host": urls[candidateIndex].host ?? "unknown",
                            "errorType": error.map { String(describing: type(of: $0)) } ?? "none",
                            "error": error?.localizedDescription ?? "unknown",
                            "underlyingError": self.errorChain(error)
                        ]
                    )
#endif
                    self.itemStatusObservation?.invalidate()
                    self.itemStatusObservation = nil
#if DEBUG
                    self.diagnosticsTask?.cancel()
                    self.diagnosticsTask = nil
#endif
                    self.releaseCurrentItem()
                    self.isTransitioning = true
                    self.presentationOpacity = 0.82
                    self.loadCandidates(
                        urls,
                        startingAt: candidateIndex + 1,
                        aweme: aweme,
                        headers: headers,
                        requestedGeneration: requestedGeneration
                    )
                @unknown default:
                    break
                }
            }
        }
    }

    func completeTransition(for requestedGeneration: UInt) {
        guard requestedGeneration == generation else { return }
        isTransitioning = false
        presentationOpacity = 1
    }

    func stop() {
        generation &+= 1
        cancelPendingLoad()
#if DEBUG
        diagnosticsTask?.cancel()
        diagnosticsTask = nil
        diagnosticsEvent("stop", category: "session")
#endif
        releaseCurrentItem()
        playerViewController.danmakuController.stop()
        playerViewController.onPrevious = nil
        playerViewController.onNext = nil
        playerViewController.player = nil
        currentPlaybackToken = nil
        currentAwemeID = nil
        isTransitioning = false
        presentationOpacity = 1
        playbackError = nil
    }

    private func cancelPendingLoad() {
#if DEBUG
        if assetTask != nil || loadingAsset != nil {
            diagnosticsEvent("cancel-pending-load", category: "asset")
        }
#endif
        assetTask?.cancel()
        assetTask = nil
        loadingAsset?.cancelLoading()
        loadingAsset = nil
        itemStatusObservation?.invalidate()
        itemStatusObservation = nil
    }

    private func clearLoadingAsset(ifMatching asset: AVURLAsset?) {
        guard let asset, loadingAsset === asset else { return }
        loadingAsset = nil
    }

    private func failPlayback(generation requestedGeneration: UInt, message: String) {
        guard requestedGeneration == generation else { return }
        isTransitioning = false
        presentationOpacity = 1
        playbackError = message
#if DEBUG
        diagnosticsEvent(
            "playback-failed",
            category: "player",
            fields: ["message": message]
        )
#endif
    }

    private func releaseCurrentItem() {
        itemStatusObservation?.invalidate()
        itemStatusObservation = nil
        guard let item = player.currentItem else {
            player.pause()
#if DEBUG
            diagnosticsEvent("release-no-current-item", category: "item")
#endif
            return
        }
#if DEBUG
        diagnosticsEvent(
            "release-current-item-begin",
            category: "item",
            fields: [
                "itemStatus": debugItemStatus(item.status),
                "time": debugSeconds(player.currentTime().seconds)
            ]
        )
#endif
        player.pause()
#if DEBUG
        diagnosticsEvent(
            "release-current-item-paused",
            category: "item",
            fields: ["rate": player.rate]
        )
#endif
        item.cancelPendingSeeks()
        item.asset.cancelLoading()
        player.replaceCurrentItem(with: nil)
#if DEBUG
        diagnosticsEvent(
            "release-current-item-end",
            category: "item",
            fields: ["hasCurrentItem": player.currentItem != nil]
        )
#endif
    }

    private func preferredURLs(for aweme: Aweme) -> [URL] {
        let urls = aweme.video?.play_addr?.url_list ?? []
        return urls.compactMap(URL.init(string:)).sorted {
            score($0.absoluteString) > score($1.absoluteString)
        }
    }

    private func score(_ value: String) -> Int {
        if value.contains("/aweme/v1/play/") { return 3 }
        if value.contains("douyinvod.com") { return 2 }
        return value.contains("douyin.com") ? 1 : 0
    }

    private func metadata(for aweme: Aweme) -> [AVMetadataItem] {
        [
            metadataItem(.commonIdentifierTitle, aweme.desc?.isEmpty == false ? aweme.desc! : "无标题"),
            metadataItem(.iTunesMetadataTrackSubTitle, aweme.author?.nickname?.isEmpty == false ? aweme.author!.nickname! : "未知作者")
        ]
    }

    private func metadataItem(_ identifier: AVMetadataIdentifier, _ value: String) -> AVMetadataItem {
        let item = AVMutableMetadataItem()
        item.identifier = identifier
        item.value = value as NSString
        item.extendedLanguageTag = "zh-Hans"
        return item.copy() as! AVMetadataItem
    }

    private func errorChain(_ error: Error?) -> String {
        guard let error else { return "none" }
        var parts: [String] = []
        var current: NSError? = error as NSError
        var visited = Set<ObjectIdentifier>()
        while let value = current, !visited.contains(ObjectIdentifier(value)) {
            visited.insert(ObjectIdentifier(value))
            parts.append("\(value.domain):\(value.code):\(value.localizedDescription)")
            current = value.userInfo[NSUnderlyingErrorKey] as? NSError
        }
        return parts.joined(separator: " <- ")
    }

#if DEBUG
    private func startDiagnostics(generation requestedGeneration: UInt) {
        diagnosticsTask?.cancel()
        diagnosticsTask = Task { [weak self] in
            guard let self else { return }
            debugSnapshot(label: "play-called")
            var step = 0
            var previousTime = player.currentTime().seconds
            var stalledSamples = 0
            var previousStatus = player.timeControlStatus
            while !Task.isCancelled {
                step += 1
                let delay: UInt64 = step <= 12 ? 500_000_000 : 2_000_000_000
                do {
                    try await Task.sleep(nanoseconds: delay)
                } catch {
                    return
                }
                guard !Task.isCancelled, requestedGeneration == generation else { return }
                let elapsed = step <= 12 ? Double(step) * 0.5 : 6 + Double(step - 12) * 2
                debugSnapshot(label: String(format: "after-%.1fs", elapsed))

                let currentTime = player.currentTime().seconds
                let status = player.timeControlStatus
                if status == .playing, player.rate > 0,
                   currentTime.isFinite, previousTime.isFinite,
                   currentTime - previousTime < 0.05 {
                    stalledSamples += 1
                    if stalledSamples == 2 {
                        diagnosticsEvent(
                            "stalled-progress",
                            category: "player",
                            fields: ["previousTime": debugSeconds(previousTime), "currentTime": debugSeconds(currentTime)]
                        )
                    }
                } else {
                    stalledSamples = 0
                }
                if status == .paused, previousStatus != .paused, player.currentItem != nil {
                    diagnosticsEvent(
                        "paused-observed",
                        category: "player",
                        fields: ["time": debugSeconds(currentTime)]
                    )
                }
                previousTime = currentTime
                previousStatus = status
            }
        }
    }

    private func debugSnapshot(label: String) {
        let item = player.currentItem
        let current = player.currentTime().seconds
        let duration = item?.duration.seconds ?? .nan
        let bufferedEnd = item?.loadedTimeRanges.last?.timeRangeValue.end.seconds ?? 0
        let error = item?.error?.localizedDescription ?? "none"
        let waitingReason = player.reasonForWaitingToPlay?.rawValue ?? "none"
        diagnosticsEvent(
            label,
            category: "player",
            fields: [
                "player": debugTimeControlStatus(player.timeControlStatus),
                "rate": player.rate,
                "item": debugItemStatus(item?.status),
                "time": debugSeconds(current),
                "duration": debugSeconds(duration),
                "bufferedEnd": debugSeconds(bufferedEnd),
                "likelyToKeepUp": item?.isPlaybackLikelyToKeepUp ?? false,
                "bufferEmpty": item?.isPlaybackBufferEmpty ?? false,
                "waiting": waitingReason,
                "error": error
            ]
        )
    }

    private func diagnosticsEvent(
        _ name: String,
        category: String,
        fields: [String: CustomStringConvertible] = [:]
    ) {
        var values = fields
        values["instance"] = instanceID
        values["controller"] = playerViewController.diagnosticsID
        values["generation"] = generation
        values["source"] = source.rawValue
        values["aweme"] = currentAwemeID ?? "none"
        if let memory = PlaybackDiagnostics.shared.residentMemoryMegabytes() {
            values["memoryMB"] = String(format: "%.1f", memory)
        }
        PlaybackDiagnostics.shared.event(name, category: category, fields: values)
    }

    private func debugTimeControlStatus(_ status: AVPlayer.TimeControlStatus) -> String {
        switch status {
        case .paused: return "paused"
        case .waitingToPlayAtSpecifiedRate: return "waiting"
        case .playing: return "playing"
        @unknown default: return "unknown"
        }
    }

    private func debugItemStatus(_ status: AVPlayerItem.Status?) -> String {
        guard let status else { return "nil" }
        switch status {
        case .unknown: return "unknown"
        case .readyToPlay: return "ready"
        case .failed: return "failed"
        @unknown default: return "unknown-future"
        }
    }

    private func debugSeconds(_ value: Double) -> String {
        value.isFinite ? String(format: "%.3f", value) : "nan"
    }
#endif
}
