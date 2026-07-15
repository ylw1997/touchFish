import SwiftUI

enum FeedType {
    case recommend
    case following
}

@MainActor
struct DouyinFeedView: View {
    @EnvironmentObject private var api: DouyinAPI
    @StateObject private var store: DouyinFeedStore
    @StateObject private var playbackSlot: PlaybackSessionSlot
    private let isActive: Bool

    init(feedType: FeedType, isActive: Bool) {
        self.isActive = isActive
        let source: PlaybackSource
        switch feedType {
        case .recommend: source = .recommend
        case .following: source = .following
        }
        _store = StateObject(wrappedValue: DouyinFeedStore(feedType: feedType))
        _playbackSlot = StateObject(wrappedValue: PlaybackSessionSlot(source: source))
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            // 首次激活后让原生播放器控制器一直留在视图层级中。切换 Tab 时
            // 仅隐藏并禁用交互，避免 UIViewControllerRepresentable 被 dismantle。
            if let aweme = store.activeItem,
               let playbackSession = playbackSlot.session {
                VideoPlayerView(
                    aweme: aweme,
                    cookie: api.cookie,
                    playbackToken: store.playbackToken,
                    coordinator: playbackSession,
                    onPrevious: store.previous,
                    onNext: { Task { await store.next() } }
                )
                .ignoresSafeArea()
                .opacity(isActive ? 1 : 0)
                .allowsHitTesting(isActive)
            }

            if !isActive {
                Color.black.ignoresSafeArea()
            } else if store.activeItem != nil, playbackSlot.session == nil {
                loadingView
            } else if store.isLoading, store.activeItem == nil {
                loadingView
            } else if store.activeItem == nil {
                emptyView
            }
        }
        .task(id: isActive) {
            guard isActive else { return }
            if store.items.isEmpty {
                await store.refresh()
                return
            }
            startPlaybackIfPossible()
        }
        .onChange(of: api.cookieRevision) { _, _ in
            Task { await store.refresh() }
        }
        .onChange(of: store.playbackToken) { _, _ in
            startPlaybackIfPossible()
        }
        .onChange(of: isActive) { _, active in
            // 激活由上面的 task(id:) 统一处理，避免 Tab 切换时 task 与
            // onChange 同时发起两次 play。这里只负责同步停止离开的 Tab。
            if !active {
                playbackSlot.suspend()
            }
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

    private func startPlaybackIfPossible() {
        guard isActive else { return }
        guard let aweme = store.activeItem else {
            playbackSlot.suspend()
            return
        }
        playbackSlot.activate().play(
            aweme,
            cookie: api.cookie,
            playbackToken: store.playbackToken
        )
    }
}
