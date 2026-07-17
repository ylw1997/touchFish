import SwiftUI
import UIKit

struct SettingsView: View {
    @EnvironmentObject var api: DouyinAPI
    @State private var inputCookie: String = ""
    @State private var showSaveAlert: Bool = false
    @State private var alertMessage: String = ""
    @State private var isValidating: Bool = false
    @State private var showQRCodeLogin: Bool = false
    @FocusState private var focusedField: Field?
    
    enum Field: Hashable {
        case cookieText
        case saveBtn
        case clearBtn
    }
    
    var body: some View {
        HStack(spacing: 80) {
            // 左边：说明信息
            VStack(alignment: .leading, spacing: 30) {
                Text("系统设置")
                    .font(.system(size: 55, weight: .bold))
                    .foregroundColor(.white)
                
                Text("摸鱼抖音 Apple TV 原生版本")
                    .font(.title3)
                    .foregroundColor(.gray)
                
                VStack(alignment: .leading, spacing: 15) {
                    Text("如何获取 Cookie？")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text("推荐使用抖音 App 扫描电视上的二维码完成登录。手动 Cookie 输入仅保留为开发调试方式。")
                        .font(.body)
                        .foregroundColor(.gray)
                        .lineSpacing(8)
                }
                .padding(25)
                .background(Color.white.opacity(0.04))
                .cornerRadius(15)
                
                Spacer()
            }
            .frame(width: 500)
            
            // 右边：表单输入与按钮
            VStack(alignment: .leading, spacing: 30) {
                Text("设置您的抖音 Cookie")
                    .font(.title2)
                    .foregroundColor(.white)

                Label(
                    api.cookie.isEmpty ? "当前未配置" : "已配置（\(api.cookie.count) 个字符）",
                    systemImage: api.cookie.isEmpty ? "xmark.circle" : "checkmark.circle.fill"
                )
                .font(.headline)
                .foregroundStyle(api.cookie.isEmpty ? Color.orange : Color.green)

                Button {
                    showQRCodeLogin = true
                } label: {
                    Label(
                        api.cookie.isEmpty ? "使用抖音扫码登录" : "重新扫码登录",
                        systemImage: "qrcode.viewfinder"
                    )
                    .font(.headline)
                    .padding(.horizontal, 12)
                }
                .disabled(isValidating)

                Text("开发调试")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                TextField("在此粘贴或输入您的 Cookie 字符串", text: $inputCookie)
                    .font(.body)
                    .foregroundColor(.white)
                    .padding(15)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(10)
                    .focused($focusedField, equals: .cookieText)
                
                HStack(spacing: 25) {
                    Button(action: saveCookie) {
                        if isValidating {
                            ProgressView()
                                .padding(.horizontal, 36)
                        } else {
                            Label("验证并保存", systemImage: "checkmark.circle.fill")
                                .font(.headline)
                                .padding(.horizontal, 10)
                        }
                    }
                    .focused($focusedField, equals: .saveBtn)
                    .disabled(isValidating)
                    
                    Button(action: clearCookie) {
                        Label("清空 Cookie", systemImage: "trash.fill")
                            .font(.headline)
                            .foregroundColor(.red)
                            .padding(.horizontal, 10)
                    }
                    .focused($focusedField, equals: .clearBtn)
                    .disabled(isValidating)
                }
                
                Spacer()
            }
            .frame(maxWidth: .infinity)
        }
        .padding(60)
        .onAppear {
            self.inputCookie = api.cookie
            if self.inputCookie.isEmpty {
                self.focusedField = .cookieText
            } else {
                self.focusedField = .saveBtn
            }
        }
        .alert(isPresented: $showSaveAlert) {
            Alert(title: Text("提示"), message: Text(alertMessage), dismissButton: .default(Text("确定")))
        }
        .sheet(isPresented: $showQRCodeLogin) {
            DouyinQRCodeLoginView()
                .environmentObject(api)
        }
    }
    
    private func saveCookie() {
        guard !isValidating else { return }
        isValidating = true

        Task {
            defer { isValidating = false }
            do {
                let validatedCookie = try await api.validateCookie(inputCookie)
                inputCookie = validatedCookie
                api.cookie = validatedCookie
                alertMessage = "Cookie 验证成功，视频数据正在刷新"
            } catch {
                alertMessage = "Cookie 验证失败：\(error.localizedDescription)"
            }
            showSaveAlert = true
        }
    }
    
    private func clearCookie() {
        inputCookie = ""
        api.cookie = ""
        alertMessage = "Cookie 已成功清空"
        showSaveAlert = true
    }
}

private struct DouyinQRCodeLoginView: View {
    @EnvironmentObject private var api: DouyinAPI
    @Environment(\.dismiss) private var dismiss

    @State private var qrImage: UIImage?
    @State private var sessionID: String?
    @State private var statusText = "正在生成二维码"
    @State private var detailText = "请稍候"
    @State private var isWorking = true
    @State private var loginSucceeded = false

    private let client = DouyinAuthClient()

