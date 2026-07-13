import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            DouyinFeedView(feedType: .recommend)
                .tabItem {
                    Label("推荐", systemImage: "sparkles")
                }
            
            DouyinFeedView(feedType: .following)
                .tabItem {
                    Label("关注", systemImage: "person.2.fill")
                }

            FavoritesLibraryView()
                .tabItem {
                    Label("我的喜欢", systemImage: "heart.fill")
                }
            
            SettingsView()
                .tabItem {
                    Label("设置", systemImage: "gearshape.fill")
                }
        }
        // 对于 tvOS 的 TabView，系统会自动处理其在顶栏的排版和焦点行为
    }
}
