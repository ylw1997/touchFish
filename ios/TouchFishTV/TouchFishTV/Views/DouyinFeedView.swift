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
    
    // 用 FocusState 追踪当前聚焦的视频行项目
    @FocusState private var focusedIndex: Int?
    // 用 activeIndex 锁定正在播放的视频，即使焦点临时离开去顶部的 TabBar，当前视频也会在后台保持播放而不被暂停
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
                // 原生垂直滚动聚焦流，通过 D-pad 移动焦点的物理反弹来自然上下滚屏
                ScrollView(.vertical, showsIndicators: false) {
                    LazyVStack(spacing: 0) {
                        ForEach(list.indices, id: \.self) { index in
                            VideoPlayerView(
                                aweme: list[index],
                                playlist: list,
                                isModal: false,
                                onClose: {},
                                isActive: activeIndex == index // 使用 activeIndex，不受焦点跳往 Tab 栏的影响
                            )
                            .frame(width: 1920, height: 1080) // 锁定逻辑全屏高度，确保滚屏精准对齐
                            .focused($focusedIndex, equals: index)
                            .id(index)
                        }
                    }
                }
                .ignoresSafeArea() // 确保滚动容器不受安全区偏移影响
            }
        }
        .onAppear {
            if list.isEmpty {
                Task {
                    await loadFeed(isRefresh: true)
                }
            } else {
                focusedIndex = activeIndex
            }
        }
        .onChange(of: focusedIndex) { index in
            guard let index = index else { return }
            // 只有当用户确实在视频列表里发生了焦点滑动，才更新播放 index
            activeIndex = index
            
            // 预加载：当播放到倒数第二条时，拉取新数据
            if index >= list.count - 2 && hasMore && !isLoading {
                Task {
                    await loadFeed(isRefresh: false)
                }
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
                self.focusedIndex = 0
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
