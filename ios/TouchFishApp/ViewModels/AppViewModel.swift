import SwiftUI

/// 全局状态管理 ViewModel
@MainActor
class AppViewModel: ObservableObject {
    // MARK: - Navigation State
    @Published var selectedPlatform: Platform?
    @Published var selectedNews: NewsItem?

    // MARK: - Data State
    @Published var newsItems: [Platform: [NewsItem]] = [:]
    @Published var selectedTabs: [Platform: String] = [:]
    @Published var isLoadingList = false
    @Published var isLoadingDetail = false
    @Published var detailHTML: String?
    @Published var errorMessage: String?
    @Published var showSettings = false

    // MARK: - Services (使用 API 服务)
    private let services: [Platform: any PlatformServiceProtocol] = {
        var dict: [Platform: any PlatformServiceProtocol] = [:]
        for platform in Platform.allCases {
            dict[platform] = APIService(platform: platform)
        }
        return dict
    }()

    // MARK: - Computed Properties

    var currentNewsList: [NewsItem] {
        guard let platform = selectedPlatform else { return [] }
        return newsItems[platform] ?? []
    }

    var currentTab: String? {
        guard let platform = selectedPlatform else { return nil }
        return selectedTabs[platform] ?? platform.defaultTab
    }

    // MARK: - Actions

    func selectPlatform(_ platform: Platform) {
        selectedPlatform = platform
        selectedNews = nil
        detailHTML = nil

        // 如果该平台尚未加载过数据，自动加载
        if newsItems[platform] == nil {
            Task { await loadNewsList(for: platform) }
        }
    }

    func selectNews(_ news: NewsItem) {
        // 标记已读
        var updatedNews = news
        if let platform = selectedPlatform,
           var items = newsItems[platform],
           let index = items.firstIndex(where: { $0.id == news.id }) {
            items[index].isRead = true
            newsItems[platform] = items
            updatedNews.isRead = true
        }
        selectedNews = updatedNews
        Task { await loadDetail(for: updatedNews) }
    }

    func changeTab(for platform: Platform, tab: String) {
        selectedTabs[platform] = tab
        selectedNews = nil
        detailHTML = nil
        Task { await loadNewsList(for: platform) }
    }

    func refreshCurrentPlatform() async {
        guard let platform = selectedPlatform else { return }
        await loadNewsList(for: platform)
    }

    // MARK: - Data Loading

    func loadNewsList(for platform: Platform) async {
        guard let service = services[platform] else { return }
        isLoadingList = true
        errorMessage = nil

        do {
            let tab = selectedTabs[platform] ?? platform.defaultTab
            let items = try await service.fetchNewsList(tab: tab)
            newsItems[platform] = items
        } catch {
            errorMessage = error.localizedDescription
            print("[TouchFish] Error loading \(platform.displayName): \(error)")
        }

        isLoadingList = false
    }

    func loadDetail(for news: NewsItem) async {
        guard let service = services[news.source] else { return }
        isLoadingDetail = true
        detailHTML = nil

        do {
            let html = try await service.fetchDetail(url: news.url)
            detailHTML = html
        } catch {
            detailHTML = "<div style='padding:20px;color:#999;text-align:center;'>加载失败: \(error.localizedDescription)</div>"
            print("[TouchFish] Error loading detail: \(error)")
        }

        isLoadingDetail = false
    }
}
