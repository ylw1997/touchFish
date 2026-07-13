import SwiftUI
import AVKit

@MainActor
final class PlayerManager: ObservableObject {
    let player = AVPlayer()

    private var currentAwemeId: String?
    private var playbackGeneration: UInt = 0
    
    func setup(aweme: Aweme) {
        if currentAwemeId == aweme.aweme_id, player.currentItem != nil {
            player.play()
            return
        }

        playbackGeneration &+= 1
        let generation = playbackGeneration
        stopCurrentItem()
        currentAwemeId = aweme.aweme_id

        let urls = aweme.video?.play_addr?.url_list ?? []
        let sortedUrls = urls.compactMap { URL(string: $0) }.sorted { url1, url2 in
            let score1 = score(for: url1.absoluteString)
            let score2 = score(for: url2.absoluteString)
            return score1 > score2
        }

        guard let playURL = sortedUrls.first else {
            currentAwemeId = nil
            return
        }

        let headers: [String: String] = [
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.douyin.com/"
        ]

        let asset = AVURLAsset(
            url: playURL,
            options: ["AVURLAssetHTTPHeaderFieldsKey": headers]
        )
        let playerItem = AVPlayerItem(asset: asset)
        playerItem.externalMetadata = playbackMetadata(for: aweme)

        guard generation == playbackGeneration else { return }

        player.replaceCurrentItem(with: playerItem)
        player.automaticallyWaitsToMinimizeStalling = true
        player.play()
    }
    
    func cleanup() {
        playbackGeneration &+= 1
        stopCurrentItem()
        currentAwemeId = nil
    }

    private func stopCurrentItem() {
        player.pause()
        player.replaceCurrentItem(with: nil)
    }
    
    private func score(for url: String) -> Int {
        if url.contains("/aweme/v1/play/") { return 3 }
        if url.contains("douyinvod.com") { return 2 }
        if url.contains("douyin.com") { return 1 }
        return 0
    }

    private func playbackMetadata(for aweme: Aweme) -> [AVMetadataItem] {
        [
            metadataItem(
                identifier: .commonIdentifierTitle,
                value: aweme.desc ?? "无描述"
            ),
            metadataItem(
                identifier: .iTunesMetadataTrackSubTitle,
                value: aweme.author?.nickname ?? "未知作者"
            )
        ]
    }

    private func metadataItem(identifier: AVMetadataIdentifier, value: String) -> AVMetadataItem {
        let item = AVMutableMetadataItem()
        item.identifier = identifier
        item.value = value as NSString
        item.extendedLanguageTag = "zh-Hans"
        return item.copy() as! AVMetadataItem
    }
    
}

struct VideoPlayerView: View {
    let aweme: Aweme
    var onPrevious: (() -> Void)? = nil
    var onNext: (() -> Void)? = nil

    @StateObject private var manager = PlayerManager()
    init(
        aweme: Aweme,
        onPrevious: (() -> Void)? = nil,
        onNext: (() -> Void)? = nil
    ) {
        self.aweme = aweme
        self.onPrevious = onPrevious
        self.onNext = onNext
    }
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            NativeAVPlayerView(
                player: manager.player,
                onPrevious: onPrevious,
                onNext: onNext
            )
            .ignoresSafeArea()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .onAppear {
            manager.setup(aweme: aweme)
        }
        .onDisappear {
            manager.cleanup()
        }
        .onChange(of: aweme.aweme_id) { _ in
            manager.setup(aweme: aweme)
        }
        .onReceive(NotificationCenter.default.publisher(for: .AVPlayerItemDidPlayToEndTime)) { notification in
            guard let item = notification.object as? AVPlayerItem, item == manager.player.currentItem else { return }
            onNext?()
        }
    }
}

private final class PlayerFocusAnchorView: UIView {
    override var canBecomeFocused: Bool { true }
}

final class RemotePlayerViewController: AVPlayerViewController {
    var onPrevious: (() -> Void)?
    var onNext: (() -> Void)?
    private var prefersPlayerFocus = true
    private let focusAnchor = PlayerFocusAnchorView()

    override var preferredFocusEnvironments: [UIFocusEnvironment] {
        prefersPlayerFocus ? [focusAnchor] : super.preferredFocusEnvironments
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        focusAnchor.translatesAutoresizingMaskIntoConstraints = false
        focusAnchor.backgroundColor = .clear
        focusAnchor.isAccessibilityElement = false
        view.addSubview(focusAnchor)
        NSLayoutConstraint.activate([
            focusAnchor.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            focusAnchor.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            focusAnchor.widthAnchor.constraint(equalToConstant: 1),
            focusAnchor.heightAnchor.constraint(equalToConstant: 1)
        ])
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        DispatchQueue.main.async { [weak self] in
            self?.requestPlayerFocus()
        }
    }

    func requestPlayerFocus() {
        prefersPlayerFocus = true
        setNeedsFocusUpdate()
        updateFocusIfNeeded()
        prefersPlayerFocus = false
    }

    override func pressesBegan(
        _ presses: Set<UIPress>,
        with event: UIPressesEvent?
    ) {
        guard shouldHandleVideoNavigation else {
            super.pressesBegan(presses, with: event)
            return
        }

        var unhandledPresses = presses
        for press in presses {
            switch press.type {
            case .upArrow:
                onPrevious?()
                unhandledPresses.remove(press)
            case .downArrow:
                onNext?()
                unhandledPresses.remove(press)
            default:
                break
            }
        }

        if !unhandledPresses.isEmpty {
            super.pressesBegan(unhandledPresses, with: event)
        }
    }

    private var shouldHandleVideoNavigation: Bool {
        guard let player,
              player.timeControlStatus != .paused else {
            return false
        }

        return !isPlaybackControlFocused
    }

    private var isPlaybackControlFocused: Bool {
        guard var focusedView = UIFocusSystem.focusSystem(for: view)?.focusedItem as? UIView else {
            return false
        }

        while focusedView !== view {
            if focusedView is UIControl
                || focusedView.accessibilityTraits.contains(.button)
                || focusedView.accessibilityTraits.contains(.adjustable) {
                return true
            }

            guard let superview = focusedView.superview else { break }
            focusedView = superview
        }

        return false
    }
}

struct NativeAVPlayerView: UIViewControllerRepresentable {
    let player: AVPlayer
    let onPrevious: (() -> Void)?
    let onNext: (() -> Void)?
    
    func makeUIViewController(context: Context) -> RemotePlayerViewController {
        let controller = RemotePlayerViewController()
        controller.player = player
        controller.showsPlaybackControls = true
        controller.transportBarIncludesTitleView = true
        controller.onPrevious = onPrevious
        controller.onNext = onNext
        return controller
    }
    
    func updateUIViewController(_ uiViewController: RemotePlayerViewController, context: Context) {
        if uiViewController.player !== player {
            uiViewController.player = player
        }
        uiViewController.transportBarIncludesTitleView = true
        uiViewController.onPrevious = onPrevious
        uiViewController.onNext = onNext
    }
}
