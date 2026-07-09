import SwiftUI
import AVKit

struct ControlButton: View {
    let icon: String
    var color: Color = .white
    let isFocused: Bool
    
    var body: some View {
        Image(systemName: icon)
            .font(.system(size: 26, weight: .medium))
            .foregroundColor(isFocused ? .black : color)
            .frame(width: 70, height: 70)
            .background(isFocused ? Color.white : Color.white.opacity(0.15))
            .clipShape(Circle())
            .scaleEffect(isFocused ? 1.15 : 1.0)
            .animation(.spring(), value: isFocused)
    }
}

struct VideoPlayerView: View {
    let aweme: Aweme
    let playlist: [Aweme]
    var isModal: Bool = false
    let onClose: () -> Void
    var isActive: Bool = true
    
    @EnvironmentObject var api: DouyinAPI
    @State private var player: AVPlayer?
    @State private var isLiked: Bool = false
    @State private var showCommentsOverlay: Bool = false
    @State private var showAuthorWorks: Bool = false
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            if isActive {
                if let player = player {
                    NativeAVPlayerView(player: player, aweme: aweme, isLiked: $isLiked, showCommentsOverlay: $showCommentsOverlay, showAuthorWorks: $showAuthorWorks)
                        .ignoresSafeArea()
                } else {
                    ProgressView("正在缓冲视频...")
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                }
            } else {
                AsyncImage(url: URL(string: aweme.video?.cover?.url_list?.first ?? "")) { img in
                    img.resizable()
                        .aspectRatio(contentMode: .fit)
                } placeholder: {
                    Color.black
                }
                .ignoresSafeArea()
            }
            
            // 右侧滑出的评论悬浮窗
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
            }
            
            // 模态关闭按钮
            if isModal {
                VStack {
                    HStack {
                        Button(action: onClose) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.white.opacity(0.6))
                        }
                        .buttonStyle(.plain)
                        .padding(40)
                        Spacer()
                    }
                    Spacer()
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .onAppear {
            if isActive {
                setupPlayer()
            }
        }
        .onDisappear {
            cleanupPlayer()
        }
        .onChange(of: isActive) { active in
            if active {
                setupPlayer()
            } else {
                cleanupPlayer()
            }
        }
    }
    
    private func setupPlayer() {
        guard player == nil else { return }
        
        let playUrlStr = aweme.video?.play_addr?.url_list?.first
        
        guard let urlStr = playUrlStr, let playUrl = URL(string: urlStr) else { return }
        
        let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
        let headers: [String: String] = [
            "User-Agent": userAgent,
            "Referer": "https://www.douyin.com/"
        ]
        
        let asset = AVURLAsset(url: playUrl, options: ["AVURLAssetHTTPHeaderFieldsKey": headers])
        let playerItem = AVPlayerItem(asset: asset)
        
        // 提取视频的基础元数据：标题与作者，赋值给 playerItem
        let titleItem = AVMutableMetadataItem()
        titleItem.identifier = .commonIdentifierTitle
        titleItem.value = aweme.desc as (NSCopying & NSObjectProtocol)?
        titleItem.extendedLanguageTag = "und"
        
        let authorItem = AVMutableMetadataItem()
        authorItem.identifier = .iTunesMetadataTrackSubTitle
        authorItem.value = aweme.author?.nickname as (NSCopying & NSObjectProtocol)?
        authorItem.extendedLanguageTag = "und"
        
        playerItem.externalMetadata = [titleItem, authorItem]
        
        let player = AVPlayer(playerItem: playerItem)
        player.automaticallyWaitsToMinimizeStalling = true // 允许缓冲，减少卡顿
        self.player = player
        
        player.play()
        
        // 视频循环播放监听
        NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: player.currentItem, queue: .main) { _ in
            player.seek(to: .zero)
            player.play()
        }
    }
    
    private func cleanupPlayer() {
        player?.pause()
        player = nil
    }
}

struct NativeAVPlayerView: UIViewControllerRepresentable {
    let player: AVPlayer
    let aweme: Aweme
    @Binding var isLiked: Bool
    @Binding var showCommentsOverlay: Bool
    @Binding var showAuthorWorks: Bool
    
    func makeUIViewController(context: Context) -> AVPlayerViewController {
        let controller = AVPlayerViewController()
        controller.player = player
        controller.showsPlaybackControls = true
        
        let titleItem = AVMutableMetadataItem()
        titleItem.identifier = .commonIdentifierTitle
        titleItem.value = aweme.desc as (NSCopying & NSObjectProtocol)?
        titleItem.extendedLanguageTag = "und"
        
        let authorItem = AVMutableMetadataItem()
        authorItem.identifier = .iTunesMetadataTrackSubTitle
        authorItem.value = aweme.author?.nickname as (NSCopying & NSObjectProtocol)?
        authorItem.extendedLanguageTag = "und"
        
        controller.player?.currentItem?.externalMetadata = [titleItem, authorItem]
        
        // 使用原生的 transportBarCustomMenuItems，将功能按钮直接放在进度条上！
        updateTransportBarMenuItems(controller: controller)
        
        return controller
    }
    
    func updateUIViewController(_ uiViewController: AVPlayerViewController, context: Context) {
        if uiViewController.player != player {
            uiViewController.player = player
        }
        // 动态更新喜欢状态
        updateTransportBarMenuItems(controller: uiViewController)
    }
    
    private func updateTransportBarMenuItems(controller: AVPlayerViewController) {
        let likeAction = UIAction(
            title: "喜欢",
            image: UIImage(systemName: isLiked ? "heart.fill" : "heart"),
            handler: { _ in
                isLiked.toggle()
            }
        )
        
        let commentAction = UIAction(
            title: "评论",
            image: UIImage(systemName: "message.fill"),
            handler: { _ in
                withAnimation {
                    showCommentsOverlay.toggle()
                }
            }
        )
        
        let authorAction = UIAction(
            title: "主页",
            image: UIImage(systemName: "person.crop.circle.fill"),
            handler: { _ in
                showAuthorWorks = true
            }
        )
        
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
