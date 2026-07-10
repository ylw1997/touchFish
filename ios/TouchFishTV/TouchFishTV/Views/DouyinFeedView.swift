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
    @State private var showToast: Bool = false
    @State private var toastMessage: String = ""
    
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
                    onPrevious: playPrevious,
                    onNext: playNext
                )
                .ignoresSafeArea()
                
                if isLoading {
                    VStack {
                        Spacer()
                        ProgressView("正在加载更多...")
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .padding()
                            .background(Color.black.opacity(0.6))
                            .cornerRadius(10)
                            .padding(.bottom, 50)
                    }
                }
                
                if showToast {
                    VStack {
                        Spacer()
                        Text(toastMessage)
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.black.opacity(0.6))
                            .cornerRadius(10)
                            .padding(.bottom, 50)
                    }
                    .transition(.opacity)
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

    private func playPrevious() {
        guard activeIndex > list.startIndex else { return }
        activeIndex -= 1
    }

    private func playNext() {
        if activeIndex + 1 < list.count {
            activeIndex += 1
            checkPreload()
        } else {
            // 已在最后一个视频，若还有更多且当前不在加载中，则触发加载并自动跳转至新视频播放
            if hasMore && !isLoading {
                Task {
                    await loadFeed(isRefresh: false, autoPlayNextAfterLoad: true)
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
    
    private func loadFeed(isRefresh: Bool, autoPlayNextAfterLoad: Bool = false) async {
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
            var addedCount = 0
            if isRefresh {
                self.list = awemes
                self.activeIndex = 0
            } else {
                // 去重，过滤掉已存在的视频，避免在列表中出现重复的视频项
                let newAwemes = awemes.filter { newAweme in
                    !self.list.contains(where: { $0.aweme_id == newAweme.aweme_id })
                }
                addedCount = newAwemes.count
                self.list.append(contentsOf: newAwemes)
            }
            self.maxCursor = nextCursor
            self.hasMore = more
            self.isLoading = false
            
            // 如果是在最后一个视频按了“下”触发的加载
            if autoPlayNextAfterLoad {
                if addedCount > 0 {
                    if self.activeIndex + 1 < self.list.count {
                        self.activeIndex += 1
                    }
                } else {
                    self.showToastMessage("当前无更多新视频，请稍后再试")
                }
            }
        }
    }
    
    private func showToastMessage(_ message: String) {
        self.toastMessage = message
        withAnimation {
            self.showToast = true
        }
        Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            await MainActor.run {
                withAnimation {
                    self.showToast = false
                }
            }
        }
    }
}
