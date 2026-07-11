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
    var onLikeChanged: ((String, Bool) -> Void)? = nil

    @EnvironmentObject private var api: DouyinAPI
    @StateObject private var manager = PlayerManager()
    @State private var isLiked: Bool
    @State private var isLiking: Bool = false
    @State private var showCommentsOverlay: Bool = false
    @State private var wasPlayingBeforeComments: Bool = false
    @State private var showAuthorWorks: Bool = false
    @State private var authorImage: UIImage?
    @State private var actionError: String?

    init(
        aweme: Aweme,
        onPrevious: (() -> Void)? = nil,
        onNext: (() -> Void)? = nil,
        onLikeChanged: ((String, Bool) -> Void)? = nil
    ) {
        self.aweme = aweme
        self.onPrevious = onPrevious
        self.onNext = onNext
        self.onLikeChanged = onLikeChanged
        _isLiked = State(initialValue: aweme.user_digg == 1)
    }
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            NativeAVPlayerView(
                player: manager.player,
                isLiked: $isLiked,
                showCommentsOverlay: $showCommentsOverlay,
                authorName: aweme.author?.nickname ?? "作者主页",
                authorImage: authorImage,
                isLiking: isLiking,
                blocksVideoNavigation: showCommentsOverlay,
                onOpenAuthor: openAuthorWorks,
                onToggleLike: toggleLike,
                onPrevious: onPrevious,
                onNext: onNext
            )
            .ignoresSafeArea()
            
            if showCommentsOverlay {
                HStack {
                    Spacer()
                    CommentsView(
                        awemeId: aweme.aweme_id,
                        onClose: closeComments
                    )
                }
                .transition(.move(edge: .trailing))
                .zIndex(100)
            }

            if let actionError {
                VStack {
                    Spacer()
                    Text(actionError)
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 14)
                        .background(Color.red.opacity(0.85))
                        .cornerRadius(12)
                        .padding(.bottom, 70)
                }
                .allowsHitTesting(false)
                .zIndex(200)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .onAppear {
            manager.setup(aweme: aweme)
        }
        .onDisappear {
            manager.cleanup()
        }
        .onChange(of: aweme.aweme_id) { _ in
            isLiked = aweme.user_digg == 1
            showCommentsOverlay = false
            manager.setup(aweme: aweme)
        }
        .onChange(of: showCommentsOverlay) { isPresented in
            if isPresented {
                wasPlayingBeforeComments = manager.player.timeControlStatus != .paused
                manager.player.pause()
            } else if wasPlayingBeforeComments {
                manager.player.play()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .AVPlayerItemDidPlayToEndTime)) { notification in
            guard let item = notification.object as? AVPlayerItem, item == manager.player.currentItem else { return }
            onNext?()
        }
        .task(id: aweme.author?.avatar_thumb?.url_list?.first) {
            await loadAuthorImage()
        }
        .fullScreenCover(isPresented: $showAuthorWorks) {
            if let author = aweme.author {
                AuthorWorksView(author: author) {
                    showAuthorWorks = false
                }
            }
        }
    }

    private func closeComments() {
        withAnimation {
            showCommentsOverlay = false
        }
    }

    private func openAuthorWorks() {
        guard aweme.author != nil else {
            showActionError("当前视频没有作者信息")
            return
        }
        showAuthorWorks = true
    }

    private func toggleLike() {
        guard !isLiking else { return }
        isLiking = true
        let targetLiked = !isLiked

        Task {
            do {
                try await api.likeVideo(awemeId: aweme.aweme_id, type: targetLiked ? 1 : 0)
                isLiked = targetLiked
                onLikeChanged?(aweme.aweme_id, targetLiked)
            } catch {
                showActionError("喜欢操作失败：\(error.localizedDescription)")
            }
            isLiking = false
        }
    }

    private func showActionError(_ message: String) {
        actionError = message
        Task {
            try? await Task.sleep(nanoseconds: 2_500_000_000)
            if actionError == message {
                actionError = nil
            }
        }
    }

    private func loadAuthorImage() async {
        authorImage = nil
        guard
            let urlString = aweme.author?.avatar_thumb?.url_list?.first,
            let url = URL(string: urlString)
        else { return }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            guard !Task.isCancelled else { return }
            authorImage = UIImage(data: data)?.withRenderingMode(.alwaysOriginal)
        } catch {
            // 头像失败时保留系统人物图标，不影响作者主页入口。
        }
    }
}

private final class PlayerFocusAnchorView: UIView {
    override var canBecomeFocused: Bool { true }
}

final class RemotePlayerViewController: AVPlayerViewController {
    var onPrevious: (() -> Void)?
    var onNext: (() -> Void)?
    var blocksVideoNavigation = false
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
        guard !blocksVideoNavigation,
              let player,
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
    @Binding var isLiked: Bool
    @Binding var showCommentsOverlay: Bool
    let authorName: String
    let authorImage: UIImage?
    let isLiking: Bool
    let blocksVideoNavigation: Bool
    let onOpenAuthor: () -> Void
    let onToggleLike: () -> Void
    let onPrevious: (() -> Void)?
    let onNext: (() -> Void)?
    
    func makeUIViewController(context: Context) -> RemotePlayerViewController {
        let controller = RemotePlayerViewController()
        controller.player = player
        controller.showsPlaybackControls = true
        controller.transportBarIncludesTitleView = true
        controller.onPrevious = onPrevious
        controller.onNext = onNext
        controller.blocksVideoNavigation = blocksVideoNavigation
        
        updateTransportBarMenuItems(controller: controller)
        return controller
    }
    
    func updateUIViewController(_ uiViewController: RemotePlayerViewController, context: Context) {
        if uiViewController.player !== player {
            uiViewController.player = player
        }
        uiViewController.transportBarIncludesTitleView = true
        uiViewController.onPrevious = onPrevious
        uiViewController.onNext = onNext
        let wasBlockingNavigation = uiViewController.blocksVideoNavigation
        uiViewController.blocksVideoNavigation = blocksVideoNavigation
        updateTransportBarMenuItems(controller: uiViewController)
        if wasBlockingNavigation && !blocksVideoNavigation {
            uiViewController.requestPlayerFocus()
        }
    }
    
    private func updateTransportBarMenuItems(controller: RemotePlayerViewController) {
        let authorAction = UIAction(
            title: authorName,
            image: authorImage ?? UIImage(systemName: "person.crop.circle.fill")
        ) { _ in
            onOpenAuthor()
        }
        let likeAction = UIAction(
            title: isLiked ? "取消喜欢" : "喜欢",
            image: UIImage(systemName: isLiked ? "heart.fill" : "heart"),
            attributes: isLiking ? .disabled : []
        ) { _ in
            onToggleLike()
        }
        let commentAction = UIAction(title: "评论", image: UIImage(systemName: "message.fill")) { _ in
            withAnimation { showCommentsOverlay.toggle() }
        }
        controller.transportBarCustomMenuItems = [authorAction, likeAction, commentAction]
    }
}
