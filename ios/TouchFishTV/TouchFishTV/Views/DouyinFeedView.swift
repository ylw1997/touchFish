import SwiftUI

enum FeedType {
    case recommend
    case following
}

struct DouyinFeedView: View {
    let feedType: FeedType
    
    @EnvironmentObject var api: DouyinAPI
    @State private var list: [Aweme] = []
    @State private var maxCursor: Int = 0
    @State private var hasMore: Bool = true
    @State private var isLoading: Bool = false
    
    // 永远只有这一个 activeIndex，直接控制单一播放器的数据源
    @State private var activeIndex: Int = 0
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            if list.isEmpty {
                if isLoading {
                    ProgressView("正在载入视频...")
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    VStack(spacing: 20) {
                        Image(systemName: "video.slash.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.gray)
                        Text("无可用视频流，请配置您的 Cookie")
                            .font(.title3)
                            .foregroundColor(.gray)
                    }
                }
            } else {
                // 核心重构：彻底抛弃 ScrollView 和 List！
                // 永远只实例化一个播放器，当按下下方向键时，只修改 activeIndex 数据源，
                // 播放器内部会自动平滑切换到下个视频！这彻底解决了苹果焦点引擎乱弹和 Menu 键回退问题。
                VideoPlayerView(
                    aweme: list[activeIndex],
                    playlist: list,
                    isModal: false,
                    onClose: {},
                    isActive: true
                )
                .ignoresSafeArea()
                .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("requestScrollToNext"))) { _ in
                    if activeIndex < list.count - 1 {
                        activeIndex += 1
                        checkPreload()
                    }
                }
                .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("requestScrollToPrevious"))) { _ in
                    if activeIndex > 0 {
                        activeIndex -= 1
                    }
                }
            }
        }
        .onAppear {
            if list.isEmpty {
                Task {
                    await loadFeed(isRefresh: true)
                }
            }
        }
    }
    
    private func checkPreload() {
        if activeIndex >= list.count - 2 && hasMore && !isLoading {
            Task {
                await loadFeed(isRefresh: false)
            }
        }
    }
    
    private func loadFeed(isRefresh: Bool) async {
        guard !isLoading else { return }
        
        await MainActor.run {
            isLoading = true
        }
        
        var awemes: [Aweme] = []
        var nextCursor = maxCursor
        var more = true
        
        switch feedType {
        case .recommend:
            awemes = await api.getFeed()
            nextCursor = 0
            more = true
        case .following:
            let (followingAwemes, cursor, hasMoreFollowing) = await api.getFollowing(maxCursor: maxCursor)
            awemes = followingAwemes
            nextCursor = cursor
            more = hasMoreFollowing
        }
        
        await MainActor.run {
            if isRefresh {
                self.list = awemes
                self.activeIndex = 0
            } else {
                self.list.append(contentsOf: awemes)
            }
            self.maxCursor = nextCursor
            self.hasMore = more
            self.isLoading = false
        }
    }
}
