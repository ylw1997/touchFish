import SwiftUI

struct AuthorWorksView: View {
    let author: Author
    @EnvironmentObject var api: DouyinAPI
    @State private var list: [Aweme] = []
    @State private var maxCursor: Int = 0
    @State private var hasMore: Bool = true
    @State private var isLoading: Bool = false
    
    @State private var selectedVideo: Aweme? = nil
    
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
                            
                            Text("抖音 ID: \(author.uid)")
                                .font(.body)
                                .foregroundColor(.gray)
                        }
                        
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 40)
                    
                    // 作品列表网格
                    if list.isEmpty && !isLoading {
                        VStack {
                            Spacer()
                            Text("该作者暂无作品")
                                .font(.title3)
                                .foregroundColor(.gray)
                            Spacer()
                        }
                        .frame(maxWidth: .infinity, minHeight: 400)
                    } else {
                        LazyVGrid(columns: columns, spacing: 50) {
                            ForEach(list) { aweme in
                                Button(action: {
                                    self.selectedVideo = aweme
                                }) {
                                    FavoriteGridCard(aweme: aweme)
                                }
                                .buttonStyle(.card)
                                .onAppear {
                                    if aweme.id == list.last?.id && hasMore && !isLoading {
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
        }
        .fullScreenCover(item: $selectedVideo) { aweme in
            VideoPlayerView(
                aweme: aweme,
                playlist: list,
                isModal: true,
                onClose: {
                    self.selectedVideo = nil
                }
            )
        }
        .onAppear {
            Task {
                await loadWorks(isRefresh: true)
            }
        }
    }
    
    private func loadWorks(isRefresh: Bool) async {
        guard !isLoading else { return }
        
        await MainActor.run {
            isLoading = true
        }
        
        let cursor = isRefresh ? 0 : maxCursor
        let (awemes, nextCursor, more) = await api.getUserPosts(secUserId: author.uid, maxCursor: cursor)
        
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
    }
}
