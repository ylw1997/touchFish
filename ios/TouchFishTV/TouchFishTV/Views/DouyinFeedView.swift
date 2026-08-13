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
    @State private var selectedAuthor: Author?
    @State private var authorPresented = false
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
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()

                // 同一个 Tab 内上下切换只替换视频源；离开 Tab 后不保留隐藏的
                // AVPlayerViewController，避免多个原生渲染层长期占用解码资源。
                if isActive,
                   let aweme = store.activeItem,
                   let playbackSession = playbackSlot.session {
                    VideoPlayerView(
                        aweme: aweme,
                        cookie: api.cookie,
                        playbackToken: store.playbackToken,
                        coordinator: playbackSession,
                        onPrevious: store.previous,
                        onNext: {
                            Task {
                                await store.next()
                                startPlaybackIfPossible()
                            }
                        },
                        onShowAuthor: showCurrentAuthor
                    )
                    .ignoresSafeArea()
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
            .onAppear { startPlaybackIfPossible() }
            .navigationDestination(isPresented: $authorPresented) {
                if let selectedAuthor {
                    AuthorWorksView(author: selectedAuthor)
                }
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
        .onChange(of: store.items.count) { _, _ in
            prewarmNextIfPossible()
        }
        .onChange(of: authorPresented) { _, presented in
            guard !presented else { return }
            selectedAuthor = nil
            startPlaybackIfPossible()
        }
        .onChange(of: isActive) { _, active in
            // 激活由上面的 task(id:) 统一处理。离开时销毁该 Tab 的播放器和
            // 原生控制器；同一 Tab 内的视频切换仍然复用同一个实例。
            if !active {
                authorPresented = false
                selectedAuthor = nil
                playbackSlot.deactivate()
            }
        }
    }

    private var loadingView: some View {
        VStack(spacing: 22) {
            ProgressView().controlSize(.large).tint(.white)
            Text("正在载入视频")
                .font(.title3.weight(.medium))
                .foregroundStyle(Color.white.opacity(0.7))
        }
    }

    private var emptyView: some View {
        VStack(spacing: 24) {
            Image(systemName: store.errorMessage == nil ? "play.slash.fill" : "exclamationmark.triangle.fill")
                .font(.system(size: 64, weight: .light))
                .foregroundStyle(store.errorMessage == nil ? Color.secondary : Color.orange)
            Text(store.errorMessage ?? "当前没有可播放的视频")
                .font(.title2.weight(.semibold))
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
            Text("检查网络或 Cookie 后重试")
                .font(.body)
                .foregroundStyle(Color.white.opacity(0.68))
            Button("重新加载") { Task { await store.refresh() } }
                .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: 620)
    }

    private func startPlaybackIfPossible() {
        guard isActive else { return }
        guard let aweme = store.activeItem else {
            playbackSlot.deactivate()
            return
        }
        let session = playbackSlot.activate()
        session.play(
            aweme,
            cookie: api.cookie,
            playbackToken: store.playbackToken
        )
        session.prewarm(store.nextItem, cookie: api.cookie)
    }

    private func prewarmNextIfPossible() {
        guard isActive, let session = playbackSlot.session else { return }
        session.prewarm(store.nextItem, cookie: api.cookie)
    }

    private func showCurrentAuthor() {
        guard let author = store.activeItem?.displayAuthor, !author.uid.isEmpty else { return }
        selectedAuthor = author
        playbackSlot.deactivate()
        authorPresented = true
    }
}
