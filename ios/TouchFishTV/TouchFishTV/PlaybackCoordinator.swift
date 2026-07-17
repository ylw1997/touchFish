import AVFoundation
import Foundation
import MediaPlayer

enum PlaybackSource: String {
    case recommend
    case following
    case live
    case favorites
    case author
}

/// 保留每个 Tab 自己稳定的播放器会话。
///
/// `TabView` 会提前创建所有标签页。如果直接把 `PlaybackCoordinator` 放在
/// 每个标签页的 `@StateObject` 中，会在启动时常驻多套 AVPlayerViewController。
/// 这个容器让同一个 Tab 激活期间稳定复用 AVPlayer 和
/// AVPlayerViewController。离开 Tab 时释放会话，避免隐藏的原生渲染层在
/// 多次跨 Tab 切换后继续占用 VideoToolbox 资源。
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

@MainActor
final class PlaybackCoordinator: ObservableObject {
    private static let playbackUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"

    let player = AVPlayer()
    let playerViewController: DouyinPlayerContainerViewController
    @Published private(set) var isTransitioning = false
    @Published private(set) var presentationOpacity = 1.0
    @Published private(set) var playbackError: String?

    private let instanceID = String(UUID().uuidString.prefix(6))
    private let playerID = String(UUID().uuidString.prefix(6))
    private let source: PlaybackSource
    private let playbackArbiter = PlaybackArbiter.shared
    private(set) var generation: UInt = 0
    private var itemStatusObservation: NSKeyValueObservation?
    private var itemPresentationSizeObservation: NSKeyValueObservation?
    private var liveStartupValidationTask: Task<Void, Never>?
    private var currentPlaybackToken: UInt64?
    private var currentAwemeID: String?
#if DEBUG
    private var diagnosticsTask: Task<Void, Never>?
#endif

    init(source: PlaybackSource) {
        self.source = source
        let playerViewController = DouyinPlayerContainerViewController()
        self.playerViewController = playerViewController
        player.automaticallyWaitsToMinimizeStalling = false
        // 播放器与原生控制器在单次 Tab 激活期间固定绑定；上下切换视频只替换
        // currentItem。跨 Tab 时由 PlaybackSessionSlot 一并释放二者。
        playerViewController.player = player
#if DEBUG
        PlaybackDiagnostics.shared.event(
            "created",
            category: "tab-player",
            fields: ["player": playerID, "source": source.rawValue]
        )
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
        playerViewController.requiresLinearPlayback = aweme.isLive
        // 直播优先尽快出首帧，候选流本身已有启动超时回退；让 AVPlayer
        // 额外等待“足够不发生卡顿”的缓冲会表现为长时间纯黑。
        player.automaticallyWaitsToMinimizeStalling = false
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
        if !aweme.isLive {
            playerViewController.danmakuController.configure(
                aweme: aweme,
                player: player,
                cookie: cookie,
                playbackToken: playbackToken
            )
        }
#if DEBUG
        diagnosticsTask?.cancel()
        diagnosticsEvent(
            "play-request",
            category: "session",
            fields: ["token": playbackToken, "aweme": aweme.aweme_id, "live": aweme.isLive]
        )
#endif

        let urls = preferredURLs(for: aweme)
#if DEBUG
        diagnosticsEvent(
            "candidates-selected",
            category: "asset",
            fields: [
                "count": urls.count,
                "live": aweme.isLive,
                "hosts": urls.map { $0.host ?? "unknown" }.joined(separator: ","),
                "paths": urls.map { $0.pathComponents.suffix(2).joined(separator: "/") }
                    .joined(separator: ",")
            ]
        )
#endif
        guard !urls.isEmpty else {
            releaseCurrentItem()
            failPlayback(
                generation: requestedGeneration,
                message: aweme.isLive ? "该直播间当前没有可用的直播流" : "该视频没有可用的播放地址"
            )
            return
        }

        let headers = playbackHeaders(for: aweme, cookie: cookie)

        // 关注流优先使用接口给出的真实 CDN；推荐流过滤掉稳定返回 403 的
        // prime 地址后，把 www 播放入口直接交给 AVPlayer。AVFoundation 会在
        // 同一条资源加载链路中处理 302 并开始缓冲，避免先用 URLSession
        // 解析一次、再由 AVPlayer 重新连接最终 CDN 的串行等待。
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
            failPlayback(
                generation: requestedGeneration,
                message: aweme.isLive
                    ? "该直播暂时无法播放，按上下键切换"
                    : "该视频暂时无法播放，按上下键切换"
            )
            return
        }

