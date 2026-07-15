import Foundation
import SwiftUI

@MainActor
final class FavoritesLibraryStore: ObservableObject {
    @Published private(set) var items: [Aweme] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    private let api: DouyinAPI
    private var cursor = 0
    private var hasMore = true
    private var generation: UInt = 0

    init(api: DouyinAPI = .shared) {
        self.api = api
    }

    func refresh() async {
        generation &+= 1
        cursor = 0
        hasMore = true
        isLoading = false
        await load(reset: true, requestGeneration: generation)
    }

    func loadMoreIfNeeded(currentIndex: Int) async {
        guard currentIndex >= max(0, items.count - 4) else { return }
        await load(reset: false, requestGeneration: generation)
    }

    func loadNextPage() async {
        await load(reset: false, requestGeneration: generation)
    }

    private func load(reset: Bool, requestGeneration: UInt) async {
        guard !isLoading, reset || hasMore else { return }
        isLoading = true
        errorMessage = nil
        defer {
            if requestGeneration == generation { isLoading = false }
        }

        do {
            let result = try await api.getFavorites(maxCursor: reset ? 0 : cursor)
            guard requestGeneration == generation else { return }
            if reset { items = result.0 } else { items.append(contentsOf: result.0) }
            cursor = result.1
            hasMore = result.2
            if items.isEmpty { errorMessage = "还没有喜欢的视频" }
        } catch is CancellationError {
            return
        } catch {
            guard requestGeneration == generation else { return }
            errorMessage = error.localizedDescription
        }
    }
}

@MainActor
struct FavoritesLibraryView: View {
    @EnvironmentObject private var api: DouyinAPI
    @StateObject private var store = FavoritesLibraryStore()
    @StateObject private var playbackSlot = PlaybackSessionSlot(source: .favorites)
    private let isActive: Bool
    @State private var selectedIndex: Int?
    @State private var playbackToken: UInt64 = 0
    @State private var lastSelectedIndex: Int?
    @FocusState private var focusedIndex: Int?

    private let columns = Array(
        repeating: GridItem(.flexible(), spacing: 34, alignment: .top),
        count: 4
    )

    init(isActive: Bool) {
        self.isActive = isActive
    }

    var body: some View {
        ZStack {
            libraryBackground

            // 喜欢页在网格和播放之间切换时也保留同一个原生控制器。没有
            // currentItem 时它不会解码，只是保持 tvOS 的渲染层不被拆除。
            retainedPlayerContent

            if !isActive {
                Color.black.ignoresSafeArea()
            } else if selectedIndex != nil {
                if playbackSlot.session == nil {
                    ProgressView("正在载入视频")
                        .controlSize(.large)
                }
            } else if store.items.isEmpty {
                emptyState
            } else {
                libraryGrid
            }
        }
        .task(id: isActive) {
            guard isActive, store.items.isEmpty else { return }
            await store.refresh()
        }
        .onChange(of: api.cookieRevision) { _, _ in
            selectedIndex = nil
            Task { await store.refresh() }
        }
        .onChange(of: isActive) { _, active in
            if !active {
                selectedIndex = nil
                playbackSlot.suspend()
            }
        }
        .onChange(of: playbackToken) { _, _ in
            startPlaybackIfPossible()
        }
        .onChange(of: selectedIndex) { previousIndex, selectedIndex in
#if DEBUG
            var fields: [String: CustomStringConvertible] = [
                "items": store.items.count,
                "mode": selectedIndex == nil ? "grid" : "player"
            ]
            if let memory = PlaybackDiagnostics.shared.residentMemoryMegabytes() {
                fields["memoryMB"] = String(format: "%.1f", memory)
            }
            PlaybackDiagnostics.shared.event(
                selectedIndex == nil ? "show-grid" : "show-player",
                category: "favorites-ui",
                fields: fields
            )
#endif
            if previousIndex != nil, selectedIndex == nil {
                // 返回喜欢列表只释放当前视频，不销毁该 Tab 的播放器与控制器。
                playbackSlot.suspend()
                restoreFocus()
            }
        }
    }

