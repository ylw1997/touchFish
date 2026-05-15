import SwiftUI

/// 设置视图 - API 配置与 Cookie 管理
struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var viewModel: AppViewModel
    
    // API 配置
    @AppStorage("api_base_url") private var apiBaseURL = ""
    
    // Cookie 存储
    @AppStorage("nga_cookie") private var ngaCookie = ""
    @AppStorage("linuxdo_cookie") private var linuxdoCookie = ""

    var body: some View {
        NavigationStack {
            Form {
                // API 配置
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Label("服务端地址", systemImage: "server.rack")
                            .font(.headline)
                        Text("默认: http://127.0.0.1:3210")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField("自定义 API 地址...", text: $apiBaseURL)
                            .textFieldStyle(.roundedBorder)
                            .font(.system(.caption, design: .monospaced))
                            .autocapitalization(.none)
                            .keyboardType(.URL)
                    }
                    .padding(.vertical, 4)
                    
                    Button {
                        // 测试 API 连接
                        Task {
                            await testAPIConnection()
                        }
                    } label: {
                        HStack {
                            Label("测试连接", systemImage: "wifi")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(.secondary)
                        }
                    }
                } header: {
                    Text("API 配置")
                } footer: {
                    Text("留空使用默认本地地址，支持自定义服务端地址")
                }

                // 需要认证的平台
                Section {
                    cookieField(
                        platform: .nga,
                        cookie: $ngaCookie,
                        description: "访问 NGA 论坛需要登录凭证"
                    )
                    
                    cookieField(
                        platform: .linuxdo,
                        cookie: $linuxdoCookie,
                        description: "访问 Linux.do 需要登录凭证，需包含 _t 字段"
                    )
                } header: {
                    Text("需要认证的平台")
                }

                // 关于
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
    
    // MARK: - Helper Views
    
    @ViewBuilder
    private func cookieField(platform: Platform, cookie: Binding<String>, description: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Label(platform.displayName, systemImage: platform.icon)
                .font(.headline)
                .foregroundStyle(platform.accentColor)
            Text(description)
                .font(.caption)
                .foregroundStyle(.secondary)
            TextField("请粘贴 Cookie...", text: cookie, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .font(.system(.caption, design: .monospaced))
                .lineLimit(3...6)
                .onChange(of: cookie.wrappedValue) { newValue in
                    // Cookie 变化时同步到服务端
                    Task {
                        await syncCookieToServer(platform: platform, value: newValue)
                    }
                }
        }
        .padding(.vertical, 4)
    }
    
    // MARK: - Actions
    
    /// 同步 Cookie 到服务端
    private func syncCookieToServer(platform: Platform, value: String) async {
        guard !value.isEmpty else { return }
        
        let client = APIClient.shared
        let key = platform.serverCookieKey
        
        do {
            try await client.setServerConfig(key: key, value: value)
            print("[TouchFish] Cookie synced to server for \(platform.displayName)")
        } catch {
            print("[TouchFish] Failed to sync cookie: \(error)")
        }
    }
    
    private func testAPIConnection() async {
        let client = APIClient.shared
        do {
            // 测试 health 端点
            let response: APIResponse<SystemHealthData> = try await client.request(endpoint: "/health")
            if response.ok {
                viewModel.errorMessage = nil
                // 显示成功提示
                await MainActor.run {
                    // 可以用 alert 或其他方式提示
                    print("[TouchFish] API 连接成功")
                }
            }
        } catch {
            viewModel.errorMessage = "API 连接失败: \(error.localizedDescription)"
        }
    }
}

// MARK: - Response Models

struct SystemHealthData: Decodable {
    let status: String?
    let uptime: Double?
}
