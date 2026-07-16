import AVKit
import UIKit

@MainActor
final class DanmakuOverlayController {
    private static let enabledDefaultsKey = "douyin_danmaku_enabled"
    private let overlayView = UIView()
    private let service = DanmakuService()
    private weak var player: AVPlayer?
    private var aweme: Aweme?
    private var cookie = ""
    private var timeObserver: Any?
    private var playbackObservation: NSKeyValueObservation?
    private var rateObservation: NSKeyValueObservation?
    private var playbackToken: UInt64?
    private var fetchTasks: [Int: Task<Void, Never>] = [:]
    private var loadedWindows: Set<Int> = []
    private var pending: [DanmakuItem] = []
    private var displayedIDs: Set<String> = []
    private var trackAvailableAt: [Double] = []
    private var lastTime = 0.0
    private var animationsPaused = false

    var isEnabled: Bool {
        if UserDefaults.standard.object(forKey: Self.enabledDefaultsKey) == nil { return true }
        return UserDefaults.standard.bool(forKey: Self.enabledDefaultsKey)
    }

    func install(in controller: AVPlayerViewController) {
        guard let host = controller.contentOverlayView, overlayView.superview == nil else { return }
        overlayView.translatesAutoresizingMaskIntoConstraints = false
        overlayView.isUserInteractionEnabled = false
        overlayView.clipsToBounds = true
        overlayView.isHidden = !isEnabled
        host.addSubview(overlayView)
        NSLayoutConstraint.activate([
            overlayView.topAnchor.constraint(equalTo: host.topAnchor),
            overlayView.leadingAnchor.constraint(equalTo: host.leadingAnchor),
            overlayView.trailingAnchor.constraint(equalTo: host.trailingAnchor),
            overlayView.heightAnchor.constraint(equalTo: host.heightAnchor, multiplier: 0.25)
        ])
        PlaybackDiagnostics.shared.event(
            "installed",
            category: "danmaku",
            fields: ["overlaySubviews": overlayView.subviews.count]
        )
    }

    func configure(aweme: Aweme, player: AVPlayer, cookie: String, playbackToken: UInt64) {
        let changed = self.playbackToken != playbackToken || self.player !== player
        self.cookie = cookie
        guard changed else { return }
        stop()
        self.aweme = aweme
        self.player = player
        self.playbackToken = playbackToken
        overlayView.isHidden = !isEnabled
        PlaybackDiagnostics.shared.event(
            "configured",
            category: "danmaku",
            fields: ["aweme": aweme.aweme_id, "token": playbackToken]
        )
        guard isEnabled else { return }
        startRuntime()
    }

    func setEnabled(_ enabled: Bool) {
        guard enabled != isEnabled else { return }
        UserDefaults.standard.set(enabled, forKey: Self.enabledDefaultsKey)
        overlayView.isHidden = !enabled
        if enabled {
            startRuntime()
        } else {
            stopRuntime()
        }
        PlaybackDiagnostics.shared.event(
            enabled ? "enabled" : "disabled",
            category: "danmaku",
            fields: ["aweme": aweme?.aweme_id ?? "none"]
        )
    }

    func synchronizePreference() {
        overlayView.isHidden = !isEnabled
        if isEnabled {
            startRuntime()
        } else {
            stopRuntime()
        }
    }

    private func startRuntime() {
        guard isEnabled, timeObserver == nil, let player, aweme != nil, playbackToken != nil else { return }
        playbackObservation = player.observe(\.timeControlStatus, options: [.initial, .new]) { [weak self] player, _ in
            Task { @MainActor in
                self?.synchronizeAnimationState(with: player)
            }
        }
        rateObservation = player.observe(\.rate, options: [.initial, .new]) { [weak self] player, _ in
            Task { @MainActor in
                self?.synchronizeAnimationState(with: player)
            }
        }
        installTimeObserver()
        loadWindow(start: 0)
    }

