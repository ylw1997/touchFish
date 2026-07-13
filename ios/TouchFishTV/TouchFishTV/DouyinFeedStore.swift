import Foundation

enum FeedNavigation {
    static func previousIndex(current: Int, count: Int) -> Int? {
        current > 0 && current < count ? current - 1 : nil
    }

    static func nextIndex(current: Int, count: Int) -> Int? {
        current >= 0 && current + 1 < count ? current + 1 : nil
    }
}

@MainActor
final class DouyinFeedStore: ObservableObject {
    @Published private(set) var items: [Aweme] = []
    @Published private(set) var activeIndex = 0
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    private let feedType: FeedType
    private let api: DouyinAPI
    private var cursor = 0
    private var hasMore = true
    private var generation: UInt = 0

    init(feedType: FeedType, api: DouyinAPI = .shared) {
        self.feedType = feedType
        self.api = api
    }

    var activeItem: Aweme? {
        items.indices.contains(activeIndex) ? items[activeIndex] : nil
    }

    func refresh() async {
        generation &+= 1
        cursor = 0
        hasMore = true
        isLoading = false
        await load(isRefresh: true)
    }

    func previous() {
        guard let index = FeedNavigation.previousIndex(current: activeIndex, count: items.count) else { return }
        activeIndex = index
    }

    func next() async {
        if let index = FeedNavigation.nextIndex(current: activeIndex, count: items.count) {
            activeIndex = index
            await preloadIfNeeded()
            return
        }

        let oldCount = items.count
        await load(isRefresh: false)
        if items.count > oldCount {
            activeIndex = oldCount
        }
    }

    private func preloadIfNeeded() async {
        guard activeIndex >= max(0, items.count - 2) else { return }
        await load(isRefresh: false)
    }

    private func load(isRefresh: Bool) async {
        guard !isLoading, isRefresh || hasMore else { return }
        let requestGeneration = generation
        isLoading = true
        errorMessage = nil

        do {
            let result: ([Aweme], Int, Bool)
            switch feedType {
            case .recommend:
                result = (try await api.getFeed(), 0, true)
            case .following:
                result = try await api.getFollowing(maxCursor: cursor)
            }

            guard requestGeneration == generation else { return }
            if isRefresh {
                items = result.0
                activeIndex = 0
            } else {
                items.append(contentsOf: result.0)
            }
            cursor = result.1
            hasMore = result.2
            if items.isEmpty { errorMessage = "当前没有可播放的视频" }
        } catch {
            guard requestGeneration == generation else { return }
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
