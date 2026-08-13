import Foundation
import ImageIO
import SwiftUI
import UIKit

@MainActor
protocol VideoLibraryStore: ObservableObject {
    var items: [Aweme] { get }
    func loadMoreIfNeeded(currentIndex: Int) async
    func loadNextPage() async
}

extension Aweme {
    var hasVideoPlaybackURL: Bool {
        let audioExtensions = Set(["aac", "m4a", "mp3", "wav"])
        let candidates = (video?.play_addr_h264?.url_list ?? [])
            + (video?.play_addr?.url_list ?? [])
            + (video?.bit_rate ?? []).flatMap { $0.play_addr?.url_list ?? [] }
        return candidates.contains { value in
            guard let url = URL(string: value) else { return false }
            let host = url.host?.lowercased() ?? ""
            return !host.contains("music")
                && !audioExtensions.contains(url.pathExtension.lowercased())
        }
    }
}

@MainActor
final class FavoritesLibraryStore: ObservableObject, VideoLibraryStore {
    @Published private(set) var items: [Aweme] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    private let api: DouyinAPI
    private var cursor = 0
    private var hasMore = true
    private var generation: UInt = 0

    init(api: DouyinAPI? = nil) {
        self.api = api ?? .shared
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
            let videoItems = result.0.filter(\.hasVideoPlaybackURL)
            if reset { items = videoItems } else { items.append(contentsOf: videoItems) }
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
    @State private var selectedIndex: Int?
    private let isActive: Bool

    init(isActive: Bool) {
        self.isActive = isActive
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()

                if !isActive {
                    Color.black.ignoresSafeArea()
                } else if store.items.isEmpty {
                    emptyState
                } else {
                    VideoLibraryCollectionView(
                        items: store.items,
                        onSelect: { selectedIndex = $0 },
                        onNearEnd: { index in
                            Task { await store.loadMoreIfNeeded(currentIndex: index) }
                        }
                    )
                    .ignoresSafeArea(edges: .bottom)
                }
            }
            .navigationDestination(isPresented: playbackPresented) {
                if let selectedIndex {
                    VideoLibraryPlaybackPage(
                        store: store,
                        initialIndex: selectedIndex,
                        source: .favorites
                    )
                }
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
            if !active { selectedIndex = nil }
        }
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
                Text("正在载入喜欢的视频").foregroundStyle(Color.white.opacity(0.7))
            } else {
                Image(systemName: store.errorMessage == nil ? "heart.slash" : "exclamationmark.triangle.fill")
                    .font(.system(size: 64, weight: .light))
                    .foregroundStyle(store.errorMessage == nil ? Color.secondary : Color.orange)
                Text(store.errorMessage ?? "还没有喜欢的视频")
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(.white)
                Button("重新加载") { Task { await store.refresh() } }
                    .buttonStyle(.borderedProminent)
            }
        }
    }
}

/// 独立播放页。列表控制器保留在 NavigationStack 下层，系统会在返回时恢复
/// collection view 的滚动位置与焦点。
@MainActor
struct VideoLibraryPlaybackPage<Store: VideoLibraryStore>: View {
    @EnvironmentObject private var api: DouyinAPI
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var store: Store
    @StateObject private var playbackSlot: PlaybackSessionSlot
    @State private var currentIndex: Int
    @State private var playbackToken: UInt64 = 1
    @State private var selectedAuthor: Author?
    @State private var authorPresented = false
    private let allowsAuthorNavigation: Bool

