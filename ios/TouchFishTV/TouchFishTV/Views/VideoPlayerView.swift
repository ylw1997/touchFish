import SwiftUI
import AVKit

class PlayerManager: ObservableObject {
    @Published var player: AVPlayer?
    private var currentAwemeId: String?
    
    func setup(aweme: Aweme) {
        // 防止 LazyVStack 复用 View 时导致播放旧视频的 Bug
        if player != nil && currentAwemeId == aweme.aweme_id {
            player?.play()
            return
        }
        
        cleanup()
        currentAwemeId = aweme.aweme_id
        
        let playUrlStr = aweme.video?.play_addr?.url_list?.first
        guard let urlStr = playUrlStr, let playUrl = URL(string: urlStr) else { return }
        
        let headers: [String: String] = [
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.douyin.com/"
        ]
        
        let asset = AVURLAsset(url: playUrl, options: ["AVURLAssetHTTPHeaderFieldsKey": headers])
        let playerItem = AVPlayerItem(asset: asset)
        
        let titleItem = AVMutableMetadataItem()
        titleItem.identifier = .commonIdentifierTitle
        titleItem.value = aweme.desc as (NSCopying & NSObjectProtocol)?
        titleItem.extendedLanguageTag = "und"
        
        let authorItem = AVMutableMetadataItem()
        authorItem.identifier = .iTunesMetadataTrackSubTitle
        authorItem.value = aweme.author?.nickname as (NSCopying & NSObjectProtocol)?
        authorItem.extendedLanguageTag = "und"
        
        playerItem.externalMetadata = [titleItem, authorItem]
        
        let newPlayer = AVPlayer(playerItem: playerItem)
        newPlayer.automaticallyWaitsToMinimizeStalling = true
        self.player = newPlayer
        newPlayer.play()
        
        NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: newPlayer.currentItem, queue: .main) { _ in
            newPlayer.seek(to: .zero)
            newPlayer.play()
        }
    }
    
    func play() {
        player?.play()
    }
    
    func pause() {
        player?.pause()
    }
    
    func cleanup() {
        player?.pause()
        player = nil
        currentAwemeId = nil
    }
}

struct VideoPlayerView: View {
    let aweme: Aweme
    let playlist: [Aweme]
    var isModal: Bool = false
    let onClose: () -> Void
    var isActive: Bool = true
    
    @EnvironmentObject var api: DouyinAPI
    @StateObject private var manager = PlayerManager()
    @State private var isLiked: Bool = false
    @State private var showCommentsOverlay: Bool = false
    @State private var showAuthorWorks: Bool = false
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            if isActive {
                if let player = manager.player {
                    // 原生播放器完全接管焦点
                    NativeAVPlayerView(
                        player: player,
                        aweme: aweme,
                        isLiked: $isLiked,
                        showCommentsOverlay: $showCommentsOverlay,
                        showAuthorWorks: $showAuthorWorks
                    )
                    .ignoresSafeArea()
                } else {
                    ProgressView("正在缓冲...")
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                }
            } else {
                // 封面图，同时承担未激活时的背景
                AsyncImage(url: URL(string: aweme.video?.cover?.url_list?.first ?? "")) { img in
                    img.resizable().aspectRatio(contentMode: .fit)
                } placeholder: {
                    Color.black
                }
                .ignoresSafeArea()
                .focusable(true) // 当未激活时，让当前外层包裹器可聚焦，以便滚动
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

// 核心逻辑：拦截上下滑动及按键，转换为换视频指令
class CustomPlayerViewController: AVPlayerViewController, UIGestureRecognizerDelegate {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let swipeDown = UISwipeGestureRecognizer(target: self, action: #selector(handleSwipeDown))
        swipeDown.direction = .down
        swipeDown.delegate = self
        self.view.addGestureRecognizer(swipeDown)
        
        let swipeUp = UISwipeGestureRecognizer(target: self, action: #selector(handleSwipeUp))
        swipeUp.direction = .up
        swipeUp.delegate = self
        self.view.addGestureRecognizer(swipeUp)
    }
    
    // 拦截物理遥控器的点击（模拟器键盘上下键也会触发这里）
    override func pressesBegan(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
        var handled = false
        for press in presses {
            if press.type == .upArrow {
                if !isControlFocused() {
                    NotificationCenter.default.post(name: NSNotification.Name("requestScrollToPrevious"), object: nil)
                    handled = true
                }
            } else if press.type == .downArrow {
                if !isControlFocused() {
                    NotificationCenter.default.post(name: NSNotification.Name("requestScrollToNext"), object: nil)
                    handled = true
                }
            }
        }
        if !handled {
            super.pressesBegan(presses, with: event)
        }
    }
    
    @objc func handleSwipeDown() {
        if isControlFocused() { return }
        NotificationCenter.default.post(name: NSNotification.Name("requestScrollToNext"), object: nil)
    }
    
    @objc func handleSwipeUp() {
        if isControlFocused() { return }
        NotificationCenter.default.post(name: NSNotification.Name("requestScrollToPrevious"), object: nil)
    }
    
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
        // 允许与其他原生手势共存
        return true
    }
    
    private func isControlFocused() -> Bool {
        guard let focusSystem = UIFocusSystem.focusSystem(for: self.view),
              let focusedItem = focusSystem.focusedItem else {
            return false
        }
        
        // 全屏背景视图的高度是 1080。如果当前聚焦的视图高度远小于全屏（比如按钮、进度条等控件，或者隐藏的焦点引导 FocusGuide），则判定为控件正在操作中！
        // 阈值设为 800，足以区分出任何原生的进度条或功能按钮。
        if focusedItem.frame.height < 800 {
            return true
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
    
    func makeUIViewController(context: Context) -> CustomPlayerViewController {
        let controller = CustomPlayerViewController()
        controller.player = player
        controller.showsPlaybackControls = true // 永远允许显示控件，交由苹果原生管理
        
        let titleItem = AVMutableMetadataItem()
        titleItem.identifier = .commonIdentifierTitle
        titleItem.value = aweme.desc as (NSCopying & NSObjectProtocol)?
        titleItem.extendedLanguageTag = "und"
        
        let authorItem = AVMutableMetadataItem()
        authorItem.identifier = .iTunesMetadataTrackSubTitle
        authorItem.value = aweme.author?.nickname as (NSCopying & NSObjectProtocol)?
        authorItem.extendedLanguageTag = "und"
        
        controller.player?.currentItem?.externalMetadata = [titleItem, authorItem]
        
        updateTransportBarMenuItems(controller: controller)
        return controller
    }
    
    func updateUIViewController(_ uiViewController: CustomPlayerViewController, context: Context) {
        if uiViewController.player != player {
            uiViewController.player = player
        }
        
        // 只有当状态发生变化时才更新（避免打断正在点击的 UIAction）
        // 对于 SwiftUI -> UIAction，直接重建可能会导致焦点丢失，但为简单起见目前这么写
        updateTransportBarMenuItems(controller: uiViewController)
    }
    
    private func updateTransportBarMenuItems(controller: CustomPlayerViewController) {
        let likeAction = UIAction(title: "喜欢", image: UIImage(systemName: isLiked ? "heart.fill" : "heart")) { _ in isLiked.toggle() }
        let commentAction = UIAction(title: "评论", image: UIImage(systemName: "message.fill")) { _ in withAnimation { showCommentsOverlay.toggle() } }
        let authorAction = UIAction(title: "主页", image: UIImage(systemName: "person.crop.circle.fill")) { _ in showAuthorWorks = true }
        
        controller.transportBarCustomMenuItems = [likeAction, commentAction, authorAction]
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
