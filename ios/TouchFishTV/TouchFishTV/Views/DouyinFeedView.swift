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
    
    // 单一播放器由 activeIndex 驱动，避免多个视频同时播放。
    @State private var activeIndex: Int = 0
    @State private var showToast: Bool = false
    @State private var toastMessage: String = ""
    @State private var errorMessage: String?
    @State private var dataGeneration: UInt = 0
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            if list.isEmpty {
                if isLoading {
                    ProgressView("正在载入视频...")
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    VStack(spacing: 24) {
                        Image(systemName: errorMessage == nil ? "video.slash.fill" : "exclamationmark.triangle.fill")
                            .font(.system(size: 80))
                            .foregroundColor(errorMessage == nil ? .gray : .orange)
                        Text(errorMessage ?? "当前没有可播放的视频")
                            .font(.title3)
                            .foregroundColor(.white.opacity(0.8))
                            .multilineTextAlignment(.center)
                        Button("重新加载") {
                            Task { await loadFeed(isRefresh: true) }
                        }
                    }
                }
            } else {
                VideoPlayerView(
                    aweme: list[activeIndex],
                    onPrevious: playPrevious,
                    onNext: playNext,
                    onLikeChanged: updateLikeState
                )
                .id(activeIndex)
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
        .onChange(of: api.cookieRevision) { _ in
            dataGeneration &+= 1
            isLoading = false
            list = []
            activeIndex = 0
            maxCursor = 0
            hasMore = true
            errorMessage = nil
            Task { await loadFeed(isRefresh: true) }
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

    private func updateLikeState(awemeId: String, isLiked: Bool) {
        for index in list.indices where list[index].aweme_id == awemeId {
            list[index].user_digg = isLiked ? 1 : 0
        }
    }
    
    private func loadFeed(isRefresh: Bool, autoPlayNextAfterLoad: Bool = false) async {
        guard !isLoading else { return }
        let requestGeneration = dataGeneration
        
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        var awemes: [Aweme] = []
        var nextCursor = maxCursor
        var more = true
        
        do {
            switch feedType {
            case .recommend:
                awemes = try await api.getFeed()
                nextCursor = 0
                more = true
            case .following:
                let (followingAwemes, cursor, hasMoreFollowing) = try await api.getFollowing(maxCursor: maxCursor)
                awemes = followingAwemes
                nextCursor = cursor
                more = hasMoreFollowing
            }
        } catch {
            await MainActor.run {
                guard requestGeneration == dataGeneration else { return }
                if list.isEmpty {
                    errorMessage = error.localizedDescription
                } else {
                    showToastMessage(error.localizedDescription)
                }
                isLoading = false
            }
            return
        }
        
        await MainActor.run {
            guard requestGeneration == dataGeneration else { return }
            var addedCount = 0
            if isRefresh {
                self.list = awemes
                self.activeIndex = 0
                addedCount = awemes.count
            } else {
                addedCount = awemes.count
                self.list.append(contentsOf: awemes)
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
