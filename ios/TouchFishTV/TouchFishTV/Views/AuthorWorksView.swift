import SwiftUI

struct AuthorWorksView: View {
    let author: Author
    @EnvironmentObject var api: DouyinAPI
    @State private var list: [Aweme] = []
    @State private var maxCursor: Int = 0
    @State private var hasMore: Bool = true
    @State private var isLoading: Bool = false
    @State private var errorMessage: String?
    @State private var selectedIndex: Int?
    
    let onClose: () -> Void
    
    let columns = [
        GridItem(.adaptive(minimum: 250, maximum: 300), spacing: 40)
    ]
    
    var body: some View {
        ZStack {
            // 背景渐变
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.05, green: 0.05, blue: 0.08),
                    Color(red: 0.01, green: 0.01, blue: 0.02)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 40) {
                    // 作者头部信息
                    HStack(spacing: 30) {
                        // 返回按钮
                        Button(action: onClose) {
                            Image(systemName: "chevron.left")
                                .font(.title)
                        }
                        
                        // 头像
                        AsyncImage(url: URL(string: author.avatar_thumb?.url_list?.first ?? "")) { img in
                            img.resizable()
                        } placeholder: {
                            Circle().fill(Color.gray.opacity(0.3))
                        }
                        .frame(width: 80, height: 80)
                        .clipShape(Circle())
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text(author.nickname ?? "未知作者")
                                .font(.system(size: 38, weight: .bold))
                                .foregroundColor(.white)
                            
                            Text("作者作品")
                                .font(.body)
                                .foregroundColor(.gray)
                        }
                        
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 40)
                    
                    // 作品列表网格
                    if list.isEmpty && !isLoading {
                        VStack(spacing: 20) {
                            Spacer()
                            Text(errorMessage ?? "该作者暂无作品")
                                .font(.title3)
                                .foregroundColor(.gray)
                                .multilineTextAlignment(.center)
                            if errorMessage != nil {
                                Button("重新加载") {
                                    Task { await loadWorks(isRefresh: true) }
                                }
                            }
                            Spacer()
                        }
                        .frame(maxWidth: .infinity, minHeight: 400)
                    } else {
                        LazyVGrid(columns: columns, spacing: 50) {
                            ForEach(Array(list.enumerated()), id: \.offset) { index, aweme in
                                Button(action: {
                                    self.selectedIndex = index
                                }) {
                                    FavoriteGridCard(aweme: aweme)
                                }
                                .buttonStyle(.card)
                                .onAppear {
                                    if index == list.indices.last && hasMore && !isLoading {
                                        Task {
                                            await loadWorks(isRefresh: false)
                                        }
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                    }
                    
                    if isLoading {
                        HStack {
                            Spacer()
                            ProgressView()
                            Spacer()
                        }
                        .padding()
                    }
                }
                .padding(.bottom, 60)
            }

            if let errorMessage, !list.isEmpty {
                VStack {
                    Spacer()
                    Text(errorMessage)
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.red.opacity(0.82))
                        .cornerRadius(12)
                        .padding(.bottom, 36)
                }
                .allowsHitTesting(false)
            }
        }
        .fullScreenCover(
            isPresented: Binding(
                get: { selectedIndex != nil },
                set: { if !$0 { selectedIndex = nil } }
            )
        ) {
            if let selectedIndex {
                AuthorPlaybackView(
                    videos: $list,
                    initialIndex: selectedIndex,
                    hasMore: $hasMore,
                    onLoadMore: {
                        Task { await loadWorks(isRefresh: false) }
                    },
                    onClose: {
                        self.selectedIndex = nil
                    }
                )
            }
        }
        .onAppear {
            Task {
                await loadWorks(isRefresh: true)
            }
        }
        .onExitCommand(perform: onClose)
    }
    
    private func loadWorks(isRefresh: Bool) async {
        guard !isLoading else { return }
        
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }

        guard !author.uid.isEmpty else {
            await MainActor.run {
                errorMessage = "当前作者缺少有效的用户标识"
                isLoading = false
                hasMore = false
            }
            return
        }

        let cursor = isRefresh ? 0 : maxCursor
        do {
            let (awemes, nextCursor, more) = try await api.getUserPosts(secUserId: author.uid, maxCursor: cursor)
            await MainActor.run {
                if isRefresh {
                    self.list = awemes
                } else {
                    self.list.append(contentsOf: awemes)
                }
                self.maxCursor = nextCursor
                self.hasMore = more
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
}

private struct AuthorPlaybackView: View {
    @Binding var videos: [Aweme]
    @Binding var hasMore: Bool
    let onLoadMore: () -> Void
    let onClose: () -> Void

    @State private var activeIndex: Int
    @State private var advancesAfterLoading = false

    init(
        videos: Binding<[Aweme]>,
        initialIndex: Int,
        hasMore: Binding<Bool>,
        onLoadMore: @escaping () -> Void,
        onClose: @escaping () -> Void
    ) {
        _videos = videos
        _hasMore = hasMore
        _activeIndex = State(initialValue: initialIndex)
        self.onLoadMore = onLoadMore
        self.onClose = onClose
    }

    var body: some View {
        Group {
            if videos.indices.contains(activeIndex) {
                VideoPlayerView(
                    aweme: videos[activeIndex],
                    onPrevious: playPrevious,
                    onNext: playNext,
                    onLikeChanged: updateLikeState
                )
                .id(activeIndex)
            } else {
                ProgressView()
            }
        }
        .background(Color.black.ignoresSafeArea())
        .onExitCommand(perform: onClose)
        .onChange(of: videos.count) { _ in
            guard advancesAfterLoading, activeIndex + 1 < videos.count else { return }
            advancesAfterLoading = false
            activeIndex += 1
        }
        .onChange(of: hasMore) { hasMore in
            if !hasMore {
                advancesAfterLoading = false
            }
        }
    }

    private func playPrevious() {
        guard activeIndex > videos.startIndex else { return }
        activeIndex -= 1
    }

    private func playNext() {
        if activeIndex + 1 < videos.count {
            activeIndex += 1
            if activeIndex >= videos.count - 3, hasMore {
                onLoadMore()
            }
        } else if hasMore {
            advancesAfterLoading = true
            onLoadMore()
        }
    }

    private func updateLikeState(awemeId: String, isLiked: Bool) {
        for index in videos.indices where videos[index].aweme_id == awemeId {
            videos[index].user_digg = isLiked ? 1 : 0
        }
    }
}
