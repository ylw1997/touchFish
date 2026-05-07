import SwiftUI

/// Apple Mail 风格三栏布局主视图
struct ContentView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @State private var columnVisibility: NavigationSplitViewVisibility = .all

    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            // ========= 左栏: 平台选择 =========
            PlatformSidebarView()
        } content: {
            // ========= 中栏: 新闻列表 =========
            if let platform = viewModel.selectedPlatform {
                NewsListView(platform: platform)
            } else {
                emptyListPlaceholder
            }
        } detail: {
            // ========= 右栏: 帖子详情 =========
            if let news = viewModel.selectedNews {
                NewsDetailView(news: news)
            } else {
                emptyDetailPlaceholder
            }
        }
        .navigationSplitViewStyle(.balanced)
        .tint(.accentColor)
        .sheet(isPresented: $viewModel.showSettings) {
            SettingsView()
        }
    }

    // MARK: - Placeholder Views

    private var emptyListPlaceholder: some View {
        VStack(spacing: 16) {
            Image(systemName: "sidebar.squares.left")
                .font(.system(size: 56, weight: .light))
                .foregroundStyle(.quaternary)
            Text("选择一个平台")
                .font(.title2)
                .foregroundStyle(.secondary)
            Text("从左侧选择一个平台开始浏览")
                .font(.subheadline)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var emptyDetailPlaceholder: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 56, weight: .light))
                .foregroundStyle(.quaternary)
            Text("选择一篇文章")
                .font(.title2)
                .foregroundStyle(.secondary)
            Text("点击列表中的文章查看详情")
                .font(.subheadline)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    ContentView()
        .environmentObject(AppViewModel())
}
