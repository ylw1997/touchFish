import SwiftUI

struct FavoritesView: View {
    @EnvironmentObject var api: DouyinAPI
    @State private var list: [Aweme] = []
    @State private var maxCursor: Int = 0
    @State private var hasMore: Bool = true
    @State private var isLoading: Bool = false
    
    // 选中的播放视频
    @State private var selectedVideo: Aweme? = nil
    
    let columns = [
        GridItem(.adaptive(minimum: 250, maximum: 300), spacing: 40)
    ]
    
    var body: some View {
        ZStack {
            if list.isEmpty && !isLoading {
                VStack(spacing: 20) {
                    Image(systemName: "heart.slash.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.gray)
                    Text("暂无喜欢的视频，请先在“设置”中配置 Cookie")
                        .font(.title3)
                        .foregroundColor(.gray)
                }
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 30) {
                        Text("我的喜欢")
                            .font(.system(size: 45, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.leading, 20)
                        
                        LazyVGrid(columns: columns, spacing: 50) {
                            ForEach(list) { aweme in
                                Button(action: {
                                    self.selectedVideo = aweme
                                }) {
                                    FavoriteGridCard(aweme: aweme)
                                }
                                .buttonStyle(.card) // tvOS 专属系统卡片样式，包含自动焦点缩放与视差效果
                                .onAppear {
                                    if aweme.id == list.last?.id && hasMore && !isLoading {
                                        Task {
                                            await loadFavorites(isRefresh: false)
                                        }
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                        
                        if isLoading {
                            HStack {
                                Spacer()
                                ProgressView()
                                Spacer()
                            }
                            .padding()
                        }
                    }
                    .padding(.vertical, 40)
                }
            }
        }
        .fullScreenCover(item: $selectedVideo) { aweme in
            // 打开沉浸式全屏播放器
            VideoPlayerView(aweme: aweme)
        }
        .onAppear {
            if list.isEmpty {
                Task {
                    await loadFavorites(isRefresh: true)
                }
            }
        }
    }
    
    private func loadFavorites(isRefresh: Bool) async {
        guard !isLoading else { return }
        
        await MainActor.run {
            isLoading = true
        }
        
        let cursor = isRefresh ? 0 : maxCursor
        let (awemes, nextCursor, more) = await api.getFavorites(maxCursor: cursor)
        
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

struct FavoriteGridCard: View {
    let aweme: Aweme
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ZStack(alignment: .bottomTrailing) {
                // 封面
                AsyncImage(url: URL(string: aweme.video?.cover?.url_list?.first ?? "")) { img in
                    img.resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle().fill(Color.white.opacity(0.05))
                        .overlay(
                            ProgressView()
                        )
                }
                .frame(width: 260, height: 360)
                .clipped()
                
                // 右下角点赞数
                HStack(spacing: 4) {
                    Image(systemName: "heart.fill")
                        .foregroundColor(.red)
                        .font(.caption2)
                    Text(formatCount(aweme.statistics?.digg_count ?? 0))
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.black.opacity(0.6))
                .cornerRadius(5)
                .padding([.bottom, .trailing], 8)
            }
            .cornerRadius(10)
            
            // 描述
            Text(aweme.desc ?? "无描述")
                .font(.caption)
                .foregroundColor(.white.opacity(0.8))
                .lineLimit(1)
                .frame(width: 260, alignment: .leading)
            
            // 博主昵称
            Text("@" + (aweme.author?.nickname ?? "未知作者"))
                .font(.system(size: 11))
                .foregroundColor(.gray)
                .lineLimit(1)
                .frame(width: 260, alignment: .leading)
        }
        .frame(width: 260)
    }
    
    private func formatCount(_ count: Int) -> String {
        if count >= 10000 {
            return String(format: "%.1fw", Double(count) / 10000.0)
        }
        return "\(count)"
    }
}
