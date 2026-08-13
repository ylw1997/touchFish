import SwiftUI
import UIKit

@MainActor
final class LiveLibraryStore: ObservableObject {
    @Published private(set) var followedItems: [Aweme] = []
    @Published private(set) var recommendedItems: [Aweme] = []
    @Published private(set) var isLoading = false
    @Published private(set) var isLoadingMore = false
    @Published private(set) var errorMessage: String?

    private let api: DouyinAPI
    private var recommendCursor = 0
    private var recommendHasMore = true
    private var generation: UInt = 0

    init(api: DouyinAPI? = nil) {
        self.api = api ?? .shared
    }

    func refresh() async {
        generation &+= 1
        let requestGeneration = generation
        recommendCursor = 0
        recommendHasMore = true
        isLoading = true
        isLoadingMore = false
        errorMessage = nil
        defer {
            if requestGeneration == generation { isLoading = false }
        }

        async let followedRequest = fetchFollowed()
        async let recommendedRequest = fetchRecommended(maxTime: 0)
        let (followedResult, recommendedResult) = await (followedRequest, recommendedRequest)
        guard requestGeneration == generation else { return }

        followedItems = followedResult ?? []
        if let recommendedResult {
            recommendedItems = recommendedResult.0
            recommendCursor = recommendedResult.1
            recommendHasMore = recommendedResult.2
        } else {
            recommendedItems = []
        }

        if followedResult == nil, recommendedResult == nil {
            errorMessage = "直播列表加载失败，请稍后重试"
        } else if followedItems.isEmpty, recommendedItems.isEmpty {
            errorMessage = "当前没有正在直播的房间"
        }
    }

    func loadMoreRecommendedIfNeeded(currentIndex: Int) async {
        guard currentIndex >= max(0, recommendedItems.count - 4),
              recommendHasMore,
              !isLoading,
              !isLoadingMore else { return }

        let requestGeneration = generation
        isLoadingMore = true
        defer {
            if requestGeneration == generation { isLoadingMore = false }
        }

        guard let result = await fetchRecommended(maxTime: recommendCursor),
              requestGeneration == generation else { return }
        recommendedItems.append(contentsOf: result.0)
        recommendCursor = result.1
        recommendHasMore = result.2
    }

    private func fetchFollowed() async -> [Aweme]? {
        try? await api.getFollowedLiveRooms()
    }

    private func fetchRecommended(maxTime: Int) async -> ([Aweme], Int, Bool)? {
        try? await api.getLiveFeed(maxTime: maxTime)
    }
}

@MainActor
struct LiveLibraryView: View {
    @EnvironmentObject private var api: DouyinAPI
    @StateObject private var store = LiveLibraryStore()
    @State private var selectedRoom: Aweme?
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
                } else if store.followedItems.isEmpty, store.recommendedItems.isEmpty {
                    emptyState
                } else {
                    LiveLibraryCollectionView(
                        followedItems: store.followedItems,
                        recommendedItems: store.recommendedItems,
                        onSelect: { selectedRoom = $0 },
                        onNearRecommendedEnd: { index in
                            Task { await store.loadMoreRecommendedIfNeeded(currentIndex: index) }
                        }
                    )
                    .ignoresSafeArea(edges: .bottom)
                }
            }
            .navigationDestination(isPresented: playbackPresented) {
                if let selectedRoom {
                    let rooms = store.followedItems + store.recommendedItems
                    let initialIndex = rooms.firstIndex {
                        $0.aweme_id == selectedRoom.aweme_id
                    } ?? 0
                    LiveRoomPlaybackPage(
                        rooms: rooms,
                        initialIndex: initialIndex
                    )
                }
            }
        }
        .task(id: isActive) {
            guard isActive, store.followedItems.isEmpty, store.recommendedItems.isEmpty else { return }
            await store.refresh()
        }
        .onChange(of: api.cookieRevision) { _, _ in
            selectedRoom = nil
            Task { await store.refresh() }
        }
        .onChange(of: isActive) { _, active in
            if !active { selectedRoom = nil }
        }
    }

    private var playbackPresented: Binding<Bool> {
        Binding(
            get: { selectedRoom != nil },
            set: { presented in
                if !presented { selectedRoom = nil }
            }
        )
    }

    private var emptyState: some View {
        VStack(spacing: 22) {
            if store.isLoading {
                ProgressView().controlSize(.large)
                Text("正在载入直播列表").foregroundStyle(Color.white.opacity(0.7))
            } else {
                Image(systemName: store.errorMessage == nil
                    ? "dot.radiowaves.left.and.right"
                    : "exclamationmark.triangle.fill")
                    .font(.system(size: 64, weight: .light))
                    .foregroundStyle(store.errorMessage == nil ? Color.secondary : Color.orange)
                Text(store.errorMessage ?? "当前没有正在直播的房间")
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(.white)
                Button("重新加载") { Task { await store.refresh() } }
                    .buttonStyle(.borderedProminent)
            }
        }
    }
}

