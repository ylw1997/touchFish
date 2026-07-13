import SwiftUI

enum FeedType {
    case recommend
    case following
}

@MainActor
struct DouyinFeedView: View {
    @EnvironmentObject private var api: DouyinAPI
    @StateObject private var store: DouyinFeedStore
    private let isActive: Bool
    private let playbackSource: PlaybackOwner.Source

    init(feedType: FeedType, isActive: Bool) {
        self.isActive = isActive
        switch feedType {
        case .recommend: playbackSource = .recommend
        case .following: playbackSource = .following
        }
        _store = StateObject(wrappedValue: DouyinFeedStore(feedType: feedType))
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if isActive, let aweme = store.activeItem {
                VideoPlayerView(
                    aweme: aweme,
                    cookie: api.cookie,
                    playbackToken: store.playbackToken,
                    source: playbackSource,
                    onPrevious: store.previous,
                    onNext: { Task { await store.next() } }
                )
                .ignoresSafeArea()
            } else if store.isLoading {
                loadingView
            } else if store.activeItem == nil {
                emptyView
            }
        }
        .task { if store.items.isEmpty { await store.refresh() } }
        .onChange(of: api.cookieRevision) { _, _ in
            Task { await store.refresh() }
        }
    }

    private var loadingView: some View {
        VStack(spacing: 22) {
            ProgressView().controlSize(.large).tint(.white)
            Text("正在载入视频")
                .font(.title3.weight(.medium))
                .foregroundStyle(.secondary)
        }
    }

    private var emptyView: some View {
        VStack(spacing: 24) {
            Image(systemName: store.errorMessage == nil ? "play.slash.fill" : "exclamationmark.triangle.fill")
                .font(.system(size: 64, weight: .light))
                .foregroundStyle(store.errorMessage == nil ? Color.secondary : Color.orange)
            Text(store.errorMessage ?? "当前没有可播放的视频")
                .font(.title2.weight(.semibold))
                .multilineTextAlignment(.center)
            Text("检查网络或 Cookie 后重试")
                .font(.body)
                .foregroundStyle(.secondary)
            Button("重新加载") { Task { await store.refresh() } }
                .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: 620)
    }
}
