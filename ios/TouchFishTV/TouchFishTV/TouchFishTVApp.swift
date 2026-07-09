import SwiftUI

@main
struct TouchFishTVApp: App {
    
    init() {
        // 关键修复：tvOS 的系统窗口默认背景是浅色/半透明的，
        // 这就是产生"白雾"的根本原因。必须在 UIKit 层面强制设为黑色。
        UIWindow.appearance().backgroundColor = .black
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(DouyinAPI.shared)
        }
    }
}