    init(
        store: Store,
        initialIndex: Int,
        source: PlaybackSource,
        allowsAuthorNavigation: Bool = true
    ) {
        self.store = store
        _currentIndex = State(initialValue: initialIndex)
        _playbackSlot = StateObject(wrappedValue: PlaybackSessionSlot(source: source))
        self.allowsAuthorNavigation = allowsAuthorNavigation
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            if store.items.indices.contains(currentIndex),
               let session = playbackSlot.session {
                VideoPlayerView(
                    aweme: store.items[currentIndex],
                    cookie: api.cookie,
                    playbackToken: playbackToken,
                    coordinator: session,
                    onPrevious: playPrevious,
                    onNext: playNext,
                    onShowAuthor: allowsAuthorNavigation ? { showCurrentAuthor() } : nil
                )
                .ignoresSafeArea()
            } else {
                ProgressView("正在载入视频").controlSize(.large)
            }
        }
        .onAppear { startPlayback() }
        .onChange(of: currentIndex) { _, _ in startPlayback() }
        .onChange(of: authorPresented) { _, presented in
            guard !presented else { return }
            selectedAuthor = nil
            startPlayback()
        }
        .onExitCommand { dismiss() }
        .onDisappear { playbackSlot.deactivate() }
        .navigationDestination(isPresented: $authorPresented) {
            if let selectedAuthor {
                AuthorWorksView(author: selectedAuthor)
            }
        }
    }

    private func startPlayback() {
        guard store.items.indices.contains(currentIndex) else { return }
        playbackSlot.activate().play(
            store.items[currentIndex],
            cookie: api.cookie,
            playbackToken: playbackToken
        )
    }

    private func playPrevious() {
        guard currentIndex > 0 else { return }
        playbackToken &+= 1
        currentIndex -= 1
    }

    private func playNext() {
        if currentIndex + 1 < store.items.count {
            playbackToken &+= 1
            currentIndex += 1
            Task { await store.loadMoreIfNeeded(currentIndex: currentIndex) }
            return
        }

        let expectedIndex = currentIndex
        Task {
            let oldCount = store.items.count
            await store.loadNextPage()
            guard currentIndex == expectedIndex, store.items.count > oldCount else { return }
            playbackToken &+= 1
            currentIndex = oldCount
        }
    }

    private func showCurrentAuthor() {
        guard allowsAuthorNavigation,
              store.items.indices.contains(currentIndex),
              let author = store.items[currentIndex].displayAuthor,
              !author.uid.isEmpty else { return }
        selectedAuthor = author
        playbackSlot.deactivate()
        authorPresented = true
    }
}

@MainActor
struct VideoLibraryCollectionView: UIViewControllerRepresentable {
    let items: [Aweme]
    let onSelect: (Int) -> Void
    let onNearEnd: (Int) -> Void
    var topContentInset: CGFloat = 54

    func makeUIViewController(context: Context) -> VideoLibraryCollectionViewController {
        let controller = VideoLibraryCollectionViewController(topContentInset: topContentInset)
        controller.onSelect = onSelect
        controller.onNearEnd = onNearEnd
        controller.update(items: items)
        return controller
    }

    func updateUIViewController(
        _ controller: VideoLibraryCollectionViewController,
        context: Context
    ) {
        controller.onSelect = onSelect
        controller.onNearEnd = onNearEnd
        controller.update(items: items)
    }
}

final class VideoLibraryCollectionViewController: UICollectionViewController {
    var onSelect: ((Int) -> Void)?
    var onNearEnd: ((Int) -> Void)?
    private var items: [Aweme] = []

    init(topContentInset: CGFloat) {
        super.init(collectionViewLayout: Self.makeLayout(topContentInset: topContentInset))
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        collectionView.backgroundColor = .black
        collectionView.clipsToBounds = true
        collectionView.remembersLastFocusedIndexPath = true
        collectionView.register(
            VideoLibraryCollectionCell.self,
            forCellWithReuseIdentifier: VideoLibraryCollectionCell.reuseIdentifier
        )
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        // 播放页入栈或切换 Tab 时，立即停止列表的所有图片网络/解码工作。
        collectionView.visibleCells
            .compactMap { $0 as? VideoLibraryCollectionCell }
            .forEach { $0.cancelImageLoading() }
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // 返回列表时保留现有 cell 和焦点，只恢复被暂停的图片任务。
        // reloadItems 会让封面、文字和焦点状态整体重建，产生明显的二次闪烁。
        for indexPath in collectionView.indexPathsForVisibleItems {
            guard items.indices.contains(indexPath.item),
                  let cell = collectionView.cellForItem(at: indexPath) as? VideoLibraryCollectionCell else {
                continue
            }
            cell.configure(with: items[indexPath.item])
        }
    }

    func update(items: [Aweme]) {
        guard self.items.map(\.aweme_id) != items.map(\.aweme_id) else { return }
        self.items = items
        guard isViewLoaded else { return }
        collectionView.reloadData()
    }

    override func numberOfSections(in collectionView: UICollectionView) -> Int { 1 }

    override func collectionView(
        _ collectionView: UICollectionView,
        numberOfItemsInSection section: Int
    ) -> Int {
        items.count
    }

    override func collectionView(
        _ collectionView: UICollectionView,
        cellForItemAt indexPath: IndexPath
    ) -> UICollectionViewCell {
        guard let cell = collectionView.dequeueReusableCell(
            withReuseIdentifier: VideoLibraryCollectionCell.reuseIdentifier,
            for: indexPath
        ) as? VideoLibraryCollectionCell else {
            return UICollectionViewCell()
        }
        cell.configure(with: items[indexPath.item])
        return cell
    }

