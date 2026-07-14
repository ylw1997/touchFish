import AVKit
import SwiftUI
import UIKit

@MainActor
struct VideoPlayerView: View {
    @EnvironmentObject private var coordinator: PlaybackCoordinator

    let aweme: Aweme
    let cookie: String
    let playbackToken: UInt64
    let source: PlaybackOwner.Source
    let onPrevious: () -> Void
    let onNext: () -> Void

    @State private var ownerID = UUID()

    private var owner: PlaybackOwner {
        PlaybackOwner(id: ownerID, source: source)
    }

    var body: some View {
        ZStack {
            NativePlayerController(
                player: coordinator.player,
                aweme: aweme,
                cookie: cookie,
                playbackToken: playbackToken,
                isTransitioning: coordinator.isTransitioning,
                isPlaybackOwner: coordinator.isOwned(by: owner),
                allowsNavigationWhileStopped: coordinator.playbackError != nil,
                onPrevious: onPrevious,
                onNext: onNext
            )

            if let playbackError = coordinator.playbackError,
               coordinator.isOwned(by: owner) {
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
        .onAppear {
            coordinator.play(aweme, cookie: cookie, playbackToken: playbackToken, owner: owner)
        }
        .onChange(of: playbackToken) { _, token in
            coordinator.play(aweme, cookie: cookie, playbackToken: token, owner: owner)
        }
        .onReceive(NotificationCenter.default.publisher(for: .AVPlayerItemDidPlayToEndTime)) { notification in
            guard let item = notification.object as? AVPlayerItem,
                  item === coordinator.player.currentItem,
                  coordinator.isOwned(by: owner) else { return }
            onNext()
        }
        .onDisappear { coordinator.stop(owner: owner) }
    }
}

private final class FocusAnchorView: UIView {
    override var canBecomeFocused: Bool { true }
}

final class DouyinPlayerViewController: AVPlayerViewController {
    var onPrevious: (() -> Void)?
    var onNext: (() -> Void)?
    var isTransitioning = false
    var isPlaybackOwner = false
    var allowsNavigationWhileStopped = false
    let danmakuController = DanmakuOverlayController()

    private let focusAnchor = FocusAnchorView()
    private var prefersPlayerFocus = true
    private var navigationLocked = false

    override var preferredFocusEnvironments: [UIFocusEnvironment] {
        prefersPlayerFocus ? [focusAnchor] : super.preferredFocusEnvironments
    }

    override func viewDidLoad() {
        super.viewDidLoad()
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
        DispatchQueue.main.async { [weak self] in self?.requestPlayerFocus() }
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
                lockNavigationBriefly()
                onPrevious?()
                remaining.remove(press)
            case .downArrow:
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
        guard isPlaybackOwner, !isTransitioning, !navigationLocked,
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
    let player: AVPlayer
    let aweme: Aweme
    let cookie: String
    let playbackToken: UInt64
    let isTransitioning: Bool
    let isPlaybackOwner: Bool
    let allowsNavigationWhileStopped: Bool
    let onPrevious: () -> Void
    let onNext: () -> Void

    func makeUIViewController(context: Context) -> DouyinPlayerViewController {
        let controller = DouyinPlayerViewController()
        configure(controller)
        return controller
    }

    func updateUIViewController(_ controller: DouyinPlayerViewController, context: Context) {
        configure(controller)
    }

    private func configure(_ controller: DouyinPlayerViewController) {
        controller.onPrevious = onPrevious
        controller.onNext = onNext
        controller.isTransitioning = isTransitioning
        controller.isPlaybackOwner = isPlaybackOwner
        controller.allowsNavigationWhileStopped = allowsNavigationWhileStopped

        guard isPlaybackOwner else {
            controller.danmakuController.stop()
            controller.player = nil
            return
        }

        if controller.player !== player { controller.player = player }
        controller.danmakuController.configure(
            aweme: aweme,
            player: player,
            cookie: cookie,
            playbackToken: playbackToken
        )
    }

    static func dismantleUIViewController(_ controller: DouyinPlayerViewController, coordinator: ()) {
        controller.danmakuController.stop()
        controller.player = nil
    }
}
