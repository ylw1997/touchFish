import SwiftUI

@MainActor
final class FavoritesLibraryStore: ObservableObject {
    @Published private(set) var items: [Aweme] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    private let api: DouyinAPI
    private var cursor = 0
    private var hasMore = true

    init(api: DouyinAPI = .shared) {
        self.api = api
    }

    func refresh() async {
        cursor = 0
        hasMore = true
        await load(reset: true)
    }

    func loadMoreIfNeeded(currentIndex: Int) async {
        guard currentIndex >= max(0, items.count - 4) else { return }
        await load(reset: false)
    }

    func loadNextPage() async {
        await load(reset: false)
    }

    private func load(reset: Bool) async {
        guard !isLoading, reset || hasMore else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let result = try await api.getFavorites(maxCursor: reset ? 0 : cursor)
            if reset { items = result.0 } else { items.append(contentsOf: result.0) }
            cursor = result.1
            hasMore = result.2
            if items.isEmpty { errorMessage = "还没有喜欢的视频" }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

@MainActor
struct FavoritesLibraryView: View {
    @EnvironmentObject private var api: DouyinAPI
    @StateObject private var store = FavoritesLibraryStore()
    @State private var selectedIndex: Int?
    @State private var playbackToken: UInt64 = 0
    @State private var lastSelectedIndex: Int?
    @FocusState private var focusedIndex: Int?

    private let columns = Array(
        repeating: GridItem(.flexible(), spacing: 34, alignment: .top),
        count: 4
    )

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.black, Color(red: 0.055, green: 0.06, blue: 0.075)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            if store.items.isEmpty {
                emptyState
            } else {
                libraryGrid
            }
        }
        .task { if store.items.isEmpty { await store.refresh() } }
        .onChange(of: api.cookieRevision) { _, _ in
            selectedIndex = nil
            Task { await store.refresh() }
        }
        .fullScreenCover(isPresented: playerPresented, onDismiss: restoreFocus) {
            if let index = selectedIndex, store.items.indices.contains(index) {
                VideoPlayerView(
                    aweme: store.items[index],
                    cookie: api.cookie,
                    playbackToken: playbackToken,
                    onPrevious: playPrevious,
                    onNext: playNext
                )
                .ignoresSafeArea()
                .onExitCommand { selectedIndex = nil }
            }
        }
    }

    private var libraryGrid: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 36) {
                LazyVGrid(columns: columns, alignment: .leading, spacing: 42) {
                    ForEach(Array(store.items.enumerated()), id: \.offset) { index, aweme in
                        FavoriteVideoCard(aweme: aweme) {
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

    private var playerPresented: Binding<Bool> {
        Binding(
            get: { selectedIndex != nil },
            set: { if !$0 { selectedIndex = nil } }
        )
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
            Task {
                let oldCount = store.items.count
                await store.loadNextPage()
                if store.items.count > oldCount {
                    selectedIndex = oldCount
                    lastSelectedIndex = oldCount
                    playbackToken &+= 1
                }
            }
        }
    }

    private func restoreFocus() {
        focusedIndex = lastSelectedIndex
    }
}

private struct FavoriteVideoCard: View {
    let aweme: Aweme
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 14) {
                FavoriteArtwork(aweme: aweme)
                    .aspectRatio(3.0 / 4.0, contentMode: .fit)

                Text(aweme.desc?.isEmpty == false ? aweme.desc! : "无标题")
                    .font(.headline)
                    .lineLimit(1)
            }
        }
        .buttonStyle(.card)
    }
}

private struct FavoriteArtwork: View {
    let aweme: Aweme

    private var artworkURL: URL? {
        aweme.video?.cover?.url_list?.compactMap(URL.init(string:)).first
    }

    var body: some View {
        GeometryReader { proxy in
            AsyncImage(url: artworkURL) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFill()
                        .frame(width: proxy.size.width, height: proxy.size.height)
                case .failure:
                    placeholder(systemImage: "photo.badge.exclamationmark")
                default:
                    ZStack {
                        Color.white.opacity(0.055)
                        ProgressView()
                    }
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
            .clipped()
        }
        .background(Color.white.opacity(0.045))
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