    override func collectionView(
        _ collectionView: UICollectionView,
        didSelectItemAt indexPath: IndexPath
    ) {
        onSelect?(indexPath.item)
    }

    override func collectionView(
        _ collectionView: UICollectionView,
        willDisplay cell: UICollectionViewCell,
        forItemAt indexPath: IndexPath
    ) {
        onNearEnd?(indexPath.item)
    }

    override func collectionView(
        _ collectionView: UICollectionView,
        didUpdateFocusIn context: UICollectionViewFocusUpdateContext,
        with coordinator: UIFocusAnimationCoordinator
    ) {
        guard let indexPath = context.nextFocusedIndexPath else { return }
        coordinator.addCoordinatedAnimations(nil) { [weak self] in
            DispatchQueue.main.async {
                self?.keepFocusedItemBelowTopEdge(at: indexPath)
            }
        }
    }

    private func keepFocusedItemBelowTopEdge(at indexPath: IndexPath) {
        guard let attributes = collectionView.layoutAttributesForItem(at: indexPath) else { return }
        let focusExpansion: CGFloat = 14
        let topSpacing: CGFloat = 24
        let itemTop = attributes.frame.minY - focusExpansion
        let visibleTop = collectionView.contentOffset.y + collectionView.adjustedContentInset.top
        guard itemTop < visibleTop + topSpacing else { return }

        let minimumOffset = -collectionView.adjustedContentInset.top
        let targetOffset = max(minimumOffset, itemTop - topSpacing)
        collectionView.setContentOffset(
            CGPoint(x: collectionView.contentOffset.x, y: targetOffset),
            animated: true
        )
    }

    private static func makeLayout(topContentInset: CGFloat) -> UICollectionViewLayout {
        let item = NSCollectionLayoutItem(
            layoutSize: NSCollectionLayoutSize(
                widthDimension: .fractionalWidth(1.0 / 6.0),
                heightDimension: .fractionalHeight(1)
            )
        )
        item.contentInsets = NSDirectionalEdgeInsets(top: 0, leading: 18, bottom: 0, trailing: 18)

        let group = NSCollectionLayoutGroup.horizontal(
            layoutSize: NSCollectionLayoutSize(
                widthDimension: .fractionalWidth(1),
                heightDimension: .absolute(444)
            ),
            subitems: [item]
        )
        let section = NSCollectionLayoutSection(group: group)
        section.interGroupSpacing = 20
        section.contentInsets = NSDirectionalEdgeInsets(
            top: topContentInset,
            leading: 100,
            bottom: 56,
            trailing: 100
        )
        return UICollectionViewCompositionalLayout(section: section)
    }
}

private final class VideoLibraryCollectionCell: UICollectionViewCell {
    static let reuseIdentifier = "VideoLibraryCollectionCell"

    private let artworkView = UIImageView()
    private let titleLabel = UILabel()
    private let avatarView = UIImageView()
    private let authorLabel = UILabel()
    private let heartView = UIImageView(image: UIImage(systemName: "heart"))
    private let countLabel = UILabel()
    private var artworkTask: URLSessionDataTask?
    private var avatarTask: URLSessionDataTask?
    private var representedID: String?

    override init(frame: CGRect) {
        super.init(frame: frame)
        configureViews()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        cancelImageLoading()
        representedID = nil
        artworkView.image = nil
        avatarView.image = nil
        titleLabel.text = nil
        authorLabel.text = nil
        countLabel.text = nil
    }

    func configure(with aweme: Aweme) {
        cancelImageLoading()
        representedID = aweme.aweme_id
        titleLabel.text = aweme.desc?.isEmpty == false ? aweme.desc : "无标题"
        authorLabel.text = aweme.author?.nickname?.isEmpty == false ? aweme.author?.nickname : "未知作者"
        countLabel.text = Self.formattedCount(aweme.statistics?.digg_count ?? 0)

        let artworkURL = aweme.video?.cover?.url_list?.compactMap(URL.init(string:)).first
        artworkTask = NativeThumbnailLoader.load(url: artworkURL, maxPixelSize: 460) { [weak self] image in
            guard let self, representedID == aweme.aweme_id else { return }
            artworkView.image = image
        }
        let avatarURL = aweme.author?.avatar_thumb?.url_list?.compactMap(URL.init(string:)).first
        avatarTask = NativeThumbnailLoader.load(url: avatarURL, maxPixelSize: 72) { [weak self] image in
            guard let self, representedID == aweme.aweme_id else { return }
            avatarView.image = image
        }
    }

