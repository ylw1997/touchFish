import SwiftUI

/// 设置视图 - Cookie 管理
struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("nga_cookie") private var ngaCookie = ""
    @AppStorage("linuxdo_cookie") private var linuxdoCookie = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Label("NGA Cookie", systemImage: "key.fill")
                            .font(.headline)
                            .foregroundStyle(Platform.nga.accentColor)
                        Text("访问 NGA 论坛需要登录凭证")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField("请粘贴 NGA Cookie...", text: $ngaCookie, axis: .vertical)
                            .textFieldStyle(.roundedBorder)
                            .font(.system(.caption, design: .monospaced))
                            .lineLimit(3...6)
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("NGA 精英玩家俱乐部")
                }

                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Label("Linux.do Cookie", systemImage: "key.fill")
                            .font(.headline)
                            .foregroundStyle(Platform.linuxdo.accentColor)
                        Text("访问 Linux.do RSS 需要登录凭证，需要包含 _t 字段")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField("请粘贴 Linux.do Cookie...", text: $linuxdoCookie, axis: .vertical)
                            .textFieldStyle(.roundedBorder)
                            .font(.system(.caption, design: .monospaced))
                            .lineLimit(3...6)
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("Linux.do")
                }

                Section {
                    HStack {
                        Label("版本", systemImage: "info.circle")
                        Spacer()
                        Text("1.0.0")
                            .foregroundStyle(.secondary)
                    }
                    Link(destination: URL(string: "https://github.com/ylw1997/touchFish")!) {
                        Label("GitHub 项目", systemImage: "link")
                    }
                } header: {
                    Text("关于")
                }
            }
            .navigationTitle("设置")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("完成") {
                        dismiss()
                    }
                }
            }
        }
    }
}