@MainActor
private struct LiveRoomPlaybackPage: View {
    @EnvironmentObject private var api: DouyinAPI
    @Environment(\.dismiss) private var dismiss
    @StateObject private var playbackSlot = PlaybackSessionSlot(source: .live)
    @State private var playbackItem: Aweme?
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var playbackToken: UInt64 = 1
    @State private var selectedAuthor: Author?
    @State private var authorPresented = false
    @State private var currentIndex: Int

    let rooms: [Aweme]

    init(rooms: [Aweme], initialIndex: Int) {
        self.rooms = rooms
        _currentIndex = State(initialValue: initialIndex)
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if let playbackItem, let session = playbackSlot.session {
                VideoPlayerView(
                    aweme: playbackItem,
                    cookie: api.cookie,
                    playbackToken: playbackToken,
                    coordinator: session,
                    onPrevious: playPrevious,
                    onNext: playNext,
                    onShowAuthor: showCurrentAuthor
                )
                .ignoresSafeArea()
            } else if isLoading {
                VStack(spacing: 20) {
                    ProgressView().controlSize(.large)
                    Text("正在进入直播间").foregroundStyle(Color.white.opacity(0.7))
                }
            } else {
                VStack(spacing: 22) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 56, weight: .light))
                        .foregroundStyle(.orange)
                    Text(errorMessage ?? "该直播间暂时无法播放")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.white)
                    Button("重试") {
                        guard let discoveryItem else { return }
                        Task { await resolveAndPlay(discoveryItem) }
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
        }
        .task(id: discoveryItem?.aweme_id) {
            guard let discoveryItem else { return }
            await resolveAndPlay(discoveryItem)
        }
        .onChange(of: authorPresented) { _, presented in
            guard !presented, playbackItem != nil else { return }
            selectedAuthor = nil
            startPlayback()
        }
        .navigationDestination(isPresented: $authorPresented) {
            if let selectedAuthor {
                AuthorWorksView(author: selectedAuthor)
            }
        }
        .onExitCommand { dismiss() }
        .onDisappear { playbackSlot.deactivate() }
    }

    private var discoveryItem: Aweme? {
        rooms.indices.contains(currentIndex) ? rooms[currentIndex] : nil
    }

    private func resolveAndPlay(_ discoveryItem: Aweme) async {
        guard let webRID = discoveryItem.liveRoom?.owner?.web_rid, !webRID.isEmpty else {
            errorMessage = "直播间缺少播放信息"
            return
        }

        playbackSlot.deactivate()
        playbackItem = nil
        errorMessage = nil
        isLoading = true
        defer {
            if self.discoveryItem?.aweme_id == discoveryItem.aweme_id {
                isLoading = false
            }
        }

        do {
            let room = try await api.getPlayableLiveRoom(webRID: webRID)
            try Task.checkCancellation()
            guard self.discoveryItem?.aweme_id == discoveryItem.aweme_id else { return }
            playbackItem = Aweme(liveRoom: room)
            playbackToken &+= 1
            startPlayback()
        } catch is CancellationError {
            return
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func playPrevious() {
        guard currentIndex > 0 else { return }
        currentIndex -= 1
    }

    private func playNext() {
        guard currentIndex + 1 < rooms.count else { return }
        currentIndex += 1
    }

    private func startPlayback() {
        guard let playbackItem else { return }
        playbackSlot.activate().play(
            playbackItem,
            cookie: api.cookie,
            playbackToken: playbackToken
        )
    }

    private func showCurrentAuthor() {
        guard let author = playbackItem?.displayAuthor, !author.uid.isEmpty else { return }
        selectedAuthor = author
        playbackSlot.deactivate()
        authorPresented = true
    }
}

@MainActor
private struct LiveLibraryCollectionView: UIViewControllerRepresentable {
    let followedItems: [Aweme]
    let recommendedItems: [Aweme]
    let onSelect: (Aweme) -> Void
    let onNearRecommendedEnd: (Int) -> Void

    func makeUIViewController(context: Context) -> LiveLibraryCollectionViewController {
        let controller = LiveLibraryCollectionViewController()
        controller.onSelect = onSelect
        controller.onNearRecommendedEnd = onNearRecommendedEnd
        controller.update(followedItems: followedItems, recommendedItems: recommendedItems)
        return controller
    }

    func updateUIViewController(
        _ controller: LiveLibraryCollectionViewController,
        context: Context
    ) {
        controller.onSelect = onSelect
        controller.onNearRecommendedEnd = onNearRecommendedEnd
        controller.update(followedItems: followedItems, recommendedItems: recommendedItems)
    }
}

private final class LiveLibraryCollectionViewController: UICollectionViewController {
    var onSelect: ((Aweme) -> Void)?
    var onNearRecommendedEnd: ((Int) -> Void)?

    private var sections: [[Aweme]] = [[], []]
    private let sectionTitles = ["我的关注", "推荐直播"]

    init() {
        super.init(collectionViewLayout: Self.makeLayout())
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
            LiveLibraryCollectionCell.self,
            forCellWithReuseIdentifier: LiveLibraryCollectionCell.reuseIdentifier
        )
        collectionView.register(
            LiveLibrarySectionHeader.self,
            forSupplementaryViewOfKind: UICollectionView.elementKindSectionHeader,
            withReuseIdentifier: LiveLibrarySectionHeader.reuseIdentifier
        )
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        collectionView.visibleCells
            .compactMap { $0 as? LiveLibraryCollectionCell }
            .forEach { $0.cancelImageLoading() }
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        for indexPath in collectionView.indexPathsForVisibleItems {
            guard sections.indices.contains(indexPath.section),
                  sections[indexPath.section].indices.contains(indexPath.item),
                  let cell = collectionView.cellForItem(at: indexPath) as? LiveLibraryCollectionCell else {
                continue
            }
            cell.configure(with: sections[indexPath.section][indexPath.item])
        }
    }

    func update(followedItems: [Aweme], recommendedItems: [Aweme]) {
        let updatedSections = [followedItems, recommendedItems]
        let previousIDs = sections.map { $0.map(\.aweme_id) }
        let updatedIDs = updatedSections.map { $0.map(\.aweme_id) }
        guard previousIDs != updatedIDs else { return }
        sections = updatedSections
        guard isViewLoaded else { return }
        collectionView.reloadData()
    }

    override func numberOfSections(in collectionView: UICollectionView) -> Int { 2 }

    override func collectionView(
        _ collectionView: UICollectionView,
        numberOfItemsInSection section: Int
    ) -> Int {
        sections[section].count
    }

    override func collectionView(
        _ collectionView: UICollectionView,
        cellForItemAt indexPath: IndexPath
    ) -> UICollectionViewCell {
        guard let cell = collectionView.dequeueReusableCell(
            withReuseIdentifier: LiveLibraryCollectionCell.reuseIdentifier,
            for: indexPath
        ) as? LiveLibraryCollectionCell else { return UICollectionViewCell() }
        cell.configure(with: sections[indexPath.section][indexPath.item])
        return cell
    }

    override func collectionView(
        _ collectionView: UICollectionView,
        viewForSupplementaryElementOfKind kind: String,
        at indexPath: IndexPath
    ) -> UICollectionReusableView {
        guard kind == UICollectionView.elementKindSectionHeader,
              let header = collectionView.dequeueReusableSupplementaryView(
                ofKind: kind,
                withReuseIdentifier: LiveLibrarySectionHeader.reuseIdentifier,
                for: indexPath
              ) as? LiveLibrarySectionHeader else { return UICollectionReusableView() }

        let isEmpty = sections[indexPath.section].isEmpty
        header.configure(
            title: sectionTitles[indexPath.section],
            detail: isEmpty ? "暂无正在直播的房间" : nil
        )
        return header
    }

    override func collectionView(
        _ collectionView: UICollectionView,
        didSelectItemAt indexPath: IndexPath
    ) {
        onSelect?(sections[indexPath.section][indexPath.item])
    }

    override func collectionView(
        _ collectionView: UICollectionView,
        willDisplay cell: UICollectionViewCell,
        forItemAt indexPath: IndexPath
    ) {
        guard indexPath.section == 1 else { return }
        onNearRecommendedEnd?(indexPath.item)
    }

    private static func makeLayout() -> UICollectionViewLayout {
        UICollectionViewCompositionalLayout { sectionIndex, _ in
            let item = NSCollectionLayoutItem(
                layoutSize: NSCollectionLayoutSize(
                    widthDimension: .fractionalWidth(1.0 / 4.0),
                    heightDimension: .fractionalHeight(1)
                )
            )
            item.contentInsets = NSDirectionalEdgeInsets(
                top: 4,
                leading: 16,
                bottom: 12,
                trailing: 16
            )

            let group = NSCollectionLayoutGroup.horizontal(
                layoutSize: NSCollectionLayoutSize(
                    widthDimension: .fractionalWidth(1),
                    heightDimension: .absolute(318)
                ),
                subitems: [item]
            )

            let section = NSCollectionLayoutSection(group: group)
            // 两个分区都参与同一个纵向滚动，不再做横向货架。
            section.interGroupSpacing = 8
            section.contentInsets = NSDirectionalEdgeInsets(
                top: 0,
                leading: 76,
                bottom: 18,
                trailing: 76
            )
            section.boundarySupplementaryItems = [
                NSCollectionLayoutBoundarySupplementaryItem(
                    layoutSize: NSCollectionLayoutSize(
                        widthDimension: .fractionalWidth(1),
                        // 推荐分区的标题与首排卡片留出更明确的呼吸空间；
                        // 关注分区保持现有紧凑布局。
                        heightDimension: .absolute(sectionIndex == 1 ? 58 : 40)
                    ),
                    elementKind: UICollectionView.elementKindSectionHeader,
                    alignment: .top
                )
            ]
            return section
        }
    }
}

