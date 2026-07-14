import AVKit
import SwiftUI
import UIKit

@MainActor
struct VideoPlayerView: View {
    @ObservedObject var coordinator: PlaybackCoordinator

    let aweme: Aweme
    let cookie: String
    let playbackToken: UInt64
    let onPrevious: () -> Void
    let onNext: () -> Void

    init(
        aweme: Aweme,
        cookie: String,
        playbackToken: UInt64,
        coordinator: PlaybackCoordinator,
        onPrevious: @escaping () -> Void,
        onNext: @escaping () -> Void
    ) {
        self.aweme = aweme
        self.cookie = cookie
        self.playbackToken = playbackToken
        self.coordinator = coordinator
        self.onPrevious = onPrevious
        self.onNext = onNext
    }

    var body: some View {
        ZStack {
            NativePlayerController(
                controller: coordinator.playerViewController,
                player: coordinator.player,
                aweme: aweme,
                cookie: cookie,
                playbackToken: playbackToken,
                isTransitioning: coordinator.isTransitioning,
                allowsNavigationWhileStopped: coordinator.playbackError != nil,
                onPrevious: onPrevious,
                onNext: onNext,
                onVisible: { [weak coordinator] in coordinator?.resume() }
            )

            if let playbackError = coordinator.playbackError {
                VStack(spacing: 18) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 54, weight: .light))
                        .foregroundStyle(.orange)
                    Text(playbackError)
                        .font(.title3.weight(.semibold))
                    Text("使用遥控器上键或下键切换视频")
                        .foregroundStyle(.secondary)
                }
                .allowsHitTesting(false)
            }
        }
        .opacity(coordinator.presentationOpacity)
        .animation(.easeOut(duration: 0.18), value: coordinator.presentationOpacity)
        .onReceive(NotificationCenter.default.publisher(for: .AVPlayerItemDidPlayToEndTime)) { notification in
            guard let item = notification.object as? AVPlayerItem,
                  item === coordinator.player.currentItem else { return }
            onNext()
        }
    }
}

private final class FocusAnchorView: UIView {
    override var canBecomeFocused: Bool { true }
}

final class DouyinPlayerViewController: AVPlayerViewController {
    let diagnosticsID = String(UUID().uuidString.prefix(6))
    var onPrevious: (() -> Void)?
    var onNext: (() -> Void)?
    var onVisible: (() -> Void)?
    var isTransitioning = false
    var allowsNavigationWhileStopped = false
    let danmakuController = DanmakuOverlayController()

    private let focusAnchor = FocusAnchorView()
    private var prefersPlayerFocus = true
    private var navigationLocked = false

    deinit {
        PlaybackDiagnostics.shared.event(
            "deinit",
            category: "controller",
            fields: ["controller": diagnosticsID]
        )
    }

    override var preferredFocusEnvironments: [UIFocusEnvironment] {
        prefersPlayerFocus ? [focusAnchor] : super.preferredFocusEnvironments
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        PlaybackDiagnostics.shared.event(
            "view-did-load",
            category: "controller",
            fields: ["controller": diagnosticsID]
        )
        showsPlaybackControls = true
        transportBarIncludesTitleView = true
        focusAnchor.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(focusAnchor)
        NSLayoutConstraint.activate([
            focusAnchor.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            focusAnchor.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            focusAnchor.widthAnchor.constraint(equalToConstant: 1),
            focusAnchor.heightAnchor.constraint(equalToConstant: 1)
        ])
        danmakuController.install(in: self)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        PlaybackDiagnostics.shared.event(
            "view-did-appear",
            category: "controller",
            fields: ["controller": diagnosticsID, "hasPlayer": player != nil]
        )
        onVisible?()
        DispatchQueue.main.async { [weak self] in self?.requestPlayerFocus() }
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        PlaybackDiagnostics.shared.event(
            "view-did-disappear",
            category: "controller",
            fields: ["controller": diagnosticsID, "hasPlayer": player != nil]
        )
    }

    func requestPlayerFocus() {
        prefersPlayerFocus = true
        setNeedsFocusUpdate()
        updateFocusIfNeeded()
        prefersPlayerFocus = false
    }

    override func pressesBegan(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
        guard canNavigateVideos else {
            super.pressesBegan(presses, with: event)
            return
        }

        var remaining = presses
        for press in presses {
            switch press.type {
            case .upArrow:
                PlaybackDiagnostics.shared.event(
                    "navigate-previous",
                    category: "controller",
                    fields: ["controller": diagnosticsID]
                )
                lockNavigationBriefly()
                onPrevious?()
                remaining.remove(press)
            case .downArrow:
                PlaybackDiagnostics.shared.event(
                    "navigate-next",
                    category: "controller",
                    fields: ["controller": diagnosticsID]
                )
                lockNavigationBriefly()
                onNext?()
                remaining.remove(press)
            default:
                break
            }
        }
        if !remaining.isEmpty { super.pressesBegan(remaining, with: event) }
    }

    private func lockNavigationBriefly() {
        navigationLocked = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            self?.navigationLocked = false
        }
    }

    private var canNavigateVideos: Bool {
        guard !isTransitioning, !navigationLocked,
              let player else { return false }
        guard player.timeControlStatus == .playing || allowsNavigationWhileStopped else { return false }
        return !isPlaybackControlFocused
    }

    private var isPlaybackControlFocused: Bool {
        guard var focused = UIFocusSystem.focusSystem(for: view)?.focusedItem as? UIView else { return false }
        while focused !== view {
            if focused is UIControl || focused.accessibilityTraits.contains(.button) || focused.accessibilityTraits.contains(.adjustable) {
                return true
            }
            guard let parent = focused.superview else { break }
            focused = parent
        }
        return false
    }
}

struct NativePlayerController: UIViewControllerRepresentable {
    let controller: DouyinPlayerViewController
    let player: AVPlayer
    let aweme: Aweme
    let cookie: String
    let playbackToken: UInt64
    let isTransitioning: Bool
    let allowsNavigationWhileStopped: Bool
    let onPrevious: () -> Void
    let onNext: () -> Void
    let onVisible: () -> Void

    func makeUIViewController(context: Context) -> DouyinPlayerViewController {
        configure(controller)
        return controller
    }

    func updateUIViewController(_ controller: DouyinPlayerViewController, context: Context) {
        configure(controller)
    }

    private func configure(_ controller: DouyinPlayerViewController) {
        if controller.player !== player {
            controller.player = player
        }
        controller.onPrevious = onPrevious
        controller.onNext = onNext
        controller.onVisible = onVisible
        controller.isTransitioning = isTransitioning
        controller.allowsNavigationWhileStopped = allowsNavigationWhileStopped
        controller.danmakuController.configure(
            aweme: aweme,
            player: player,
            cookie: cookie,
            playbackToken: playbackToken
        )
    }

    static func dismantleUIViewController(
        _ controller: DouyinPlayerViewController,
        coordinator: ()
    ) {
        controller.onPrevious = nil
        controller.onNext = nil
        controller.onVisible = nil
        controller.danmakuController.stop()
        PlaybackDiagnostics.shared.event(
            "dismantle",
            category: "controller",
            fields: [
                "controller": controller.diagnosticsID,
                "hasPlayer": controller.player != nil
            ]
        )
    }
}