    private var libraryBackground: some View {
        LinearGradient(
            colors: [Color.black, Color(red: 0.055, green: 0.06, blue: 0.075)],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
    }

    @ViewBuilder
    private var retainedPlayerContent: some View {
        if let index = selectedIndex ?? lastSelectedIndex,
           store.items.indices.contains(index),
           let playbackSession = playbackSlot.session {
            VideoPlayerView(
                aweme: store.items[index],
                cookie: api.cookie,
                playbackToken: playbackToken,
                coordinator: playbackSession,
                onPrevious: playPrevious,
                onNext: playNext
            )
            .ignoresSafeArea()
            .opacity(isActive && selectedIndex != nil ? 1 : 0)
            .allowsHitTesting(isActive && selectedIndex != nil)
            .onExitCommand { selectedIndex = nil }
        }
    }

    private var libraryGrid: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 36) {
                LazyVGrid(columns: columns, alignment: .leading, spacing: 42) {
                    ForEach(Array(store.items.enumerated()), id: \.offset) { index, aweme in
                        FavoriteVideoCard(
                            aweme: aweme,
                            isFocused: focusedIndex == index
                        ) {
                            selectedIndex = index
                            lastSelectedIndex = index
                            playbackToken &+= 1
                        }
                        .focused($focusedIndex, equals: index)
                        .onAppear {
                            Task { await store.loadMoreIfNeeded(currentIndex: index) }
                        }
                    }
                }

                if store.isLoading {
                    HStack {
                        Spacer()
                        ProgressView("正在加载更多")
                            .padding(.vertical, 28)
                        Spacer()
                    }
                }
            }
            .padding(.horizontal, 72)
            .padding(.top, 44)
            .padding(.bottom, 70)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 22) {
            if store.isLoading {
                ProgressView().controlSize(.large)
                Text("正在载入喜欢的视频").foregroundStyle(.secondary)
            } else {
                Image(systemName: store.errorMessage == nil ? "heart.slash" : "exclamationmark.triangle.fill")
                    .font(.system(size: 64, weight: .light))
                    .foregroundStyle(store.errorMessage == nil ? Color.secondary : Color.orange)
                Text(store.errorMessage ?? "还没有喜欢的视频")
                    .font(.title2.weight(.semibold))
                Button("重新加载") { Task { await store.refresh() } }
                    .buttonStyle(.borderedProminent)
            }
        }
    }

    private func playPrevious() {
        guard let index = selectedIndex, index > 0 else { return }
        selectedIndex = index - 1
        lastSelectedIndex = index - 1
        playbackToken &+= 1
    }

    private func playNext() {
        guard let index = selectedIndex else { return }
        if index + 1 < store.items.count {
            selectedIndex = index + 1
            lastSelectedIndex = index + 1
            playbackToken &+= 1
            Task { await store.loadMoreIfNeeded(currentIndex: index + 1) }
        } else {
            let expectedIndex = index
            let expectedToken = playbackToken
            Task {
                let oldCount = store.items.count
                await store.loadNextPage()
                guard selectedIndex == expectedIndex,
                      playbackToken == expectedToken else { return }
                if store.items.count > oldCount {
                    selectedIndex = oldCount
                    lastSelectedIndex = oldCount
                    playbackToken &+= 1
                }
            }
        }
    }

    private func restoreFocus() {
        DispatchQueue.main.async {
            focusedIndex = lastSelectedIndex
        }
    }

    private func startPlaybackIfPossible() {
        guard isActive,
              let index = selectedIndex,
              store.items.indices.contains(index) else { return }
        playbackSlot.activate().play(
            store.items[index],
            cookie: api.cookie,
            playbackToken: playbackToken
        )
    }
}

private struct FavoriteVideoCard: View {
    let aweme: Aweme
    let isFocused: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 13) {
                FavoriteArtwork(aweme: aweme)

                Text(aweme.desc?.isEmpty == false ? aweme.desc! : "无标题")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                    .frame(minHeight: 46, alignment: .topLeading)

                HStack(spacing: 10) {
                    AuthorAvatar(author: aweme.author)

                    Text(aweme.author?.nickname?.isEmpty == false ? aweme.author!.nickname! : "未知作者")
                        .font(.callout.weight(.medium))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)

                    Spacer(minLength: 8)

                    Label(
                        formattedCount(aweme.statistics?.digg_count ?? 0),
                        systemImage: "heart"
                    )
                    .font(.callout.weight(.medium))
                    .lineLimit(1)
                    .fixedSize(horizontal: true, vertical: false)
                    .layoutPriority(1)
                }
                .foregroundStyle(.secondary)
            }
            .contentShape(Rectangle())
            .frame(maxWidth: .infinity, alignment: .topLeading)
            .scaleEffect(isFocused ? 1.03 : 1)
            .shadow(
                color: .black.opacity(isFocused ? 0.45 : 0),
                radius: isFocused ? 18 : 0,
                y: isFocused ? 10 : 0
            )
            .animation(.easeOut(duration: 0.16), value: isFocused)
        }
        .buttonStyle(FavoriteButtonStyle())
        .focusEffectDisabled()
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .zIndex(isFocused ? 1 : 0)
    }

    private func formattedCount(_ count: Int) -> String {
        if count >= 100_000_000 {
            return formattedUnit(Double(count) / 100_000_000, suffix: "亿")
        }
        if count >= 10_000 {
            return formattedUnit(Double(count) / 10_000, suffix: "万")
        }
        return String(count)
    }

    private func formattedUnit(_ value: Double, suffix: String) -> String {
        value.rounded() == value
            ? "\(Int(value))\(suffix)"
            : String(format: "%.1f", value) + suffix
    }
}

private struct FavoriteButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.82 : 1)
    }
}

private struct AuthorAvatar: View {
    let author: Author?

    private var avatarURL: URL? {
        author?.avatar_thumb?.url_list?.compactMap(URL.init(string:)).first
    }

    var body: some View {
        AsyncImage(url: avatarURL) { phase in
            if case .success(let image) = phase {
                image.resizable().scaledToFill()
            } else {
                ZStack {
                    Color.white.opacity(0.1)
                    Image(systemName: "person.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(.secondary)
                }
            }
        }
        .frame(width: 34, height: 34)
        .clipShape(Circle())
    }
}

private struct FavoriteArtwork: View {
    let aweme: Aweme

    private var artworkURL: URL? {
        aweme.video?.cover?.url_list?.compactMap(URL.init(string:)).first
    }

    var body: some View {
        Color.clear
            .aspectRatio(3.0 / 4.0, contentMode: .fit)
            .overlay {
                AsyncImage(url: artworkURL) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    case .failure:
                        placeholder(systemImage: "photo.badge.exclamationmark")
                    default:
                        ProgressView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipped()
            }
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private func placeholder(systemImage: String) -> some View {
        ZStack {
            Color.white.opacity(0.055)
            Image(systemName: systemImage)
                .font(.system(size: 42, weight: .light))
                .foregroundStyle(.secondary)
        }
    }
}
