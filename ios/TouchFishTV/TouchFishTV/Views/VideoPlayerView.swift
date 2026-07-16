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
    let onShowAuthor: (() -> Void)?

    init(
        aweme: Aweme,
        cookie: String,
        playbackToken: UInt64,
        coordinator: PlaybackCoordinator,
        onPrevious: @escaping () -> Void,
        onNext: @escaping () -> Void,
        onShowAuthor: (() -> Void)? = nil
    ) {
        self.aweme = aweme
        self.cookie = cookie
        self.playbackToken = playbackToken
        self.coordinator = coordinator
        self.onPrevious = onPrevious
        self.onNext = onNext
        self.onShowAuthor = onShowAuthor
    }

    var body: some View {
        ZStack {
            NativePlayerController(
                controller: coordinator.playerViewController,
                isTransitioning: coordinator.isTransitioning,
                allowsNavigationWhileStopped: coordinator.playbackError != nil,
                onPrevious: onPrevious,
                onNext: onNext,
                authorName: aweme.displayAuthor?.nickname,
                onShowAuthor: aweme.displayAuthor?.uid.isEmpty == false ? onShowAuthor : nil,
                danmakuAvailable: !aweme.isLive,
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
    var onShowAuthor: (() -> Void)?
    var onVisible: (() -> Void)?
    var isTransitioning = false
    var allowsNavigationWhileStopped = false
    let danmakuController = DanmakuOverlayController()

    private let focusAnchor = FocusAnchorView()
    private var prefersPlayerFocus = true
    private var navigationLocked = false
    private var configuredAuthorName: String?
    private var configuredHasAuthorAction = false
    private var configuredDanmakuEnabled: Bool?
    private var configuredDanmakuAvailable = true
    private enum NavigationDirection {
        case previous
        case next
    }

    private struct PendingNavigation {
        let direction: NavigationDirection
        let focusedView: ObjectIdentifier?
    }

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

    func configureAuthorAction(name: String?, action: (() -> Void)?, danmakuAvailable: Bool) {
        onShowAuthor = action
        if danmakuAvailable { danmakuController.synchronizePreference() }
        let normalizedName = name?.trimmingCharacters(in: .whitespacesAndNewlines)
        let hasAuthorAction = action != nil
        let danmakuEnabled = danmakuController.isEnabled
        guard configuredAuthorName != normalizedName
                || configuredHasAuthorAction != hasAuthorAction
                || configuredDanmakuEnabled != danmakuEnabled
                || configuredDanmakuAvailable != danmakuAvailable
                || transportBarCustomMenuItems.isEmpty else {
            return
        }

        configuredAuthorName = normalizedName
        configuredHasAuthorAction = hasAuthorAction
        configuredDanmakuEnabled = danmakuEnabled
        configuredDanmakuAvailable = danmakuAvailable
        rebuildTransportBarActions()
    }

    private func rebuildTransportBarActions() {
        var actions: [UIMenuElement] = []
        if onShowAuthor != nil {
            let userAction = UIAction(
                title: "用户",
                image: UIImage(systemName: "person.crop.circle")
            ) { [weak self] _ in
                self?.onShowAuthor?()
            }
            actions.append(userAction)
        }

        if configuredDanmakuAvailable {
            let danmakuEnabled = danmakuController.isEnabled
            configuredDanmakuEnabled = danmakuEnabled
            let danmakuAction = UIAction(
                title: danmakuEnabled ? "关闭弹幕" : "开启弹幕",
                image: UIImage(systemName: danmakuEnabled ? "captions.bubble.fill" : "captions.bubble")
            ) { [weak self] _ in
                guard let self else { return }
                danmakuController.setEnabled(!danmakuController.isEnabled)
                rebuildTransportBarActions()
            }
            actions.append(danmakuAction)
        }
        transportBarCustomMenuItems = actions
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
        guard canEvaluateVideoNavigation else {
            super.pressesBegan(presses, with: event)
            return
        }

        let focusedViewBeforePress = focusedViewIdentifier
        let pending = presses.compactMap { press -> PendingNavigation? in
            switch press.type {
            case .upArrow:
                return PendingNavigation(direction: .previous, focusedView: focusedViewBeforePress)
            case .downArrow:
                return PendingNavigation(direction: .next, focusedView: focusedViewBeforePress)
            default:
                return nil
            }
        }
        // 先让 AVPlayerViewController 和 tvOS 焦点系统完整处理方向键。
        // 下一轮主线程中焦点仍未移动，才把按键解释为视频切换。
        super.pressesBegan(presses, with: event)
        guard !pending.isEmpty else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
            guard let self, self.canEvaluateVideoNavigation else { return }
            for navigation in pending where navigation.focusedView == self.focusedViewIdentifier {
                self.performNavigation(navigation.direction)
                break
            }
        }
    }

    private func performNavigation(_ direction: NavigationDirection) {
        let event: String
        switch direction {
        case .previous: event = "navigate-previous"
        case .next: event = "navigate-next"
        }
        PlaybackDiagnostics.shared.event(
            event,
            category: "controller",
            fields: ["controller": diagnosticsID, "focusStayed": true]
        )
        lockNavigationBriefly()
        switch direction {
        case .previous: onPrevious?()
        case .next: onNext?()
        }
    }

    private func lockNavigationBriefly() {
        navigationLocked = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            self?.navigationLocked = false
        }
    }

    private var canEvaluateVideoNavigation: Bool {
        guard !isTransitioning, !navigationLocked,
              let player else { return false }
        guard player.timeControlStatus == .playing || allowsNavigationWhileStopped else { return false }
        return true
    }

    private var focusedViewIdentifier: ObjectIdentifier? {
        guard let focusedView = UIFocusSystem.focusSystem(for: view)?.focusedItem as? UIView else {
            return nil
        }
        return ObjectIdentifier(focusedView)
    }
}

struct NativePlayerController: UIViewControllerRepresentable {
    let controller: DouyinPlayerViewController
    let isTransitioning: Bool
    let allowsNavigationWhileStopped: Bool
    let onPrevious: () -> Void
    let onNext: () -> Void
    let authorName: String?
    let onShowAuthor: (() -> Void)?
    let danmakuAvailable: Bool
    let onVisible: () -> Void

    func makeUIViewController(context: Context) -> DouyinPlayerViewController {
        configure(controller)
        return controller
    }

    func updateUIViewController(_ controller: DouyinPlayerViewController, context: Context) {
        configure(controller)
    }

    private func configure(_ controller: DouyinPlayerViewController) {
        controller.onPrevious = onPrevious
        controller.onNext = onNext
        controller.onVisible = onVisible
        controller.configureAuthorAction(
            name: authorName,
            action: onShowAuthor,
            danmakuAvailable: danmakuAvailable
        )
        controller.isTransitioning = isTransitioning
        controller.allowsNavigationWhileStopped = allowsNavigationWhileStopped
    }

    static func dismantleUIViewController(
        _ controller: DouyinPlayerViewController,
        coordinator: ()
    ) {
        controller.onPrevious = nil
        controller.onNext = nil
        controller.onShowAuthor = nil
        controller.onVisible = nil
        controller.transportBarCustomMenuItems = []
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
