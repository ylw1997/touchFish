import SwiftUI

private enum DouyinTab: Hashable {
    case recommend
    case following
    case live
    case favorites
    case settings
}

struct ContentView: View {
    @State private var selectedTab: DouyinTab = .recommend

    var body: some View {
        TabView(selection: $selectedTab) {
            DouyinFeedView(feedType: .recommend, isActive: selectedTab == .recommend)
                .tabItem {
                    Label("推荐", systemImage: "sparkles")
                }
                .tag(DouyinTab.recommend)
            
            DouyinFeedView(feedType: .following, isActive: selectedTab == .following)
                .tabItem {
                    Label("关注", systemImage: "person.2.fill")
                }
                .tag(DouyinTab.following)

            LiveLibraryView(isActive: selectedTab == .live)
                .tabItem {
                    Label("直播", systemImage: "dot.radiowaves.left.and.right")
                }
                .tag(DouyinTab.live)

            FavoritesLibraryView(isActive: selectedTab == .favorites)
                .tabItem {
                    Label("我的喜欢", systemImage: "heart.fill")
                }
                .tag(DouyinTab.favorites)
            
            SettingsView()
                .tabItem {
                    Label("设置", systemImage: "gearshape.fill")
                }
                .tag(DouyinTab.settings)
        }
        .onAppear {
            PlaybackDiagnostics.shared.event(
                "initial",
                category: "tab",
                fields: ["selected": String(describing: selectedTab)]
            )
        }
        .onChange(of: selectedTab) { previousTab, selectedTab in
            PlaybackDiagnostics.shared.event(
                "changed",
                category: "tab",
                fields: [
                    "from": String(describing: previousTab),
                    "to": String(describing: selectedTab)
                ]
            )
        }
    }
}