    func cancelImageLoading() {
        artworkTask?.cancel()
        avatarTask?.cancel()
        artworkTask = nil
        avatarTask = nil
    }

    override func didUpdateFocus(
        in context: UIFocusUpdateContext,
        with coordinator: UIFocusAnimationCoordinator
    ) {
        super.didUpdateFocus(in: context, with: coordinator)
        coordinator.addCoordinatedAnimations({
            self.transform = self.isFocused
                ? CGAffineTransform(scaleX: 1.04, y: 1.04)
                : .identity
            self.layer.zPosition = self.isFocused ? 10 : 0
        }, completion: nil)
    }

    private func configureViews() {
        clipsToBounds = false
        contentView.clipsToBounds = false

        artworkView.translatesAutoresizingMaskIntoConstraints = false
        artworkView.backgroundColor = UIColor.white.withAlphaComponent(0.06)
        artworkView.contentMode = .scaleAspectFill
        artworkView.clipsToBounds = true
        artworkView.layer.cornerRadius = 14

        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.font = .systemFont(ofSize: 23, weight: .semibold)
        titleLabel.textColor = .white
        titleLabel.numberOfLines = 2
        titleLabel.lineBreakMode = .byTruncatingTail

        avatarView.translatesAutoresizingMaskIntoConstraints = false
        avatarView.backgroundColor = UIColor.white.withAlphaComponent(0.08)
        avatarView.contentMode = .scaleAspectFill
        avatarView.clipsToBounds = true
        avatarView.layer.cornerRadius = 14

        authorLabel.font = .systemFont(ofSize: 18, weight: .regular)
        authorLabel.textColor = UIColor.white.withAlphaComponent(0.78)
        authorLabel.numberOfLines = 1

        heartView.tintColor = .secondaryLabel
        heartView.contentMode = .scaleAspectFit

        countLabel.font = .systemFont(ofSize: 18, weight: .regular)
        countLabel.textColor = UIColor.white.withAlphaComponent(0.62)
        countLabel.setContentCompressionResistancePriority(.required, for: .horizontal)

        let footer = UIStackView(arrangedSubviews: [avatarView, authorLabel, UIView(), heartView, countLabel])
        footer.translatesAutoresizingMaskIntoConstraints = false
        footer.axis = .horizontal
        footer.alignment = .center
        footer.spacing = 7

        contentView.addSubview(artworkView)
        contentView.addSubview(titleLabel)
        contentView.addSubview(footer)

        NSLayoutConstraint.activate([
            artworkView.topAnchor.constraint(equalTo: contentView.topAnchor),
            artworkView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            artworkView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            artworkView.heightAnchor.constraint(equalTo: artworkView.widthAnchor, multiplier: 4.0 / 3.0),

            titleLabel.topAnchor.constraint(equalTo: artworkView.bottomAnchor, constant: 12),
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            titleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),

            footer.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 10),
            footer.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            footer.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            footer.bottomAnchor.constraint(lessThanOrEqualTo: contentView.bottomAnchor),

            avatarView.widthAnchor.constraint(equalToConstant: 28),
            avatarView.heightAnchor.constraint(equalToConstant: 28),
            heartView.widthAnchor.constraint(equalToConstant: 21),
            heartView.heightAnchor.constraint(equalToConstant: 21)
        ])
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

enum NativeThumbnailLoader {
    private static let session: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.urlCache = nil
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        configuration.httpMaximumConnectionsPerHost = 2
        configuration.timeoutIntervalForRequest = 15
        return URLSession(configuration: configuration)
    }()

    @discardableResult
    static func load(
        url: URL?,
        maxPixelSize: Int,
        completion: @escaping (UIImage?) -> Void
    ) -> URLSessionDataTask? {
        guard let url else {
            completion(nil)
            return nil
        }
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        let task = session.dataTask(with: request) { data, response, _ in
            guard let data,
                  let response = response as? HTTPURLResponse,
                  (200..<300).contains(response.statusCode),
                  let image = downsample(data: data, maxPixelSize: maxPixelSize) else {
                DispatchQueue.main.async { completion(nil) }
                return
            }
            DispatchQueue.main.async { completion(UIImage(cgImage: image)) }
        }
        task.resume()
        return task
    }

    private static func downsample(data: Data, maxPixelSize: Int) -> CGImage? {
        let sourceOptions: [CFString: Any] = [kCGImageSourceShouldCache: false]
        guard let source = CGImageSourceCreateWithData(data as CFData, sourceOptions as CFDictionary) else {
            return nil
        }
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: maxPixelSize,
            kCGImageSourceShouldCacheImmediately: true
        ]
        return CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
    }
}
