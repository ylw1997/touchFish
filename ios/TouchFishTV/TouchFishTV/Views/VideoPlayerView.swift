import SwiftUI
import AVKit

@MainActor
final class PlayerManager: ObservableObject {
    let player = AVQueuePlayer()

    private var playerLooper: AVPlayerLooper?
    private var currentAwemeId: String?
    private var playbackGeneration: UInt = 0
    
    func setup(aweme: Aweme) {
        if currentAwemeId == aweme.aweme_id, !player.items().isEmpty {
            player.play()
            return
        }

        playbackGeneration &+= 1
        let generation = playbackGeneration
        stopCurrentItem()
        currentAwemeId = aweme.aweme_id

        guard
            let urlString = aweme.video?.play_addr?.url_list?.first,
            let playURL = URL(string: urlString)
        else {
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

        guard generation == playbackGeneration else { return }

        playerLooper = AVPlayerLooper(player: player, templateItem: playerItem)
        player.automaticallyWaitsToMinimizeStalling = true
        player.play()
    }
    
    func play() {
        player.play()
    }
    
    func pause() {
        player.pause()
    }
    
    func cleanup() {
        playbackGeneration &+= 1
        stopCurrentItem()
        currentAwemeId = nil
    }

    private func stopCurrentItem() {
        player.pause()
        playerLooper?.disableLooping()
        playerLooper = nil
        player.removeAllItems()
    }
    
    deinit {
        cleanup()
    }
}

struct VideoPlayerView: View {
    let aweme: Aweme
    let playlist: [Aweme]
    var isModal: Bool = false
    let onClose: () -> Void
    var isActive: Bool = true
    var onPrevious: (() -> Void)? = nil
    var onNext: (() -> Void)? = nil
    
    @EnvironmentObject var api: DouyinAPI
    @StateObject private var manager = PlayerManager()
    @State private var isLiked: Bool = false
    @State private var showCommentsOverlay: Bool = false
    @State private var showAuthorWorks: Bool = false
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            if isActive {
                NativeAVPlayerView(
                    player: manager.player,
                    aweme: aweme,
                    isLiked: $isLiked,
                    showCommentsOverlay: $showCommentsOverlay,
                    showAuthorWorks: $showAuthorWorks,
                    onPrevious: onPrevious,
                    onNext: onNext
                )
                .ignoresSafeArea()
            } else {
                // 封面图，同时承担未激活时的背景
                AsyncImage(url: URL(string: aweme.video?.cover?.url_list?.first ?? "")) { img in
                    img.resizable().aspectRatio(contentMode: .fit)
                } placeholder: {
                    Color.black
                }
                .ignoresSafeArea()
            }
            
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
            if isActive { 
                if manager.player == nil {
                    manager.setup(aweme: aweme) 
                } else {
                    manager.play()
                }
            } 
        }
        .onDisappear { 
            // 切换 Tab 时只暂停，不销毁，避免返回时重新加载导致严重卡顿
            manager.pause() 
        }
        .onChange(of: aweme.aweme_id) { _ in
            if isActive {
                manager.setup(aweme: aweme)
            }
        }
        .onChange(of: isActive) { active in
            if active { 
                if manager.player == nil {
                    manager.setup(aweme: aweme) 
                } else {
                    manager.play()
                }
            } else { 
                manager.cleanup() // 只有当滚动离开当前视频时才销毁
            }
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
        guard !isPlaybackControlFocused else {
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
    let aweme: Aweme
    @Binding var isLiked: Bool
    @Binding var showCommentsOverlay: Bool
    @Binding var showAuthorWorks: Bool
    let onPrevious: (() -> Void)?
    let onNext: (() -> Void)?
    
    func makeUIViewController(context: Context) -> RemotePlayerViewController {
        let controller = RemotePlayerViewController()
        controller.player = player
        controller.showsPlaybackControls = true
        controller.onPrevious = onPrevious
        controller.onNext = onNext
        
        updateTransportBarMenuItems(controller: controller)
        return controller
    }
    
    func updateUIViewController(_ uiViewController: RemotePlayerViewController, context: Context) {
        if uiViewController.player !== player {
            uiViewController.player = player
        }
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
        let authorAction = UIAction(title: "主页", image: UIImage(systemName: "person.crop.circle.fill")) { _ in
            showAuthorWorks = true
        }
        
        menuItems.append(contentsOf: [likeAction, commentAction, authorAction])
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
