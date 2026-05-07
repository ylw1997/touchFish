import SwiftUI

/// 右栏: 帖子详情视图
struct NewsDetailView: View {
    let news: NewsItem
    @EnvironmentObject var viewModel: AppViewModel

    var body: some View {
        Group {
            if viewModel.isLoadingDetail {
                loadingView
            } else if let html = viewModel.detailHTML {
                VStack(alignment: .leading, spacing: 0) {
                    Text(news.title)
                        .font(.title2)
                        .fontWeight(.bold)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 16)
                        .textSelection(.enabled)
                    
                    Divider()
                    
                    HTMLContentView(htmlContent: html, baseURL: news.url)
                }
            } else {
                loadingView
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                // 在浏览器中打开
                if let url = fullURL(for: news) {
                    ShareLink(item: url) {
                        Image(systemName: "square.and.arrow.up")
                    }

                    Link(destination: url) {
                        Image(systemName: "safari")
                    }
                }
            }
        }
    }

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            Text("正在加载文章...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func fullURL(for news: NewsItem) -> URL? {
        let urlString = news.url
        if urlString.hasPrefix("http") {
            return URL(string: urlString)
        }
        // 根据平台构建完整 URL
        switch news.source {
        case .v2ex:
            return URL(string: "https://www.v2ex.com\(urlString)")
        case .hupu:
            return URL(string: "https://bbs.hupu.com\(urlString)")
        case .nga:
            return URL(string: "https://bbs.nga.cn\(urlString)")
        case .linuxdo:
            return URL(string: urlString)
        default:
            return URL(string: urlString)
        }
    }
}
