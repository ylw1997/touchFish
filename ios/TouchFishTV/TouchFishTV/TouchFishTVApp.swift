import SwiftUI

@main
struct TouchFishTVApp: App {
    
    init() {
        // 避免系统窗口的半透明背景透出浅色。
        UIWindow.appearance().backgroundColor = .black
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(DouyinAPI.shared)
        }
    }
}
