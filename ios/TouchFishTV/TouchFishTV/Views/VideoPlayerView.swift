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
                authorName: aweme.author?.nickname,
                onShowAuthor: aweme.author?.uid.isEmpty == false ? onShowAuthor : nil,
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
        // AVPlayerViewController 的标题字体不能单独设置；使用公开的动态字号
        // trait 缩小原生信息区，同时继续保留系统进度条与控制栏。
        traitOverrides.preferredContentSizeCategory = .medium
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

    func configureAuthorAction(name: String?, action: (() -> Void)?) {
        onShowAuthor = action
        danmakuController.synchronizePreference()
        let normalizedName = name?.trimmingCharacters(in: .whitespacesAndNewlines)
        let hasAuthorAction = action != nil
        let danmakuEnabled = danmakuController.isEnabled
        guard configuredAuthorName != normalizedName
                || configuredHasAuthorAction != hasAuthorAction
                || configuredDanmakuEnabled != danmakuEnabled
                || transportBarCustomMenuItems.isEmpty else {
            return
        }

        configuredAuthorName = normalizedName
        configuredHasAuthorAction = hasAuthorAction
        configuredDanmakuEnabled = danmakuEnabled
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
    let isTransitioning: Bool
    let allowsNavigationWhileStopped: Bool
    let onPrevious: () -> Void
    let onNext: () -> Void
    let authorName: String?
    let onShowAuthor: (() -> Void)?
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
        controller.configureAuthorAction(name: authorName, action: onShowAuthor)
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
