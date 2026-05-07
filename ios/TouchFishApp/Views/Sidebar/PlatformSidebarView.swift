import SwiftUI

/// 左栏: 平台选择侧边栏 (类似 Apple Mail 的邮箱文件夹列表)
struct PlatformSidebarView: View {
    @EnvironmentObject var viewModel: AppViewModel

    var body: some View {
        List(selection: Binding(
            get: { viewModel.selectedPlatform },
            set: { platform in
                if let p = platform {
                    viewModel.selectPlatform(p)
                }
            }
        )) {
            Section("资讯") {
                ForEach([Platform.ithome, .chiphell], id: \.self) { platform in
                    platformRow(platform)
                }
            }

            Section("社区") {
                ForEach([Platform.v2ex, .hupu, .nga, .linuxdo], id: \.self) { platform in
                    platformRow(platform)
                }
            }
        }
        .listStyle(.sidebar)
        .navigationTitle("TouchFish")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    viewModel.showSettings = true
                } label: {
                    Image(systemName: "gearshape")
                }
            }
        }
        .sheet(isPresented: $viewModel.showSettings) {
            SettingsView()
        }
    }

    @ViewBuilder
    private func platformRow(_ platform: Platform) -> some View {
        Label {
            Text(platform.displayName)
                .fontWeight(.medium)
        } icon: {
            Image(systemName: platform.icon)
                .foregroundStyle(platform.accentColor)
                .font(.system(size: 16, weight: .semibold))
        }
        .tag(platform)
        .badge(badgeCount(for: platform))
    }

    private func badgeCount(for platform: Platform) -> Int {
        guard let items = viewModel.newsItems[platform] else { return 0 }
        return items.filter { !$0.isRead }.count
    }
}