private final class LiveLibrarySectionHeader: UICollectionReusableView {
    static let reuseIdentifier = "LiveLibrarySectionHeader"

    private let titleLabel = UILabel()
    private let detailLabel = UILabel()

    override init(frame: CGRect) {
        super.init(frame: frame)
        titleLabel.font = .systemFont(ofSize: 28, weight: .bold)
        titleLabel.textColor = .white
        detailLabel.font = .systemFont(ofSize: 19, weight: .regular)
        detailLabel.textColor = UIColor.white.withAlphaComponent(0.68)

        let stack = UIStackView(arrangedSubviews: [titleLabel, detailLabel])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .horizontal
        stack.alignment = .center
        stack.spacing = 14
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            stack.trailingAnchor.constraint(lessThanOrEqualTo: trailingAnchor),
            stack.centerYAnchor.constraint(equalTo: centerYAnchor)
        ])
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func configure(title: String, detail: String?) {
        titleLabel.text = title
        detailLabel.text = detail
        detailLabel.isHidden = detail == nil
    }
}

private final class LiveLibraryCollectionCell: UICollectionViewCell {
    static let reuseIdentifier = "LiveLibraryCollectionCell"

    private let artworkView = UIImageView()
    private let liveBadge = UILabel()
    private let titleLabel = UILabel()
    private let avatarView = UIImageView()
    private let authorLabel = UILabel()
    private let viewerIcon = UIImageView(image: UIImage(systemName: "person.2.fill"))
    private let viewerLabel = UILabel()
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
        viewerLabel.text = nil
    }

    func configure(with aweme: Aweme) {
        cancelImageLoading()
        representedID = aweme.aweme_id
        let room = aweme.liveRoom
        titleLabel.text = room?.title?.isEmpty == false ? room?.title : "直播中"
        authorLabel.text = room?.owner?.nickname?.isEmpty == false
            ? room?.owner?.nickname
            : "未知主播"
        viewerLabel.text = Self.formattedCount(room?.user_count ?? 0)

        let artworkURL = room?.cover?.url_list?.compactMap(URL.init(string:)).first
            ?? room?.owner?.avatar_thumb?.url_list?.compactMap(URL.init(string:)).first
        artworkTask = NativeThumbnailLoader.load(url: artworkURL, maxPixelSize: 720) { [weak self] image in
            guard let self, representedID == aweme.aweme_id else { return }
            artworkView.image = image
        }

        let avatarURL = room?.owner?.avatar_thumb?.url_list?.compactMap(URL.init(string:)).first
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
                ? CGAffineTransform(scaleX: 1.045, y: 1.045)
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

        liveBadge.translatesAutoresizingMaskIntoConstraints = false
        liveBadge.text = "  LIVE  "
        liveBadge.font = .systemFont(ofSize: 16, weight: .bold)
        liveBadge.textColor = .white
        liveBadge.backgroundColor = .systemPink
        liveBadge.layer.cornerRadius = 7
        liveBadge.clipsToBounds = true

        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.font = .systemFont(ofSize: 23, weight: .semibold)
        titleLabel.textColor = .white
        titleLabel.numberOfLines = 1
        titleLabel.lineBreakMode = .byTruncatingTail

        avatarView.translatesAutoresizingMaskIntoConstraints = false
        avatarView.backgroundColor = UIColor.white.withAlphaComponent(0.08)
        avatarView.contentMode = .scaleAspectFill
        avatarView.clipsToBounds = true
        avatarView.layer.cornerRadius = 14

        authorLabel.font = .systemFont(ofSize: 18, weight: .regular)
        authorLabel.textColor = UIColor.white.withAlphaComponent(0.78)
        authorLabel.numberOfLines = 1

        viewerIcon.tintColor = UIColor.white.withAlphaComponent(0.62)
        viewerIcon.contentMode = .scaleAspectFit
        viewerLabel.font = .systemFont(ofSize: 18, weight: .regular)
        viewerLabel.textColor = UIColor.white.withAlphaComponent(0.62)
        viewerLabel.setContentCompressionResistancePriority(.required, for: .horizontal)

        let footer = UIStackView(
            arrangedSubviews: [avatarView, authorLabel, UIView(), viewerIcon, viewerLabel]
        )
        footer.translatesAutoresizingMaskIntoConstraints = false
        footer.axis = .horizontal
        footer.alignment = .center
        footer.spacing = 7

        contentView.addSubview(artworkView)
        artworkView.addSubview(liveBadge)
        contentView.addSubview(titleLabel)
        contentView.addSubview(footer)

        NSLayoutConstraint.activate([
            artworkView.topAnchor.constraint(equalTo: contentView.topAnchor),
            artworkView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            artworkView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            artworkView.heightAnchor.constraint(equalTo: artworkView.widthAnchor, multiplier: 9.0 / 16.0),

            liveBadge.leadingAnchor.constraint(equalTo: artworkView.leadingAnchor, constant: 14),
            liveBadge.bottomAnchor.constraint(equalTo: artworkView.bottomAnchor, constant: -12),
            liveBadge.heightAnchor.constraint(equalToConstant: 30),

            titleLabel.topAnchor.constraint(equalTo: artworkView.bottomAnchor, constant: 11),
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            titleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),

            footer.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 9),
            footer.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            footer.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            footer.bottomAnchor.constraint(lessThanOrEqualTo: contentView.bottomAnchor),

            avatarView.widthAnchor.constraint(equalToConstant: 28),
            avatarView.heightAnchor.constraint(equalToConstant: 28),
            viewerIcon.widthAnchor.constraint(equalToConstant: 22),
            viewerIcon.heightAnchor.constraint(equalToConstant: 22)
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
