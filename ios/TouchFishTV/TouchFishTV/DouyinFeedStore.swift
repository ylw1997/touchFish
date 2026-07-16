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
    @Published private(set) var playbackToken: UInt64 = 0
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    private let feedType: FeedType
    private let api: DouyinAPI
    private var cursor = 0
    private var hasMore = true
    private var recommendRefreshIndex = 1
    private var recommendViewCount = 0
    private var generation: UInt = 0
    private let retainedPreviousItems = 5
    private let preloadRemainingItems = 3

    init(feedType: FeedType, api: DouyinAPI? = nil) {
        self.feedType = feedType
        self.api = api ?? .shared
    }

    var activeItem: Aweme? {
        items.indices.contains(activeIndex) ? items[activeIndex] : nil
    }

    func refresh() async {
        generation &+= 1
        cursor = 0
        hasMore = true
        recommendRefreshIndex = 1
        recommendViewCount = 0
        isLoading = false
        await load(isRefresh: true)
    }

    func previous() {
        guard let index = FeedNavigation.previousIndex(current: activeIndex, count: items.count) else { return }
        select(index)
    }

    func next() async {
        if let index = FeedNavigation.nextIndex(current: activeIndex, count: items.count) {
            select(index)
            trimPlayedHistoryIfNeeded()
            await preloadIfNeeded()
            return
        }

        let oldCount = items.count
        await load(isRefresh: false)
        if items.count > oldCount {
            select(oldCount)
            trimPlayedHistoryIfNeeded()
        }
    }

    private func preloadIfNeeded() async {
        let remainingItems = items.count - activeIndex - 1
        guard remainingItems <= preloadRemainingItems else { return }
        await load(isRefresh: false)
    }

    private func load(isRefresh: Bool) async {
        guard !isLoading, isRefresh || hasMore else { return }
        let requestGeneration = generation
        isLoading = true
        errorMessage = nil
        defer {
            if requestGeneration == generation { isLoading = false }
        }

        do {
            let result: ([Aweme], Int, Bool)
            switch feedType {
            case .recommend:
                let page = try await api.getFeed(
                    refreshIndex: recommendRefreshIndex,
                    viewCount: recommendViewCount
                )
                result = (page.0, 0, page.1)
            case .following:
                result = try await api.getFollowing(cursor: isRefresh ? 0 : cursor)
            }

            guard requestGeneration == generation else { return }
            if isRefresh {
                items = result.0
                activeIndex = 0
                playbackToken &+= 1
            } else {
                items.append(contentsOf: result.0)
            }
            cursor = result.1
            hasMore = result.2
            if case .recommend = feedType {
                recommendRefreshIndex += 1
                recommendViewCount += result.0.count
            }
            if items.isEmpty { errorMessage = "当前没有可播放的视频" }
        } catch is CancellationError {
            return
        } catch {
            guard requestGeneration == generation else { return }
            errorMessage = error.localizedDescription
        }
    }

    private func select(_ index: Int) {
        activeIndex = index
        playbackToken &+= 1
    }

    private func trimPlayedHistoryIfNeeded() {
        let removeCount = max(0, activeIndex - retainedPreviousItems)
        guard removeCount > 0 else { return }
        items.removeFirst(removeCount)
        activeIndex -= removeCount
    }
}