        let candidateIndex = startIndex
        let url = urls[candidateIndex]
#if DEBUG
        diagnosticsEvent(
            "load-candidate",
            category: "asset",
            fields: [
                "candidate": candidateIndex,
                "host": url.host ?? "unknown",
                "path": url.pathComponents.suffix(2).joined(separator: "/")
            ]
        )
#endif
        let asset = AVURLAsset(
            url: url,
            options: ["AVURLAssetHTTPHeaderFieldsKey": headers]
        )
        let item = AVPlayerItem(asset: asset)
        if aweme.isLive {
            // tvOS 不支持 AVPlayerViewController.showsTimecodes。通过系统的
            // Now Playing 直播标记让 AVKit 使用直播语义，而不是把
            // EXT-X-PROGRAM-DATE-TIME 当成普通进度时间展示。
            item.nowPlayingInfo = [MPNowPlayingInfoPropertyIsLiveStream: true]
        }
        // Feed 只需要少量前向缓存。旧值 8 秒在渐进式 MP4 上会被系统放大到
        // 一百多秒，当前 item 单独就会长期占用约 50 MB 解码/网络缓冲。
        item.preferredForwardBufferDuration = aweme.isLive ? 3 : 2
        item.canUseNetworkResourcesForLiveStreamingWhilePaused = false
        guard requestedGeneration == generation,
              playbackArbiter.isActive(self) else {
            asset.cancelLoading()
            return
        }

        // 创建好新 item 后一次性替换，避免 currentItem=nil 时原生进度条
        // 短暂显示“禁止播放”图标，也避免把无 await 的工作推迟到下一轮 RunLoop。
        player.replaceCurrentItem(with: item)
        observeStatus(
            of: item,
            candidateIndex: candidateIndex,
            urls: urls,
            aweme: aweme,
            headers: headers,
            requestedGeneration: requestedGeneration
        )
        if aweme.isLive {
            player.playImmediately(atRate: 1)
        } else {
            player.play()
        }
        if aweme.isLive {
            scheduleLiveStartupValidation(
                item: item,
                candidateIndex: candidateIndex,
                urls: urls,
                aweme: aweme,
                headers: headers,
                requestedGeneration: requestedGeneration
            )
        }
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
        itemPresentationSizeObservation?.invalidate()
        itemPresentationSizeObservation = item.observe(
            \.presentationSize,
            options: [.initial, .new]
        ) { [weak self, weak item] _, _ in
            Task { @MainActor [weak self, weak item] in
                guard let self, let item,
                      requestedGeneration == self.generation,
                      self.playbackArbiter.isActive(self),
                      self.player.currentItem === item,
                      item.status == .readyToPlay,
                      item.presentationSize.width > 0,
                      item.presentationSize.height > 0 else { return }
                self.finishReadyItem(
                    item,
                    aweme: aweme,
                    candidateIndex: candidateIndex,
                    host: urls[candidateIndex].host,
                    requestedGeneration: requestedGeneration
                )
            }
        }
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
                    let size = item.presentationSize
                    guard size.width > 0 && size.height > 0 else {
                        // 302 播放入口和 HLS 都可能先进入 readyToPlay，视频轨道
                        // 尺寸稍后才到。此时不能把它当成坏地址立即切候选；等待
                        // presentationSize 观察回调即可，真正的网络错误仍走 failed。
#if DEBUG
                        self.diagnosticsEvent(
                            "item-ready-awaiting-video-track",
                            category: "item",
                            fields: [
                                "candidate": candidateIndex,
                                "host": urls[candidateIndex].host ?? "unknown"
                            ]
                        )
#endif
                        return
                    }
                    self.finishReadyItem(
                        item,
                        aweme: aweme,
                        candidateIndex: candidateIndex,
                        host: urls[candidateIndex].host,
                        requestedGeneration: requestedGeneration
                    )
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

