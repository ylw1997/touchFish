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
    private var generation: UInt = 0
    private var seenFollowingIDs = Set<String>()
    private let retainedPreviousItems = 5
    private let preloadRemainingItems = 3
    private let maximumDuplicatePageRetries = 4

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
        seenFollowingIDs.removeAll(keepingCapacity: true)
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
            var updatedFollowingIDs: Set<String>?
            switch feedType {
            case .recommend:
                result = (try await api.getFeed(), 0, true)
            case .following:
                let following = try await loadFollowingPage(
                    isRefresh: isRefresh,
                    existingIDs: seenFollowingIDs
                )
                result = (following.items, following.cursor, following.hasMore)
                updatedFollowingIDs = following.seenIDs
            }

            guard requestGeneration == generation else { return }
            if let updatedFollowingIDs {
                seenFollowingIDs = updatedFollowingIDs
            }
            if isRefresh {
                items = result.0
                activeIndex = 0
                playbackToken &+= 1
            } else {
                items.append(contentsOf: result.0)
            }
            cursor = result.1
            hasMore = result.2
            if items.isEmpty { errorMessage = "当前没有可播放的视频" }
        } catch is CancellationError {
            return
        } catch {
            guard requestGeneration == generation else { return }
            errorMessage = error.localizedDescription
        }
    }

    /// 关注接口会在相邻分页重复返回相同 aweme。接近当前列表尾部时预取，
    /// 若整页都已出现过，则立即沿新 cursor 再取下一页，不让用户刷到末尾才等待。
    private func loadFollowingPage(
        isRefresh: Bool,
        existingIDs: Set<String>
    ) async throws -> (items: [Aweme], cursor: Int, hasMore: Bool, seenIDs: Set<String>) {
        var requestCursor = isRefresh ? 0 : cursor
        var nextCursor = requestCursor
        var pageHasMore = true
        var uniqueItems: [Aweme] = []
        var seenIDs = existingIDs
        let attempts = isRefresh ? 1 : maximumDuplicatePageRetries

        for _ in 0..<attempts {
            let result = try await api.getFollowing(maxCursor: requestCursor)
            nextCursor = result.1
            pageHasMore = result.2

            uniqueItems = result.0.filter { aweme in
                seenIDs.insert(aweme.aweme_id).inserted
            }
#if DEBUG
            PlaybackDiagnostics.shared.event(
                "following-page-merged",
                category: "feed-pagination",
                fields: [
                    "cursor": requestCursor,
                    "nextCursor": nextCursor,
                    "received": result.0.count,
                    "unique": uniqueItems.count,
                    "duplicates": result.0.count - uniqueItems.count,
                    "hasMore": pageHasMore
                ]
            )
#endif
            if !uniqueItems.isEmpty || !pageHasMore || nextCursor == requestCursor {
                break
            }
            requestCursor = nextCursor
        }

        return (uniqueItems, nextCursor, pageHasMore, seenIDs)
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