    func stop() {
        if playbackToken != nil || timeObserver != nil || !fetchTasks.isEmpty || !overlayView.subviews.isEmpty {
            PlaybackDiagnostics.shared.event(
                "stop",
                category: "danmaku",
                fields: [
                    "aweme": aweme?.aweme_id ?? "none",
                    "token": playbackToken.map { String($0) } ?? "none",
                    "fetchTasks": fetchTasks.count,
                    "overlaySubviews": overlayView.subviews.count,
                    "pending": pending.count
                ]
            )
        }
        stopRuntime()
        aweme = nil
        player = nil
        playbackToken = nil
        cookie = ""
    }

    private func stopRuntime() {
        if let observer = timeObserver, let player { player.removeTimeObserver(observer) }
        timeObserver = nil
        playbackObservation?.invalidate()
        playbackObservation = nil
        rateObservation?.invalidate()
        rateObservation = nil
        fetchTasks.values.forEach { $0.cancel() }
        fetchTasks.removeAll()
        loadedWindows.removeAll()
        pending.removeAll()
        displayedIDs.removeAll()
        trackAvailableAt.removeAll()
        overlayView.layer.removeAllAnimations()
        overlayView.layer.speed = 1
        overlayView.layer.timeOffset = 0
        overlayView.layer.beginTime = 0
        animationsPaused = false
        overlayView.subviews.forEach { $0.removeFromSuperview() }
        lastTime = 0
    }