    var body: some View {
        HStack(spacing: 70) {
            Group {
                if let qrImage {
                    Image(uiImage: qrImage)
                        .interpolation(.none)
                        .resizable()
                        .scaledToFit()
                        .padding(24)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                } else {
                    ZStack {
                        Color.white.opacity(0.08)
                        ProgressView()
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                }
            }
            .frame(width: 390, height: 390)

            VStack(alignment: .leading, spacing: 24) {
                Image(systemName: loginSucceeded ? "checkmark.circle.fill" : "qrcode.viewfinder")
                    .font(.system(size: 64, weight: .semibold))
                    .foregroundColor(loginSucceeded ? .green : .white)

                Text(statusText)
                    .font(.title2.bold())
                    .foregroundColor(.white)

                Text(detailText)
                    .font(.body)
                    .foregroundColor(.gray)
                    .fixedSize(horizontal: false, vertical: true)

                if !isWorking && !loginSucceeded {
                    Button("重新生成二维码") {
                        Task { await startLogin() }
                    }
                }

                Button("取消") {
                    dismiss()
                }
                .opacity(loginSucceeded ? 0 : 1)

                Spacer()
            }
            .frame(maxWidth: 500, maxHeight: 390, alignment: .topLeading)
        }
        .padding(70)
        .background(Color.black)
        .task {
            await startLogin()
        }
        .onDisappear {
            guard let sessionID else { return }
            Task { try? await client.cancel(sessionID: sessionID) }
        }
    }

    @MainActor
    private func startLogin() async {
        if let sessionID {
            try? await client.cancel(sessionID: sessionID)
        }

        self.sessionID = nil
        qrImage = nil
        statusText = "正在生成二维码"
        detailText = "请稍候"
        isWorking = true
        loginSucceeded = false

        do {
            let session = try await client.createSession()
            guard let imageData = Data(base64Encoded: session.qrImageBase64),
                  let image = UIImage(data: imageData) else {
                throw DouyinAuthClient.ClientError.invalidQRCode
            }

            sessionID = session.id
            qrImage = image
            statusText = "使用抖音 App 扫码"
            detailText = "打开抖音 App，点击左上角扫一扫，并在手机上确认登录。"

            try await poll(sessionID: session.id)
        } catch is CancellationError {
            return
        } catch {
            statusText = "二维码登录暂时不可用"
            detailText = error.localizedDescription
            isWorking = false
        }
    }

    @MainActor
    private func poll(sessionID: String) async throws {
        while !Task.isCancelled {
            let status = try await client.status(sessionID: sessionID)
            switch status.state {
            case "pending", "starting":
                statusText = "使用抖音 App 扫码"
                detailText = status.message
            case "scanned":
                statusText = "已扫码"
                detailText = "请在手机上确认登录"
            case "finalizing":
                statusText = "正在完成登录"
                detailText = "正在安全保存登录信息"
            case "confirmed":
                let result = try await client.consume(sessionID: sessionID)
                let validatedCookie = try await api.validateCookie(result.cookie)
                self.sessionID = nil
                api.cookie = validatedCookie
                statusText = "登录成功"
                detailText = "关注和我的喜欢正在刷新"
                isWorking = false
                loginSucceeded = true
                try await Task.sleep(for: .seconds(1))
                dismiss()
                return
            case "expired":
                throw DouyinAuthClient.ClientError.server(status.message)
            case "failed", "cancelled":
                throw DouyinAuthClient.ClientError.server(status.message)
            default:
                break
            }

            try await Task.sleep(for: .seconds(1))
        }
    }
}

private struct DouyinAuthClient {
    enum ClientError: LocalizedError {
        case invalidServiceURL
        case invalidResponse
        case invalidQRCode
        case server(String)

        var errorDescription: String? {
            switch self {
            case .invalidServiceURL:
                return "扫码登录服务地址无效"
            case .invalidResponse:
                return "扫码登录服务响应无效"
            case .invalidQRCode:
                return "二维码图片无效"
            case .server(let message):
                return message
            }
        }
    }

    struct CreatedSession: Decodable {
        let id: String
        let state: String
        let message: String
        let qrImageBase64: String
    }

    struct SessionStatus: Decodable {
        let id: String
        let state: String
        let message: String
    }

    struct ConsumedSession: Decodable {
        let cookie: String
    }

    private struct ServerError: Decodable {
        let error: String
    }

    private var baseURL: URL? {
        let configured = UserDefaults.standard.string(forKey: "douyin_auth_service_url")
        return URL(string: configured ?? "http://127.0.0.1:8787")
    }

    func createSession() async throws -> CreatedSession {
        try await request(path: "/v1/login-sessions", method: "POST")
    }

    func status(sessionID: String) async throws -> SessionStatus {
        try await request(path: "/v1/login-sessions/\(sessionID)", method: "GET")
    }

    func consume(sessionID: String) async throws -> ConsumedSession {
        try await request(path: "/v1/login-sessions/\(sessionID)/consume", method: "POST")
    }

    func cancel(sessionID: String) async throws {
        let _: CancelResponse = try await request(
            path: "/v1/login-sessions/\(sessionID)",
            method: "DELETE"
        )
    }

    private struct CancelResponse: Decodable {
        let ok: Bool
    }

    private func request<T: Decodable>(path: String, method: String) async throws -> T {
        guard let baseURL,
              let url = URL(string: path, relativeTo: baseURL)?.absoluteURL else {
            throw ClientError.invalidServiceURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 45
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ClientError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            if let error = try? JSONDecoder().decode(ServerError.self, from: data) {
                throw ClientError.server(error.error)
            }
            throw ClientError.invalidResponse
        }

        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw ClientError.invalidResponse
        }
    }
}