    private func finishReadyItem(
        _ item: AVPlayerItem,
        aweme: Aweme,
        candidateIndex: Int,
        host: String?,
        requestedGeneration: UInt
    ) {
        guard isTransitioning,
              requestedGeneration == generation,
              player.currentItem === item else { return }
        // 轨道已经确认后，这个候选就是有效的。直播在 item 尚未 ready 时调用
        // playImmediately 可能被 AVFoundation 留在 paused；在 ready 后再明确
        // 启动一次。此时也必须终止候选回退计时，不能把有效直播主动销毁。
        liveStartupValidationTask?.cancel()
        liveStartupValidationTask = nil
        itemPresentationSizeObservation?.invalidate()
        itemPresentationSizeObservation = nil
        // 只在资产已经确认含有可用视频轨道后再写入原生播放元数据。
        item.externalMetadata = metadata(for: aweme)
        if aweme.isLive {
            player.playImmediately(atRate: 1)
        }
#if DEBUG
        diagnosticsEvent(
            "item-ready",
            category: "item",
            fields: ["candidate": candidateIndex, "host": host ?? "unknown"]
        )
        startDiagnostics(generation: requestedGeneration)
#endif
        completeTransition(for: requestedGeneration)
    }

    private func scheduleLiveStartupValidation(
        item: AVPlayerItem,
        candidateIndex: Int,
        urls: [URL],
        aweme: Aweme,
        headers: [String: String],
        requestedGeneration: UInt
    ) {
        liveStartupValidationTask?.cancel()
        liveStartupValidationTask = Task { [weak self, weak item] in
            do {
                try await Task.sleep(for: .seconds(4))
            } catch {
                return
            }
            guard let self, let item,
                  requestedGeneration == self.generation,
                  self.playbackArbiter.isActive(self),
                  self.player.currentItem === item else { return }

            let size = item.presentationSize
            let hasVideo = size.width > 0 && size.height > 0
            // 已经出现视频轨道就说明 HLS 候选有效。paused 只是启动命令没有
            // 在 unknown -> ready 期间保留下来，重新播放即可，不能切走候选。
            if hasVideo {
                if self.player.timeControlStatus != .playing || self.player.rate == 0 {
                    self.player.playImmediately(atRate: 1)
#if DEBUG
                    self.diagnosticsEvent(
                        "live-ready-resumed",
                        category: "item",
                        fields: [
                            "candidate": candidateIndex,
                            "host": urls[candidateIndex].host ?? "unknown"
                        ]
                    )
#endif
                }
                self.liveStartupValidationTask = nil
                return
            }
#if DEBUG
            self.diagnosticsEvent(
                "live-startup-timeout-try-next",
                category: "item",
                fields: [
                    "candidate": candidateIndex,
                    "host": urls[candidateIndex].host ?? "unknown",
                    "path": urls[candidateIndex].pathComponents.suffix(2).joined(separator: "/"),
                    "videoWidth": Int(size.width),
                    "videoHeight": Int(size.height),
                    "timeControl": self.debugTimeControlStatus(self.player.timeControlStatus)
                ]
            )
#endif
            self.liveStartupValidationTask = nil
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
        playerViewController.requiresLinearPlayback = false
        player.automaticallyWaitsToMinimizeStalling = false
        releaseCurrentItem()
        // 只清空 currentItem 不足以立即释放 AVPlayerViewController 内部的
        // AVSampleBufferDisplayLayer。跨 Tab 时同时解绑 player，防止隐藏的
        // 渲染层继续持有 VideoToolbox/解码资源；下次 play 会重新绑定。
        playerViewController.player = nil
        playerViewController.onPrevious = nil
        playerViewController.onNext = nil
        playerViewController.onVisible = nil
        currentPlaybackToken = nil
        currentAwemeID = nil
        isTransitioning = false
        presentationOpacity = 1
        playbackError = nil
    }

    private func cancelPendingLoad() {
        liveStartupValidationTask?.cancel()
        liveStartupValidationTask = nil
        itemPresentationSizeObservation?.invalidate()
        itemPresentationSizeObservation = nil
#if DEBUG
        diagnosticsTask?.cancel()
        diagnosticsTask = nil
#endif
        itemStatusObservation?.invalidate()
        itemStatusObservation = nil
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
        liveStartupValidationTask?.cancel()
        liveStartupValidationTask = nil
        itemPresentationSizeObservation?.invalidate()
        itemPresentationSizeObservation = nil
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
        liveStartupValidationTask?.cancel()
        liveStartupValidationTask = nil
        itemPresentationSizeObservation?.invalidate()
        itemPresentationSizeObservation = nil
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
        if let liveRoom = aweme.liveRoom, liveRoom.isOnline {
            return liveRoom.preferredHLSURLs
        }
        guard let video = aweme.video else { return [] }
        let preferredH264 = (video.bit_rate ?? [])
            .filter { $0.is_h265 != 1 }
            .max { ($0.bit_rate ?? 0) < ($1.bit_rate ?? 0) }
        let preferredH265 = (video.bit_rate ?? [])
            .filter { $0.is_h265 == 1 }
            .max { ($0.bit_rate ?? 0) < ($1.bit_rate ?? 0) }

        // 每个视频只保留服务端返回的主 H.264 地址、一组最高码率 H.264
        // 和一组 H.265 回退。旧实现展开所有 bit_rate，一条推荐视频
        // 可以生成 50 多个 AVPlayerItem，对 AVFoundation 是没有意义的资源风暴。
        let values = (video.play_addr_h264?.url_list ?? [])
            + (preferredH264?.play_addr?.url_list ?? [])
            + (video.play_addr?.url_list ?? [])
            + (preferredH265?.play_addr?.url_list ?? [])

        var seen = Set<String>()
        let urls = values.compactMap(URL.init(string:))
        let uniqueURLs = urls.filter {
            !isClearlyAudioOnlyURL($0) && seen.insert($0.absoluteString).inserted
        }

        let directURLs = uniqueURLs
            .filter { !isDouyinPlaybackEndpoint($0) && !isPrimeCDN($0) }
            .sorted { score($0) > score($1) }
        let playbackEndpoints = uniqueURLs
            .filter(isDouyinPlaybackEndpoint)
            .sorted { score($0) > score($1) }
        // prime 地址在电视端稳定返回 403，不再创建无意义的 AVPlayerItem。
        // 真实直连优先；推荐只有 www 入口时直接由 AVPlayer 处理 302。
        return Array(directURLs.prefix(2))
            + Array(playbackEndpoints.prefix(2))
    }

    private func playbackHeaders(for aweme: Aweme, cookie: String) -> [String: String] {
        var headers = [
            "User-Agent": Self.playbackUserAgent,
            "Referer": aweme.isLive ? "https://live.douyin.com/" : "https://www.douyin.com/"
        ]
        if aweme.isLive { headers["Origin"] = "https://live.douyin.com" }
        if !cookie.isEmpty { headers["Cookie"] = cookie }
        return headers
    }

    private func isClearlyAudioOnlyURL(_ url: URL) -> Bool {
        let host = url.host?.lowercased() ?? ""
        let audioExtensions = Set(["aac", "m4a", "mp3", "wav"])
        return host.contains("music")
            || audioExtensions.contains(url.pathExtension.lowercased())
    }

    private func isDouyinPlaybackEndpoint(_ url: URL) -> Bool {
        let host = url.host?.lowercased() ?? ""
        return host == "www.douyin.com" || url.path.contains("/aweme/v1/play/")
    }

    private func isPrimeCDN(_ url: URL) -> Bool {
        url.host?.lowercased().contains("-prime.") == true
    }

    private func score(_ url: URL) -> Int {
        let host = url.host?.lowercased() ?? ""
        if isPrimeCDN(url) { return 0 }
        if host.hasSuffix("douyinvod.com") { return 4 }
        if host.contains("bytecdn") || host.contains("zjcdn") { return 3 }
        if isDouyinPlaybackEndpoint(url) { return 1 }
        return 2
    }

    private func metadata(for aweme: Aweme) -> [AVMetadataItem] {
        let authorName = aweme.displayAuthor?.nickname
        return [
            metadataItem(.commonIdentifierTitle, aweme.displayTitle),
            metadataItem(
                .iTunesMetadataTrackSubTitle,
                authorName?.isEmpty == false ? authorName! : "未知作者"
            )
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
        values["playerID"] = playerID
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
