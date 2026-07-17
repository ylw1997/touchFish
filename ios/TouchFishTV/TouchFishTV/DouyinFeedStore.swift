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

    func previous() async {
        guard let index = FeedNavigation.previousIndex(current: activeIndex, count: items.count) else { return }
        await select(index, direction: -1)
    }

    func next() async {
        if let index = FeedNavigation.nextIndex(current: activeIndex, count: items.count) {
            await select(index, direction: 1)
            trimPlayedHistoryIfNeeded()
            await preloadIfNeeded()
            return
        }

        let oldCount = items.count
        await load(isRefresh: false)
        if items.count > oldCount {
            await select(oldCount, direction: 1)
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
            case .live:
                if isRefresh {
                    // 两个接口并行请求，首屏优先排列关注直播；关注接口偶发
                    // 失败时仍展示热门直播，不让整个直播 Tab 变成错误页。
                    async let followedRequest = api.getFollowedLiveRooms()
                    async let popularRequest = api.getLiveFeed(maxTime: 0)
                    let followed = (try? await followedRequest) ?? []
                    let popular = try await popularRequest
                    result = (followed + popular.0, popular.1, popular.2)
                } else {
                    result = try await api.getLiveFeed(maxTime: cursor)
                }
            }

            guard requestGeneration == generation else { return }
            if isRefresh {
                var refreshedItems = result.0
                var initialIndex = 0
                if case .live = feedType {
                    while refreshedItems.indices.contains(initialIndex) {
                        guard requestGeneration == generation else { return }
                        if let prepared = await prepareForPlayback(refreshedItems[initialIndex]) {
                            refreshedItems[initialIndex] = prepared
                            break
                        }
                        initialIndex += 1
                    }
                    if initialIndex >= refreshedItems.count {
                        refreshedItems.removeAll()
                        initialIndex = 0
                    }
                }
                guard requestGeneration == generation else { return }
                items = refreshedItems
                activeIndex = initialIndex
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

    private func select(_ index: Int, direction: Int) async {
        let selectionGeneration = generation
        var candidateIndex = index
        while items.indices.contains(candidateIndex) {
            let candidate = items[candidateIndex]
            if let prepared = await prepareForPlayback(candidate) {
                guard selectionGeneration == generation,
                      items.indices.contains(candidateIndex),
                      items[candidateIndex].aweme_id == candidate.aweme_id else { return }
                items[candidateIndex] = prepared
                activeIndex = candidateIndex
                playbackToken &+= 1
                errorMessage = nil
                return
            }
            candidateIndex += direction
        }
        guard selectionGeneration == generation else { return }
        errorMessage = "直播间已结束或暂时无法播放"
    }

    private func prepareForPlayback(_ item: Aweme) async -> Aweme? {
        guard case .live = feedType,
              let room = item.liveRoom else { return item }
        if room.status == 2, !room.preferredHLSURLs.isEmpty {
            return item
        }
        guard let webRID = room.owner?.web_rid, !webRID.isEmpty else { return nil }

        do {
            return Aweme(liveRoom: try await api.getPlayableLiveRoom(webRID: webRID))
        } catch {
#if DEBUG
            PlaybackDiagnostics.shared.event(
                "live-room-resolution-failed",
                category: "api",
                fields: [
                    "room": room.id_str,
                    "webRID": webRID,
                    "error": error.localizedDescription
                ]
            )
#endif
            return nil
        }
    }

    private func trimPlayedHistoryIfNeeded() {
        let removeCount = max(0, activeIndex - retainedPreviousItems)
        guard removeCount > 0 else { return }
        items.removeFirst(removeCount)
        activeIndex -= removeCount
    }
}
