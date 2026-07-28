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
    private var preloadRemainingItems: Int {
        // 推荐接口偶尔会连续碰到 15 秒超时，而服务端通常每页只返回约 6 条。
        // 始终在前方保留约三页，分页波动就不会暴露成切换视频时的冷加载。
        if case .recommend = feedType { return 17 }
        return 3
    }

    init(feedType: FeedType, api: DouyinAPI? = nil) {
        self.feedType = feedType
        self.api = api ?? .shared
    }

    var activeItem: Aweme? {
        items.indices.contains(activeIndex) ? items[activeIndex] : nil
    }

    var nextItem: Aweme? {
        let index = activeIndex + 1
        return items.indices.contains(index) ? items[index] : nil
    }

    func refresh() async {
        generation &+= 1
        cursor = 0
        hasMore = true
        recommendRefreshIndex = 1
        recommendViewCount = 0
        isLoading = false
        let loaded = await load(isRefresh: true)
        if loaded, case .recommend = feedType {
            await preloadIfNeeded()
        }
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
        _ = await load(isRefresh: false)
        if items.count > oldCount {
            select(oldCount)
            trimPlayedHistoryIfNeeded()
        }
    }

    private func preloadIfNeeded() async {
        let maximumLoads: Int
        if case .recommend = feedType {
            // 一次补足三页，并给其中一页留一次后台重试；当前视频会在首屏
            // 响应后立即播放，不会等待这些后续请求。
            maximumLoads = 4
        } else {
            maximumLoads = 1
        }

        var attempts = 0
        while items.count - activeIndex - 1 <= preloadRemainingItems,
              hasMore,
              attempts < maximumLoads {
            attempts += 1
            let previousCount = items.count
            let loaded = await load(isRefresh: false)
            if !loaded {
                continue
            }
            // 服务端声称 has_more 但没有给新视频时，避免在一次调用中空转。
            guard items.count > previousCount else { break }
        }
    }

    @discardableResult
    private func load(isRefresh: Bool) async -> Bool {
        guard !isLoading, isRefresh || hasMore else { return false }
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

            guard requestGeneration == generation else { return false }
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
            return true
        } catch is CancellationError {
            return false
        } catch {
            guard requestGeneration == generation else { return false }
            errorMessage = error.localizedDescription
            return false
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