    private func installTimeObserver() {
        guard let player else { return }
        timeObserver = player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 0.25, preferredTimescale: 600), queue: .main) { [weak self] time in
            Task { @MainActor in self?.tick(seconds: time.seconds) }
        }
    }

    private func tick(seconds: Double) {
        guard seconds.isFinite, let player else { return }
        synchronizeAnimationState(with: player)
        if abs(seconds - lastTime) > 1.5 {
            clearForSeek()
        }
        lastTime = seconds
        guard isPlayingAtNormalRate(player) else { return }
        let start = DanmakuWindow.start(for: seconds)
        loadWindow(start: start)
        if Int(seconds * 1000) - start >= 16_000 {
            loadWindow(start: start + DanmakuWindow.lengthMilliseconds)
        }
        displayDueItems(at: Int(seconds * 1000))
    }

    private func loadWindow(start: Int) {
        guard !loadedWindows.contains(start), fetchTasks[start] == nil,
              let aweme else { return }
        loadedWindows.insert(start)
        let duration = aweme.video?.duration ?? DanmakuWindow.lengthMilliseconds
        let id = aweme.aweme_id
        let token = playbackToken
        let danmakuService = service
        let requestCookie = cookie
        PlaybackDiagnostics.shared.event(
            "load-window",
            category: "danmaku",
            fields: ["aweme": id, "token": token.map { String($0) } ?? "none", "start": start]
        )
        fetchTasks[start] = Task { [weak self] in
            do {
                let items = try await danmakuService.fetch(
                    awemeID: id,
                    duration: duration,
                    start: start,
                    cookie: requestCookie
                )
                guard !Task.isCancelled, let self,
                      self.playbackToken == token else { return }
                pending.append(contentsOf: items)
                pending.sort { $0.offset_time < $1.offset_time }
                PlaybackDiagnostics.shared.event(
                    "window-loaded",
                    category: "danmaku",
                    fields: [
                        "aweme": id,
                        "token": token.map { String($0) } ?? "none",
                        "start": start,
                        "items": items.count
                    ]
                )
            } catch {
                // 弹幕失败不打断视频；下一窗口仍可独立请求。
                PlaybackDiagnostics.shared.event(
                    error is CancellationError ? "window-cancelled" : "window-failed",
                    category: "danmaku",
                    fields: [
                        "aweme": id,
                        "token": token.map { String($0) } ?? "none",
                        "start": start,
                        "errorType": String(describing: type(of: error))
                    ]
                )
            }
            self?.fetchTasks[start] = nil
        }
    }

    private func displayDueItems(at milliseconds: Int) {
        let due = pending.filter { $0.offset_time <= milliseconds && milliseconds - $0.offset_time < 1_200 && !displayedIDs.contains($0.id) }
        due.prefix(4).forEach { display($0, at: milliseconds) }
        pending.removeAll { milliseconds - $0.offset_time > 1_200 }
    }

    private func display(_ item: DanmakuItem, at milliseconds: Int) {
        guard let player, isPlayingAtNormalRate(player),
              overlayView.bounds.width > 0, overlayView.bounds.height > 0 else { return }
        displayedIDs.insert(item.id)
        let font = UIFont.systemFont(ofSize: max(28, min(38, overlayView.bounds.height * 0.14)), weight: .semibold)
        let label = StrokeLabel()
        label.text = item.text
        label.font = font
        label.textColor = UIColor.white.withAlphaComponent(0.88)
        label.lineBreakMode = .byTruncatingTail
        label.numberOfLines = 1
        label.sizeToFit()
        label.frame.size.width = min(label.bounds.width, overlayView.bounds.width * 0.72)

        let rowHeight = font.lineHeight + 12
        let trackCount = max(1, Int(overlayView.bounds.height / rowHeight))
        if trackAvailableAt.count != trackCount { trackAvailableAt = Array(repeating: 0, count: trackCount) }
        guard let track = trackAvailableAt.enumerated().min(by: { $0.element < $1.element })?.offset,
              trackAvailableAt[track] <= Double(milliseconds) else { return }

        label.frame.origin = CGPoint(x: overlayView.bounds.width, y: CGFloat(track) * rowHeight + 4)
        overlayView.addSubview(label)
        let distance = overlayView.bounds.width + label.bounds.width
        let duration = max(7.5, Double(distance / 150))
        trackAvailableAt[track] = Double(milliseconds) + min(3_000, duration * 350)
        UIView.animate(withDuration: duration, delay: 0, options: [.curveLinear, .allowUserInteraction]) {
            label.frame.origin.x = -label.bounds.width
        } completion: { _ in label.removeFromSuperview() }
    }

    private func clearForSeek() {
        fetchTasks.values.forEach { $0.cancel() }
        fetchTasks.removeAll()
        loadedWindows.removeAll()
        pending.removeAll()
        overlayView.layer.removeAllAnimations()
        overlayView.subviews.forEach { $0.removeFromSuperview() }
        displayedIDs.removeAll()
        trackAvailableAt.removeAll()
    }

    private func setAnimationsPaused(_ paused: Bool) {
        guard paused != animationsPaused else { return }
        animationsPaused = paused
        let layer = overlayView.layer
        if paused {
            let pausedTime = layer.convertTime(CACurrentMediaTime(), from: nil)
            layer.speed = 0
            layer.timeOffset = pausedTime
        } else {
            let pausedTime = layer.timeOffset
            layer.speed = 1
            layer.timeOffset = 0
            layer.beginTime = 0
            layer.beginTime = layer.convertTime(CACurrentMediaTime(), from: nil) - pausedTime
        }
    }

    private func synchronizeAnimationState(with player: AVPlayer) {
        setAnimationsPaused(!isPlayingAtNormalRate(player))
    }

    private func isPlayingAtNormalRate(_ player: AVPlayer) -> Bool {
        player.timeControlStatus == .playing && abs(Double(player.rate) - 1) < 0.05
    }
}

private final class StrokeLabel: UILabel {
    override func drawText(in rect: CGRect) {
        guard let context = UIGraphicsGetCurrentContext() else { return }
        let original = textColor
        context.setLineWidth(4)
        context.setLineJoin(.round)
        context.setTextDrawingMode(.stroke)
        textColor = UIColor.black.withAlphaComponent(0.72)
        super.drawText(in: rect)
        context.setTextDrawingMode(.fill)
        textColor = original
        super.drawText(in: rect)
    }
}
