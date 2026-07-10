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
    @State private var isLiked: Bool = false
    @State private var showCommentsOverlay: Bool = false
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            NativeAVPlayerView(
                player: manager.player,
                isLiked: $isLiked,
                showCommentsOverlay: $showCommentsOverlay,
                onPrevious: onPrevious,
                onNext: onNext
            )
            .ignoresSafeArea()
            
            if showCommentsOverlay {
                HStack {
                    Spacer()
                    VStack {
                        Text("评论区")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.top, 40)
                            .padding(.bottom, 10)
                        CommentsListSmallView(awemeId: aweme.aweme_id)
                    }
                    .frame(width: 450)
                    .background(Color.black.opacity(0.6).background(.ultraThinMaterial))
                    .ignoresSafeArea()
                }
                .transition(.move(edge: .trailing))
                .zIndex(100)
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
            manager.setup(aweme: aweme)
        }
        .onReceive(NotificationCenter.default.publisher(for: .AVPlayerItemDidPlayToEndTime)) { notification in
            guard let item = notification.object as? AVPlayerItem, item == manager.player.currentItem else { return }
            onNext?()
        }
    }
}

final class RemotePlayerViewController: AVPlayerViewController {
    var onPrevious: (() -> Void)?
    var onNext: (() -> Void)?

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
        guard let player, player.timeControlStatus != .paused else {
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
    let onPrevious: (() -> Void)?
    let onNext: (() -> Void)?
    
    func makeUIViewController(context: Context) -> RemotePlayerViewController {
        let controller = RemotePlayerViewController()
        controller.player = player
        controller.showsPlaybackControls = true
        controller.transportBarIncludesTitleView = true
        controller.onPrevious = onPrevious
        controller.onNext = onNext
        
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
        updateTransportBarMenuItems(controller: uiViewController)
    }
    
    private func updateTransportBarMenuItems(controller: RemotePlayerViewController) {
        var menuItems: [UIMenuElement] = []

        if let onPrevious {
            menuItems.append(UIAction(
                title: "上一个视频",
                image: UIImage(systemName: "backward.end.fill")
            ) { _ in
                onPrevious()
            })
        }

        if let onNext {
            menuItems.append(UIAction(
                title: "下一个视频",
                image: UIImage(systemName: "forward.end.fill")
            ) { _ in
                onNext()
            })
        }

        let likeAction = UIAction(title: "喜欢", image: UIImage(systemName: isLiked ? "heart.fill" : "heart")) { _ in
            isLiked.toggle()
        }
        let commentAction = UIAction(title: "评论", image: UIImage(systemName: "message.fill")) { _ in
            withAnimation { showCommentsOverlay.toggle() }
        }
        menuItems.append(contentsOf: [likeAction, commentAction])
        controller.transportBarCustomMenuItems = menuItems
    }
}


struct CommentsListSmallView: View {
    let awemeId: String
    @EnvironmentObject var api: DouyinAPI
    @State private var comments: [Comment] = []
    @State private var isLoading: Bool = false
    
    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 15) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .padding(.top, 50)
                } else if comments.isEmpty {
                    Text("暂无评论")
                        .foregroundColor(.gray)
                        .padding(.top, 50)
                } else {
                    ForEach(comments) { comment in
                        VStack(alignment: .leading, spacing: 5) {
                            HStack {
                                AsyncImage(url: URL(string: comment.user?.avatar_thumb?.url_list?.first ?? "")) { img in
                                    img.resizable()
                                } placeholder: {
                                    Circle().fill(Color.gray.opacity(0.3))
                                }
                                .frame(width: 24, height: 24)
                                .clipShape(Circle())
                                
                                Text(comment.user?.nickname ?? "未知用户")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(.gray)
                            }
                            
                            Text(comment.text ?? "")
                                .font(.system(size: 14))
                                .foregroundColor(.white.opacity(0.9))
                                .lineLimit(nil)
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(.leading, 32)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
        }
        .onAppear {
            Task {
                isLoading = true
                let (list, _, _, _) = await api.getComments(awemeId: awemeId, cursor: 0)
                await MainActor.run {
                    self.comments = list
                    self.isLoading = false
                }
            }
        }
    }
}
