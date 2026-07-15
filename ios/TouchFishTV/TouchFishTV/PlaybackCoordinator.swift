import AVFoundation
import Foundation

enum PlaybackSource: String {
    case recommend
    case following
    case favorites
}

/// 保留每个 Tab 自己稳定的播放器会话。
///
/// `TabView` 会提前创建所有标签页。如果直接把 `PlaybackCoordinator` 放在
/// 每个标签页的 `@StateObject` 中，会在启动时常驻多套 AVPlayerViewController。
/// 这个容器让列表数据、AVPlayer 和 AVPlayerViewController 一起按 Tab 常驻。
/// 离开 Tab 时只清空当前 AVPlayerItem，避免重建原生渲染链路。
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

    /// 暂停当前页面的播放，但保留该 Tab 的协调器和控制器实例。
    ///
    /// 清空当前视频源，但保留该 Tab 的播放器和原生控制器。
    func suspend() {
        guard let session else { return }
        session.stop()
#if DEBUG
        PlaybackDiagnostics.shared.event(
            "suspended",
            category: "session-slot",
            fields: ["source": source.rawValue]
        )
#endif
    }
}

/// 全局播放仲裁器。
///
/// 每个 Tab 拥有自己稳定的 AVPlayer/AVPlayerViewController，仲裁器只负责保证
/// 任意时刻最多一个协调器持有 AVPlayerItem。这样同一 Tab 上下切换只换视频源，
/// 跨 Tab 又不会把同一个 AVPlayer 反复挂到不同的原生渲染控制器上。
@MainActor
private final class PlaybackArbiter {
    static let shared = PlaybackArbiter()
    private weak var activeCoordinator: PlaybackCoordinator?

    private init() {}

    @discardableResult
    func claim(_ coordinator: PlaybackCoordinator) -> Bool {
        guard activeCoordinator !== coordinator else { return false }
        let previous = activeCoordinator
        previous?.relinquishForArbiter()
        activeCoordinator = coordinator
#if DEBUG
        PlaybackDiagnostics.shared.event(
            "claimed",
            category: "playback-arbiter",
            fields: [
                "owner": coordinator.diagnosticsInstanceID,
                "previousOwner": previous?.diagnosticsInstanceID ?? "none"
            ]
        )
#endif
        return true
    }

    func isActive(_ coordinator: PlaybackCoordinator) -> Bool {
        activeCoordinator === coordinator
    }

    func release(_ coordinator: PlaybackCoordinator) {
        guard activeCoordinator === coordinator else { return }
        activeCoordinator = nil
#if DEBUG
        PlaybackDiagnostics.shared.event(
            "released",
            category: "playback-arbiter",
            fields: ["owner": coordinator.diagnosticsInstanceID]
        )
#endif
    }
}

/// 一个 Tab 生命周期内保持不变的原生播放器。
@MainActor
private final class PlaybackPlayerLease {
    let player = AVPlayer()
    let id = String(UUID().uuidString.prefix(6))

    init(source: PlaybackSource) {
        player.automaticallyWaitsToMinimizeStalling = false
#if DEBUG
        PlaybackDiagnostics.shared.event(
            "created",
            category: "tab-player",
            fields: ["player": id, "source": source.rawValue]
        )
#endif
    }
}

@MainActor
final class PlaybackCoordinator: ObservableObject {
    var player: AVPlayer { playerLease.player }
    let playerViewController: DouyinPlayerViewController
    @Published private(set) var isTransitioning = false
    @Published private(set) var presentationOpacity = 1.0
    @Published private(set) var playbackError: String?

    private let instanceID = String(UUID().uuidString.prefix(6))
    private let source: PlaybackSource
    private let playerLease: PlaybackPlayerLease
    private let playbackArbiter = PlaybackArbiter.shared
    private(set) var generation: UInt = 0
    private var loadingAsset: AVURLAsset?
    private var itemStatusObservation: NSKeyValueObservation?
    private var currentPlaybackToken: UInt64?
    private var currentAwemeID: String?
#if DEBUG
    private var diagnosticsTask: Task<Void, Never>?
#endif

