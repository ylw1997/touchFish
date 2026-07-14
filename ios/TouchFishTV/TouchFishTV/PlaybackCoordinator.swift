import AVFoundation
import Foundation

struct PlaybackOwner: Equatable {
    enum Source: String {
        case recommend
        case following
        case favorites
    }

    let id: UUID
    let source: Source

    var debugLabel: String {
        "\(source.rawValue):\(id.uuidString.prefix(6))"
    }
}

@MainActor
final class PlaybackCoordinator: ObservableObject {
    let player = AVPlayer()
    @Published private(set) var isTransitioning = false
    @Published private(set) var presentationOpacity = 1.0
    @Published private(set) var playbackError: String?

    private let instanceID = String(UUID().uuidString.prefix(6))
    private(set) var generation: UInt = 0
    private var assetTask: Task<Void, Never>?
    private var loadingAsset: AVURLAsset?
    private var currentPlaybackToken: UInt64?
    @Published private var currentOwner: PlaybackOwner?
#if DEBUG
    private var diagnosticsTask: Task<Void, Never>?
#endif

    init() {
#if DEBUG
        print("[PlaybackDiagnostics] instance=\(instanceID) init")
#endif
    }

    deinit {
#if DEBUG
        print("[PlaybackDiagnostics] instance=\(instanceID) deinit")
#endif
    }

    func play(_ aweme: Aweme, cookie: String, playbackToken: UInt64, owner: PlaybackOwner) {
        guard currentOwner != owner || currentPlaybackToken != playbackToken || player.currentItem == nil else {
#if DEBUG
            debugLog("忽略重复播放请求 owner=\(owner.debugLabel) token=\(playbackToken) id=\(aweme.aweme_id)")
            debugSnapshot(label: "ignored-same-token")
#endif
            return
        }

        generation &+= 1
        let requestedGeneration = generation
        cancelPendingLoad()
        isTransitioning = true
        presentationOpacity = 0.82
        playbackError = nil
        releaseCurrentItem()
        currentOwner = owner
        currentPlaybackToken = playbackToken
#if DEBUG
        diagnosticsTask?.cancel()
        debugLog("开始切换 owner=\(owner.debugLabel) generation=\(requestedGeneration) token=\(playbackToken) id=\(aweme.aweme_id)")
#endif

        let urls = preferredURLs(for: aweme)
        guard !urls.isEmpty else {
            failPlayback(generation: requestedGeneration, message: "该视频没有可用的播放地址")
            return
        }

        var headers = ["User-Agent": "Mozilla/5.0", "Referer": "https://www.douyin.com/"]
        if !cookie.isEmpty { headers["Cookie"] = cookie }

        assetTask = Task { [weak self] in
            guard let self else { return }
            for url in urls {
                guard !Task.isCancelled, requestedGeneration == generation else { return }
                let asset = AVURLAsset(
                    url: url,
                    options: ["AVURLAssetHTTPHeaderFieldsKey": headers]
                )
                loadingAsset = asset
                do {
                    let isPlayable = try await asset.load(.isPlayable)
                    clearLoadingAsset(ifMatching: asset)
                    guard isPlayable else { continue }
                    guard !Task.isCancelled, requestedGeneration == generation else { return }

                    let item = AVPlayerItem(asset: asset)
                    item.externalMetadata = metadata(for: aweme)
                    item.preferredForwardBufferDuration = 8
                    item.canUseNetworkResourcesForLiveStreamingWhilePaused = false
                    player.replaceCurrentItem(with: item)
                    player.automaticallyWaitsToMinimizeStalling = false
                    player.playImmediately(atRate: 1)
                    assetTask = nil
#if DEBUG
                    debugLog("已设置 PlayerItem 并立即播放 generation=\(requestedGeneration) urlHost=\(url.host ?? "unknown")")
                    startDiagnostics(generation: requestedGeneration)
#endif
                    completeTransition(for: requestedGeneration)
                    return
                } catch {
                    clearLoadingAsset(ifMatching: asset)
                    continue
                }
            }

            guard requestedGeneration == generation else { return }
            assetTask = nil
            failPlayback(generation: requestedGeneration, message: "该视频暂时无法播放，按上下键切换")
        }
    }

    func isOwned(by owner: PlaybackOwner) -> Bool {
        currentOwner == owner
    }

    func completeTransition(for requestedGeneration: UInt) {
        guard requestedGeneration == generation else { return }
        isTransitioning = false
        presentationOpacity = 1
    }

    func stop(owner: PlaybackOwner) {
        guard currentOwner == owner else {
#if DEBUG
            debugLog("忽略过期停止请求 owner=\(owner.debugLabel) current=\(currentOwner?.debugLabel ?? "none")")
#endif
            return
        }

        generation &+= 1
        cancelPendingLoad()
#if DEBUG
        diagnosticsTask?.cancel()
        diagnosticsTask = nil
        debugLog("stop and release owner=\(owner.debugLabel)")
#endif
        releaseCurrentItem()
        currentPlaybackToken = nil
        currentOwner = nil
        isTransitioning = false
        presentationOpacity = 1
        playbackError = nil
    }

    private func cancelPendingLoad() {
        assetTask?.cancel()
        assetTask = nil
        loadingAsset?.cancelLoading()
        loadingAsset = nil
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
    }

    private func releaseCurrentItem() {
        player.pause()
        player.cancelPendingPrerolls()
        guard let item = player.currentItem else { return }
        item.cancelPendingSeeks()
        item.asset.cancelLoading()
        player.replaceCurrentItem(with: nil)
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

#if DEBUG
    private func startDiagnostics(generation requestedGeneration: UInt) {
        diagnosticsTask?.cancel()
        diagnosticsTask = Task { [weak self] in
            guard let self else { return }
            debugSnapshot(label: "play-called")
            for step in 1...12 {
                do {
                    try await Task.sleep(nanoseconds: 500_000_000)
                } catch {
                    return
                }
                guard !Task.isCancelled, requestedGeneration == generation else { return }
                debugSnapshot(label: String(format: "after-%.1fs", Double(step) * 0.5))
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
        debugLog(
            "\(label) player=\(debugTimeControlStatus(player.timeControlStatus)) " +
            "rate=\(player.rate) item=\(debugItemStatus(item?.status)) " +
            "time=\(debugSeconds(current))/\(debugSeconds(duration)) " +
            "bufferedEnd=\(debugSeconds(bufferedEnd)) likelyToKeepUp=\(item?.isPlaybackLikelyToKeepUp ?? false) " +
            "bufferEmpty=\(item?.isPlaybackBufferEmpty ?? false) waiting=\(waitingReason) error=\(error)"
        )
    }

    private func debugLog(_ message: String) {
        print("[PlaybackDiagnostics] instance=\(instanceID) \(message)")
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
