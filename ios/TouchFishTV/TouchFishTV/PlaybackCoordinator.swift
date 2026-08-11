import AVFoundation
import Foundation

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
    private struct PrewarmedAsset {
        let awemeID: String
        let url: URL
        let asset: AVURLAsset
        let item: AVPlayerItem
        var isReady: Bool
    }

    private struct PlaybackEndpointProbe {
        let url: URL
        let elapsed: TimeInterval
    }

    private static let playbackUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"

    let player = AVQueuePlayer()
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
    private var prewarmTask: Task<Void, Never>?
    private var prewarmedAsset: PrewarmedAsset?
    private var prewarmGeneration: UInt = 0
    private var currentPlaybackToken: UInt64?
    private var currentAwemeID: String?
    private let prewarmProbeSession: URLSession
#if DEBUG
    private var diagnosticsTask: Task<Void, Never>?
#endif

    init(source: PlaybackSource) {
        self.source = source
        let probeConfiguration = URLSessionConfiguration.ephemeral
        probeConfiguration.requestCachePolicy = .reloadIgnoringLocalCacheData
        probeConfiguration.timeoutIntervalForRequest = 4
        probeConfiguration.timeoutIntervalForResource = 4
        probeConfiguration.urlCache = nil
        probeConfiguration.httpCookieStorage = nil
        probeConfiguration.httpShouldSetCookies = false
        prewarmProbeSession = URLSession(configuration: probeConfiguration)
        let playerViewController = DouyinPlayerContainerViewController()
        self.playerViewController = playerViewController
        player.automaticallyWaitsToMinimizeStalling = false
        // 播完后的索引切换仍由 FeedStore 统一处理。禁止 AVQueuePlayer 自行
        // 推进到可能尚未完成视频轨道准备的 staging item。
        player.actionAtItemEnd = .pause
        // 播放器与原生控制器在单次 Tab 激活期间固定绑定；跨 Tab 时由
        // PlaybackSessionSlot 一并释放二者。
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

    /// 在同一个 AVQueuePlayer 中只排队下一条推荐视频。
    ///
    /// 推荐接口经常只给出 `www.douyin.com/aweme/v1/play`，AVFoundation 首次
    /// 打开时还要经过重定向、CDN 建连和媒体信息读取；关注流通常直接给 CDN，
    /// 因而明显更快。把下一条 item 放进同一个播放器的队列，才能在当前视频
    /// 播放期间完成媒体轨道准备和少量缓冲；全程仍只有一个播放器，且最多只
    /// 保留当前项和下一项。
    func prewarm(_ aweme: Aweme?, cookie: String) {
        guard source == .recommend,
              let aweme,
              !aweme.isLive,
              aweme.aweme_id != currentAwemeID else {
            cancelPrewarm()
            return
        }
        let originalURLs = preferredURLs(for: aweme)
        guard !originalURLs.isEmpty else {
            cancelPrewarm()
            return
        }
        if let prepared = prewarmedAsset,
           prepared.awemeID == aweme.aweme_id {
            return
        }

        cancelPrewarm()
        prewarmGeneration &+= 1
        let requestedPrewarmGeneration = prewarmGeneration
        let endpointHeaders = playbackHeaders(for: aweme, cookie: cookie, url: nil)
        prewarmTask = Task { [weak self] in
            guard let self else { return }
            var urls = originalURLs
            if let resolved = await self.fastestResolvedPlaybackURL(
                in: originalURLs,
                headers: endpointHeaders
            ) {
                urls.removeAll { $0 == resolved.url }
                urls.insert(resolved.url, at: 0)
#if DEBUG
                self.diagnosticsEvent(
                    "prewarm-cdn-selected",
                    category: "asset",
                    fields: [
                        "targetAweme": aweme.aweme_id,
                        "host": resolved.url.host ?? "unknown",
                        "probeMs": Int(resolved.elapsed * 1_000)
                    ]
                )
#endif
            }
            for (candidateIndex, url) in urls.enumerated() {
                guard !Task.isCancelled,
                      requestedPrewarmGeneration == self.prewarmGeneration else { return }
                let asset = AVURLAsset(
                    url: url,
                    options: [
                        "AVURLAssetHTTPHeaderFieldsKey": self.playbackHeaders(
                            for: aweme,
                            cookie: cookie,
                            url: url
                        )
                    ]
                )
                let item = AVPlayerItem(asset: asset)
                item.preferredForwardBufferDuration = 2
                item.canUseNetworkResourcesForLiveStreamingWhilePaused = false
                self.prewarmedAsset = PrewarmedAsset(
                    awemeID: aweme.aweme_id,
                    url: url,
                    asset: asset,
                    item: item,
                    isReady: false
                )
                if self.player.canInsert(item, after: self.player.currentItem) {
                    self.player.insert(item, after: self.player.currentItem)
                }
#if DEBUG
                self.diagnosticsEvent(
                    "prewarm-started",
                    category: "asset",
                    fields: [
                        "targetAweme": aweme.aweme_id,
                        "host": url.host ?? "unknown",
                        "candidate": candidateIndex
                    ]
                )
#endif
                do {
                    let isPlayable = try await asset.load(.isPlayable)
                    guard !Task.isCancelled,
                          requestedPrewarmGeneration == self.prewarmGeneration,
                          var prepared = self.prewarmedAsset,
                          prepared.awemeID == aweme.aweme_id,
                          prepared.asset === asset else { return }
                    if isPlayable {
                        prepared.isReady = true
                        self.prewarmedAsset = prepared
#if DEBUG
                        self.diagnosticsEvent(
                            "prewarm-finished",
                            category: "asset",
                            fields: [
                                "targetAweme": aweme.aweme_id,
                                "host": url.host ?? "unknown",
                                "candidate": candidateIndex,
                                "playable": true
                            ]
                        )
#endif
                        return
                    }
#if DEBUG
                    self.diagnosticsEvent(
                        "prewarm-failed",
                        category: "asset",
                        fields: [
                            "targetAweme": aweme.aweme_id,
                            "host": url.host ?? "unknown",
                            "candidate": candidateIndex,
                            "error": "asset-not-playable"
                        ]
                    )
#endif
                } catch is CancellationError {
                    return
                } catch {
                    guard requestedPrewarmGeneration == self.prewarmGeneration else { return }
#if DEBUG
                    self.diagnosticsEvent(
                        "prewarm-failed",
                        category: "asset",
                        fields: [
                            "targetAweme": aweme.aweme_id,
                            "host": url.host ?? "unknown",
                            "candidate": candidateIndex,
                            "error": error.localizedDescription
                        ]
                    )
#endif
                }
                if self.player.currentItem !== item,
                   self.player.items().contains(where: { $0 === item }) {
                    self.player.remove(item)
                }
                asset.cancelLoading()
                if let prepared = self.prewarmedAsset,
                   prepared.asset === asset {
                    self.prewarmedAsset = nil
                }
            }
        }
    }

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
        let preparedTarget = prewarmedAsset?.awemeID == aweme.aweme_id
        if !preparedTarget {
            // 上一条、跨页跳转等并不一定命中已经排队的“下一条”。必须在
            // 替换 currentItem 前移除旧队列项，避免稍后自动播放错误视频。
            cancelPrewarm()
        }
        let playerAlreadyAdvancedToPreparedItem =
            preparedTarget && player.currentItem === prewarmedAsset?.item
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
        if !changedOwner && !playerAlreadyAdvancedToPreparedItem {
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

        var urls = preferredURLs(for: aweme)
        if let prepared = prewarmedAsset,
           prepared.awemeID == aweme.aweme_id {
            urls.removeAll { $0 == prepared.url }
            urls.insert(prepared.url, at: 0)
        }
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

        // 推荐流预热命中时，首个候选是小流量探测选出的最终 CDN；未命中、
        // 上一条或探测失败时仍从接口原地址开始并保留完整回退链。
        loadCandidates(
            urls,
            startingAt: 0,
            aweme: aweme,
            cookie: cookie,
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
        cookie: String,
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
        let headers = playbackHeaders(for: aweme, cookie: cookie, url: url)
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
        let prepared = takePrewarmedAsset(for: aweme, url: url)
        let asset = prepared?.asset ?? AVURLAsset(
            url: url,
            options: ["AVURLAssetHTTPHeaderFieldsKey": headers]
        )
#if DEBUG
        if let prepared {
            diagnosticsEvent(
                "prewarmed-asset-used",
                category: "asset",
                fields: [
                    "targetAweme": aweme.aweme_id,
                    "host": url.host ?? "unknown",
                    "assetReady": prepared.isReady,
                    "itemReady": prepared.item.status == .readyToPlay,
                    "videoWidth": Int(prepared.item.presentationSize.width),
                    "videoHeight": Int(prepared.item.presentationSize.height)
                ]
            )
        }
#endif
        let preparedItemIsReady = prepared.map {
            $0.item.status == .readyToPlay
                && $0.item.presentationSize.width > 0
                && $0.item.presentationSize.height > 0
        } ?? false
        let item: AVPlayerItem
        if let prepared, preparedItemIsReady {
            item = prepared.item
        } else {
            if let prepared,
               player.currentItem !== prepared.item,
               player.items().contains(where: { $0 === prepared.item }) {
                // AVQueuePlayer 推进到尚无视频轨道的 item 后，时间可能继续走但
                // 画面长期不更新。移除这个半成品，只复用已建连的 asset。
                player.remove(prepared.item)
            }
            item = AVPlayerItem(asset: asset)
            // Feed 只需要少量前向缓存。旧值 8 秒在渐进式 MP4 上会被系统放大到
            // 一百多秒，当前 item 单独就会长期占用约 50 MB 解码/网络缓冲。
            item.preferredForwardBufferDuration = aweme.isLive ? 3 : 2
            item.canUseNetworkResourcesForLiveStreamingWhilePaused = false
        }
        guard requestedGeneration == generation,
              playbackArbiter.isActive(self) else {
            asset.cancelLoading()
            return
        }

        // 创建好新 item 后一次性替换，避免 currentItem=nil 时原生进度条
        // 短暂显示“禁止播放”图标，也避免把无 await 的工作推迟到下一轮 RunLoop。
        if player.currentItem === item {
            // 当前视频自然结束时，AVQueuePlayer 可能已经自动推进到预载项；
            // 此时只接管状态与元数据，不能再次 advance 而跳过它。
        } else if preparedItemIsReady,
                  player.items().contains(where: { $0 === item }) {
            player.advanceToNextItem()
        } else {
            player.replaceCurrentItem(with: item)
        }
        observeStatus(
            of: item,
            candidateIndex: candidateIndex,
            urls: urls,
            aweme: aweme,
            cookie: cookie,
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
                cookie: cookie,
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
        cookie: String,
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
                        cookie: cookie,
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
        cookie: String,
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
                cookie: cookie,
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
        cancelPrewarm()
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

    private func takePrewarmedAsset(for aweme: Aweme, url: URL) -> PrewarmedAsset? {
        guard let prepared = prewarmedAsset,
              prepared.awemeID == aweme.aweme_id,
              prepared.url == url else { return nil }
        prewarmGeneration &+= 1
        // 这个 asset 马上会交给 AVPlayerItem 使用。不要在此取消正在执行的
        // load(.isPlayable)，否则会把已经完成的重定向/建连工作一并撤销。
        prewarmTask = nil
        prewarmedAsset = nil
        return prepared
    }

    private func cancelPrewarm() {
        prewarmGeneration &+= 1
        prewarmTask?.cancel()
        prewarmTask = nil
        if let prepared = prewarmedAsset,
           player.currentItem !== prepared.item,
           player.items().contains(where: { $0 === prepared.item }) {
            player.remove(prepared.item)
        }
        prewarmedAsset?.asset.cancelLoading()
        prewarmedAsset = nil
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
        player.removeAllItems()
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
            if source == .recommend {
                let map = liveRoom.stream_url?.hls_pull_url_map ?? [:]
                // 网页推荐直播会优先使用 ld 自适应流。tvOS 不支持网页的 FLV/MSE，
                // 因此以同档 SD1 HLS 尽快出首帧，再逐级回退到高清和默认原画。
                let values = ["SD1", "HD1", "SD2", "FULL_HD1"].compactMap { map[$0] }
                    + [liveRoom.stream_url?.hls_pull_url].compactMap { $0 }
                var seen = Set<String>()
                return values.compactMap(URL.init(string:)).filter {
                    seen.insert($0.absoluteString).inserted
                }
            }
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

    private func playbackHeaders(for aweme: Aweme, cookie: String, url: URL?) -> [String: String] {
        var headers = [
            "User-Agent": Self.playbackUserAgent,
            "Referer": aweme.isLive ? "https://live.douyin.com/" : "https://www.douyin.com/"
        ]
        if aweme.isLive { headers["Origin"] = "https://live.douyin.com" }
        // 网页只在同源播放入口携带登录态，重定向后的 VOD CDN 和直播 CDN
        // 都使用 credentials=omit。直连仍附带 Cookie 会影响部分 CDN 调度。
        let needsCookie = url.map(isDouyinPlaybackEndpoint) ?? true
        if needsCookie, !cookie.isEmpty { headers["Cookie"] = cookie }
        return headers
    }

    private func fastestResolvedPlaybackURL(
        in urls: [URL],
        headers: [String: String]
    ) async -> PlaybackEndpointProbe? {
        guard source == .recommend,
              let endpoint = urls.first(where: isDouyinPlaybackEndpoint) else { return nil }

        let session = prewarmProbeSession
        return await withTaskGroup(of: PlaybackEndpointProbe?.self) { group in
            for _ in 0..<2 {
                group.addTask {
                    await Self.probePlaybackEndpoint(
                        endpoint,
                        headers: headers,
                        session: session
                    )
                }
            }

            for await result in group {
                if let result {
                    group.cancelAll()
                    return result
                }
            }
            return nil
        }
    }

    private nonisolated static func probePlaybackEndpoint(
        _ endpoint: URL,
        headers: [String: String],
        session: URLSession
    ) async -> PlaybackEndpointProbe? {
        var request = URLRequest(url: endpoint)
        request.timeoutInterval = 4
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.setValue("bytes=0-65535", forHTTPHeaderField: "Range")
        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }

        let startedAt = Date()
        do {
            let (data, response) = try await session.data(for: request)
            guard !Task.isCancelled,
                  let httpResponse = response as? HTTPURLResponse,
                  (httpResponse.statusCode == 200 || httpResponse.statusCode == 206),
                  !data.isEmpty,
                  let finalURL = httpResponse.url else { return nil }
            let host = finalURL.host?.lowercased() ?? ""
            guard host != "www.douyin.com",
                  !finalURL.path.contains("/aweme/v1/play/"),
                  !host.contains("-prime.") else { return nil }
            return PlaybackEndpointProbe(
                url: finalURL,
                elapsed: Date().timeIntervalSince(startedAt)
            )
        } catch {
            return nil
        }
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