    init(source: PlaybackSource) {
        self.source = source
        let playerLease = PlaybackPlayerLease(source: source)
        let playerViewController = DouyinPlayerViewController()
        self.playerLease = playerLease
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

    fileprivate var diagnosticsInstanceID: String { instanceID }

    func play(_ aweme: Aweme, cookie: String, playbackToken: UInt64) {
        if currentPlaybackToken == playbackToken,
           currentAwemeID == aweme.aweme_id,
           playbackArbiter.isActive(self) {
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
        let changedOwner = playbackArbiter.claim(self)
        if playerViewController.player !== player {
            playerViewController.player = player
        }
        isTransitioning = true
        presentationOpacity = 0.82
        playbackError = nil
        // 同一 Tab 始终复用自己的 AVPlayer；跨 Tab 由仲裁器先同步清空旧
        // AVPlayerItem，确保不会存在两个 VideoToolbox 解码会话。
        playerViewController.danmakuController.stop()
        if !changedOwner {
            prepareCurrentItemForReplacement()
        }
        currentPlaybackToken = playbackToken
        currentAwemeID = aweme.aweme_id
        playerViewController.danmakuController.configure(
            aweme: aweme,
            player: player,
            cookie: cookie,
            playbackToken: playbackToken
        )
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
            releaseCurrentItem()
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
        guard playbackArbiter.isActive(self),
              playbackError == nil,
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
        guard requestedGeneration == generation,
              playbackArbiter.isActive(self) else { return }
        guard urls.indices.contains(startIndex) else {
            failPlayback(generation: requestedGeneration, message: "该视频暂时无法播放，按上下键切换")
            return
        }

        let candidateIndex = startIndex
        let url = urls[candidateIndex]
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
        let item = AVPlayerItem(asset: asset)
        item.externalMetadata = metadata(for: aweme)
        // Feed 只需要少量前向缓存。旧值 8 秒在渐进式 MP4 上会被系统放大到
        // 一百多秒，当前 item 单独就会长期占用约 50 MB 解码/网络缓冲。
        item.preferredForwardBufferDuration = 2
        item.canUseNetworkResourcesForLiveStreamingWhilePaused = false
        guard requestedGeneration == generation,
              playbackArbiter.isActive(self) else {
            asset.cancelLoading()
            return
        }

        // 创建好新 item 后一次性替换，避免 currentItem=nil 时原生进度条
        // 短暂显示“禁止播放”图标，也避免把无 await 的工作推迟到下一轮 RunLoop。
        player.replaceCurrentItem(with: item)
        clearLoadingAsset(ifMatching: asset)
        observeStatus(
            of: item,
            candidateIndex: candidateIndex,
            urls: urls,
            aweme: aweme,
            headers: headers,
            requestedGeneration: requestedGeneration
        )
        player.play()
#if DEBUG
        diagnosticsEvent(
            "item-replaced-and-play-called",
            category: "item",
            fields: ["candidate": candidateIndex, "host": url.host ?? "unknown"]
        )
#endif
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
                      self.playbackArbiter.isActive(self),
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
        guard requestedGeneration == generation,
              playbackArbiter.isActive(self) else { return }
        isTransitioning = false
        presentationOpacity = 1
    }

    func stop() {
        relinquishForArbiter()
        playbackArbiter.release(self)
    }

    /// 由全局仲裁器同步停止旧 Tab。这里不能反向 release 仲裁器，避免
    /// claim 新 Tab 的过程中发生重入。
    fileprivate func relinquishForArbiter() {
        generation &+= 1
        cancelPendingLoad()
#if DEBUG
        diagnosticsTask?.cancel()
        diagnosticsTask = nil
        diagnosticsEvent("stop", category: "session")
#endif
        playerViewController.danmakuController.stop()
        releaseCurrentItem()
        playerViewController.onPrevious = nil
        playerViewController.onNext = nil
        playerViewController.onVisible = nil
        playerViewController.player = nil
        currentPlaybackToken = nil
        currentAwemeID = nil
        isTransitioning = false
        presentationOpacity = 1
        playbackError = nil
    }

    private func cancelPendingLoad() {
#if DEBUG
        if loadingAsset != nil {
            diagnosticsEvent("cancel-pending-load", category: "asset")
        }
#endif
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
        guard requestedGeneration == generation,
              playbackArbiter.isActive(self) else { return }
        playerViewController.danmakuController.stop()
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
            player.cancelPendingPrerolls()
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
        player.cancelPendingPrerolls()
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

    /// 为同一个 Tab 内的下一条视频让出资源，但不把 currentItem 先设为 nil。
    /// 新 AVPlayerItem 会在同一轮主线程调用中直接替换它，原生播放器因此不会
    /// 进入“无媒体”状态。
    private func prepareCurrentItemForReplacement() {
        itemStatusObservation?.invalidate()
        itemStatusObservation = nil
        guard playbackArbiter.isActive(self),
              let item = player.currentItem else { return }
        player.cancelPendingPrerolls()
        player.pause()
        item.cancelPendingSeeks()
        item.asset.cancelLoading()
#if DEBUG
        diagnosticsEvent(
            "prepared-for-atomic-replacement",
            category: "item",
            fields: ["itemStatus": debugItemStatus(item.status)]
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
        guard let url = URL(string: value) else { return 0 }
        let host = url.host?.lowercased() ?? ""
        let isDouyinPlaybackEndpoint = host == "www.douyin.com"
            || value.contains("/aweme/v1/play/")

        // 喜欢接口同时返回设备适配入口和直连文件。适配入口更适合 AVPlayer，
        // 直连仍保留为失败回退；该排序只影响选源，不承担跨 Tab 掉帧修复。
        if source == .favorites, isDouyinPlaybackEndpoint { return 5 }
        // web-prime 地址在 tvOS AVFoundation 中会稳定返回无权限/无法打开，
        // 放到最后，避免每次推荐视频都先触发两轮失败和禁止播放图标。
        if host.contains("-prime.") { return 0 }
        if host.hasSuffix("douyinvod.com") { return 4 }
        if host.contains("bytecdn") || host.contains("zjcdn") { return 3 }
        if isDouyinPlaybackEndpoint { return 1 }
        return 2
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
            var previousDroppedFrames = 0
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
                let droppedFrames = player.currentItem?
                    .accessLog()?
                    .events
                    .last?
                    .numberOfDroppedVideoFrames ?? 0
                if droppedFrames > previousDroppedFrames {
                    diagnosticsEvent(
                        "video-frames-dropped",
                        category: "render",
                        fields: [
                            "droppedTotal": droppedFrames,
                            "droppedDelta": droppedFrames - previousDroppedFrames
                        ]
                    )
                }
                previousTime = currentTime
                previousStatus = status
                previousDroppedFrames = droppedFrames
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
        let accessEvent = item?.accessLog()?.events.last
        let size = item?.presentationSize ?? .zero
        var fields: [String: CustomStringConvertible] = [
            "player": debugTimeControlStatus(player.timeControlStatus),
            "rate": player.rate,
            "item": debugItemStatus(item?.status),
            "time": debugSeconds(current),
            "duration": debugSeconds(duration),
            "bufferedEnd": debugSeconds(bufferedEnd),
            "likelyToKeepUp": item?.isPlaybackLikelyToKeepUp ?? false,
            "bufferEmpty": item?.isPlaybackBufferEmpty ?? false,
            "waiting": waitingReason,
            "error": error,
            "videoWidth": Int(size.width),
            "videoHeight": Int(size.height),
            "thermal": debugThermalState(ProcessInfo.processInfo.thermalState)
        ]
        if let accessEvent {
            fields["droppedFrames"] = accessEvent.numberOfDroppedVideoFrames
            fields["stalls"] = accessEvent.numberOfStalls
            fields["mediaRequests"] = accessEvent.numberOfMediaRequests
            fields["observedMbps"] = String(format: "%.2f", accessEvent.observedBitrate / 1_000_000)
            fields["indicatedMbps"] = String(format: "%.2f", accessEvent.indicatedBitrate / 1_000_000)
            fields["averageVideoMbps"] = String(format: "%.2f", accessEvent.averageVideoBitrate / 1_000_000)
        }
        diagnosticsEvent(
            label,
            category: "player",
            fields: fields
        )
    }

    private func debugThermalState(_ state: ProcessInfo.ThermalState) -> String {
        switch state {
        case .nominal: return "nominal"
        case .fair: return "fair"
        case .serious: return "serious"
        case .critical: return "critical"
        @unknown default: return "unknown"
        }
    }

    private func diagnosticsEvent(
        _ name: String,
        category: String,
        fields: [String: CustomStringConvertible] = [:]
    ) {
        var values = fields
        values["instance"] = instanceID
        values["controller"] = playerViewController.diagnosticsID
        values["playerID"] = playerLease.id
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
