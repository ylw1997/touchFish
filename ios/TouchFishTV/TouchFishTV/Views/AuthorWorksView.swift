import Foundation
import SwiftUI

@MainActor
final class AuthorWorksStore: ObservableObject, VideoLibraryStore {
    @Published private(set) var items: [Aweme] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?
    @Published private(set) var profile: Author?

    let author: Author

    private let api: DouyinAPI
    private var cursor = 0
    private var hasMore = true
    private var generation: UInt = 0

    init(author: Author, api: DouyinAPI? = nil) {
        self.author = author
        self.api = api ?? .shared
    }

    var displayAuthor: Author {
        profile ?? items.first?.author ?? author
    }

    func refresh() async {
        generation &+= 1
        let requestGeneration = generation
        cursor = 0
        hasMore = true
        isLoading = false
        profile = nil
        await load(reset: true, requestGeneration: requestGeneration)
        guard requestGeneration == generation else { return }
        await loadProfile(requestGeneration: requestGeneration)
    }

    func loadProfileIfNeeded() async {
        guard profile == nil else { return }
        await loadProfile(requestGeneration: generation)
    }

    func loadMoreIfNeeded(currentIndex: Int) async {
        guard currentIndex >= max(0, items.count - 4) else { return }
        await load(reset: false, requestGeneration: generation)
    }

    func loadNextPage() async {
        await load(reset: false, requestGeneration: generation)
    }

    private func loadProfile(requestGeneration: UInt) async {
        guard let loadedProfile = try? await api.getUserProfile(secUserID: author.uid),
              requestGeneration == generation else { return }
        profile = loadedProfile
    }

    private func load(reset: Bool, requestGeneration: UInt) async {
        guard !isLoading, reset || hasMore else { return }
        isLoading = true
        errorMessage = nil
        defer {
            if requestGeneration == generation { isLoading = false }
        }

        do {
            let result = try await api.getUserPosts(
                secUserID: author.uid,
                maxCursor: reset ? 0 : cursor
            )
            guard requestGeneration == generation else { return }
            let videoItems = result.0.filter(\.hasVideoPlaybackURL)
            if reset { items = videoItems } else { items.append(contentsOf: videoItems) }
            cursor = result.1
            hasMore = result.2
            if items.isEmpty { errorMessage = "该用户暂时没有可播放的作品" }
        } catch is CancellationError {
            return
        } catch {
            guard requestGeneration == generation else { return }
            errorMessage = error.localizedDescription
        }
    }
}

@MainActor
struct AuthorWorksView: View {
    @EnvironmentObject private var api: DouyinAPI
    @StateObject private var store: AuthorWorksStore
    @State private var selectedIndex: Int?

    init(author: Author) {
        _store = StateObject(wrappedValue: AuthorWorksStore(author: author))
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 0) {
                authorHeader

                if store.items.isEmpty {
                    emptyState
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    VideoLibraryCollectionView(
                        items: store.items,
                        onSelect: { selectedIndex = $0 },
                        onNearEnd: { index in
                            Task { await store.loadMoreIfNeeded(currentIndex: index) }
                        },
                        topContentInset: 44
                    )
                    .ignoresSafeArea(edges: .bottom)
                }
            }
        }
        .task {
            if store.items.isEmpty {
                await store.refresh()
            } else {
                // 如果进入播放页时资料请求被系统取消，返回后继续补齐真实统计。
                await store.loadProfileIfNeeded()
            }
        }
        .onChange(of: api.cookieRevision) { _, _ in
            selectedIndex = nil
            Task { await store.refresh() }
        }
        .navigationDestination(isPresented: playbackPresented) {
            if let selectedIndex {
                VideoLibraryPlaybackPage(
                    store: store,
                    initialIndex: selectedIndex,
                    source: .author,
                    allowsAuthorNavigation: false
                )
            }
        }
    }

    private var authorHeader: some View {
        HStack(spacing: 22) {
            AsyncImage(url: store.displayAuthor.avatar_thumb?.url_list?.compactMap(URL.init(string:)).first) { phase in
                if let image = phase.image {
                    image.resizable().scaledToFill()
                } else {
                    Image(systemName: "person.crop.circle.fill")
                        .resizable()
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 84, height: 84)
            .clipShape(Circle())

            VStack(alignment: .leading, spacing: 6) {
                Text(store.displayAuthor.nickname?.isEmpty == false ? store.displayAuthor.nickname! : "未知用户")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.white)
                    .lineLimit(1)

                if let uniqueID = store.displayAuthor.unique_id, !uniqueID.isEmpty {
                    Text("抖音号：\(uniqueID)")
                        .font(.callout)
                        .foregroundStyle(Color.white.opacity(0.68))
                }

                if let signature = store.displayAuthor.signature, !signature.isEmpty {
                    Text(signature)
                        .font(.callout)
                        .foregroundStyle(Color.white.opacity(0.68))
                        .lineLimit(2)
                }
            }

            Spacer(minLength: 24)

            HStack(spacing: 24) {
                if let followerCount = store.displayAuthor.follower_count {
                    statistic(value: Self.formattedCount(followerCount), title: "粉丝")
                }
                statistic(
                    value: store.displayAuthor.aweme_count.map { Self.formattedCount($0) } ?? "—",
                    title: "作品"
                )
            }
        }
        .padding(.horizontal, 100)
        .padding(.top, 18)
        .padding(.bottom, 8)
    }

    private func statistic(value: String, title: String) -> some View {
        VStack(spacing: 5) {
            Text(value).font(.title3.weight(.semibold)).foregroundStyle(.white)
            Text(title).font(.caption).foregroundStyle(Color.white.opacity(0.68))
        }
        .frame(minWidth: 82)
    }

    private var playbackPresented: Binding<Bool> {
        Binding(
            get: { selectedIndex != nil },
            set: { presented in
                if !presented { selectedIndex = nil }
            }
        )
    }

    private var emptyState: some View {
        VStack(spacing: 22) {
            if store.isLoading {
                ProgressView().controlSize(.large)
                Text("正在载入用户作品").foregroundStyle(Color.white.opacity(0.7))
            } else {
                Image(systemName: store.errorMessage == nil ? "rectangle.stack.badge.person.crop" : "exclamationmark.triangle.fill")
                    .font(.system(size: 64, weight: .light))
                    .foregroundStyle(store.errorMessage == nil ? Color.secondary : Color.orange)
                Text(store.errorMessage ?? "该用户暂时没有作品")
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                Button("重新加载") { Task { await store.refresh() } }
                    .buttonStyle(.borderedProminent)
            }
        }
    }

    private static func formattedCount(_ count: Int) -> String {
        if count >= 100_000_000 { return formattedUnit(Double(count) / 100_000_000, suffix: "亿") }
        if count >= 10_000 { return formattedUnit(Double(count) / 10_000, suffix: "万") }
        return String(count)
    }

    private static func formattedUnit(_ value: Double, suffix: String) -> String {
        value.rounded() == value
            ? "\(Int(value))\(suffix)"
            : String(format: "%.1f", value) + suffix
    }
}
