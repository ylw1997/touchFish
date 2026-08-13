import SwiftUI
import UIKit

private struct QRLoginSessionResponse: Decodable {
    let id: String
    let state: String
    let message: String
    let claimToken: String
    let qrVersion: Int
}

private struct QRLoginStatusResponse: Decodable {
    let state: String
    let message: String
    let qrVersion: Int
}

private struct QRLoginClaimResponse: Decodable {
    let cookie: String
}

private enum QRLoginError: LocalizedError {
    case invalidResponse
    case server(String)
    case invalidImage
    case emptyCookie

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "扫码服务响应无效"
        case .server(let message):
            return message
        case .invalidImage:
            return "二维码图片读取失败"
        case .emptyCookie:
            return "扫码服务未返回有效 Cookie"
        }
    }
}

@MainActor
private final class DouyinQRLoginController: ObservableObject {
    private static let serviceURL = URL(string: "https://dev.yangliwei.top:18443")!

    @Published private(set) var qrImage: UIImage?
    @Published private(set) var message = "正在连接扫码服务…"
    @Published private(set) var isWorking = false
    @Published private(set) var isLoggedIn = false

    private var sessionID = ""
    private var claimToken = ""
    private var qrVersion = 0
    private var task: Task<Void, Never>?

    func showCurrentLogin() {
        cancel()
        qrImage = nil
        isLoggedIn = true
        message = "当前已登录，如需更换账号请选择重新扫码登录"
    }

    func start(api: DouyinAPI) {
        cancel()
        qrImage = nil
        message = "正在生成抖音登录二维码…"
        isWorking = true
        isLoggedIn = false

        task = Task { [weak self, weak api] in
            guard let self, let api else { return }
            do {
                let session: QRLoginSessionResponse = try await request(
                    path: "/api/sessions",
                    method: "POST"
                )
                try Task.checkCancellation()
                sessionID = session.id
                claimToken = session.claimToken
                qrVersion = session.qrVersion
                message = session.message
                qrImage = try await loadQRCode()

                while !Task.isCancelled {
                    try await Task.sleep(nanoseconds: 1_200_000_000)
                    let status: QRLoginStatusResponse = try await request(
                        path: "/api/sessions/\(sessionID)"
                    )
                    try Task.checkCancellation()
                    message = status.message

                    if status.qrVersion != qrVersion {
                        qrVersion = status.qrVersion
                        qrImage = try await loadQRCode()
                    }

                    if status.state == "verified" {
                        message = "登录已确认，正在领取 Cookie…"
                        let claim: QRLoginClaimResponse = try await request(
                            path: "/api/sessions/\(sessionID)/claim",
                            method: "POST"
                        )
                        let cookie = DouyinAPI.compactLoginCookie(from: claim.cookie)
                        guard !cookie.isEmpty else { throw QRLoginError.emptyCookie }
                        api.cookie = cookie
                        isLoggedIn = true
                        isWorking = false
                        qrImage = nil
                        message = "扫码登录成功，视频数据正在刷新"
                        return
                    }

                    if status.state == "failed" || status.state == "expired" {
                        throw QRLoginError.server(status.message)
                    }
                }
            } catch is CancellationError {
                return
            } catch {
                isWorking = false
                message = "扫码登录失败：\(error.localizedDescription)"
            }
        }
    }

    func cancel() {
        task?.cancel()
        task = nil
        isWorking = false
    }

    private func loadQRCode() async throws -> UIImage {
        let data = try await requestData(path: "/api/sessions/\(sessionID)/qr")
        guard let image = UIImage(data: data) else { throw QRLoginError.invalidImage }
        return image
    }

    private func request<T: Decodable>(
        path: String,
        method: String = "GET"
    ) async throws -> T {
        let data = try await requestData(path: path, method: method)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func requestData(path: String, method: String = "GET") async throws -> Data {
        guard let url = URL(string: path, relativeTo: Self.serviceURL) else {
            throw QRLoginError.invalidResponse
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 75
        request.cachePolicy = .reloadIgnoringLocalCacheData
        if !claimToken.isEmpty {
            request.setValue(claimToken, forHTTPHeaderField: "X-Claim-Token")
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw QRLoginError.invalidResponse
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            let message = payload?["error"] as? String
            throw QRLoginError.server(message ?? "扫码服务请求失败（HTTP \(httpResponse.statusCode)）")
        }
        return data
    }
}

private struct LongCookieEditor: UIViewRepresentable {
    @Binding var text: String

    func makeCoordinator() -> Coordinator {
        Coordinator(text: $text)
    }

    func makeUIView(context: Context) -> UITextField {
        let textField = UITextField()
        textField.delegate = context.coordinator
        textField.backgroundColor = .clear
        textField.textColor = .white
        textField.tintColor = .white
        textField.font = .preferredFont(forTextStyle: .body)
        textField.autocapitalizationType = .none
        textField.autocorrectionType = .no
        textField.spellCheckingType = .no
        textField.keyboardType = .asciiCapable
        textField.clearButtonMode = .whileEditing
        textField.placeholder = "在 iPhone 上粘贴完整 Cookie"
        textField.text = text
        textField.addTarget(
            context.coordinator,
            action: #selector(Coordinator.textDidChange(_:)),
            for: .editingChanged
        )
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            textField.becomeFirstResponder()
        }
        return textField
    }

    func updateUIView(_ textField: UITextField, context: Context) {
        // 长 Cookie 只保存在 SwiftUI 状态中。tvOS 的单行系统输入框可能只保留
        // 一段展示文本，因此不要再用其内部值反向覆盖完整 Cookie。
        let displayText = context.coordinator.displayText(for: text)
        guard textField.text != displayText else { return }
        textField.text = displayText
    }

    final class Coordinator: NSObject, UITextFieldDelegate {
        private var text: Binding<String>

        init(text: Binding<String>) {
            self.text = text
        }

        func displayText(for value: String) -> String {
            value.count > 256 ? "已接收完整 Cookie（\(value.count) 个字符）" : value
        }

        @objc func textDidChange(_ textField: UITextField) {
            let value = textField.text ?? ""
            guard !value.hasPrefix("已接收完整 Cookie（") else { return }
            text.wrappedValue = value
        }

        func textField(
            _ textField: UITextField,
            shouldChangeCharactersIn range: NSRange,
            replacementString string: String
        ) -> Bool {
            let current = textField.text ?? ""
            // iPhone 接力键盘会把一次粘贴作为完整 replacementString 送入。
            // 在 delegate 中直接保存，避免 UITextField 随后只保留约 455 字符，
            // editingChanged 再把完整 SwiftUI 状态覆盖掉。
                if string.count > 256 {
                let compact = DouyinAPI.compactLoginCookie(from: string)
                text.wrappedValue = compact
                textField.text = displayText(for: compact)
#if DEBUG
                print(
                    "[Settings] cookieInput capturedBulkPaste length=\(string.count) "
                    + "compactLength=\(compact.count)"
                )
#endif
                return false
            }

            let effectiveCurrent = current.hasPrefix("已接收完整 Cookie（") ? "" : current
            guard let effectiveRange = Range(range, in: effectiveCurrent) else {
                text.wrappedValue = string
                return false
            }
            let updated = effectiveCurrent.replacingCharacters(in: effectiveRange, with: string)
            text.wrappedValue = updated
#if DEBUG
            print(
                "[Settings] cookieInput replacementLength=\(string.count) "
                + "resultLength=\(updated.count)"
            )
#endif
            return true
        }
    }
}

private struct CookieEditorSheet: View {
    @Binding var text: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 28) {
            Text("粘贴抖音 Cookie")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)

            Text("请使用 iPhone 接力键盘粘贴完整 Cookie。粘贴后按遥控器返回键收起键盘，再选择“完成输入”。")
                .font(.title3)
                .foregroundStyle(Color.white.opacity(0.7))

            LongCookieEditor(text: $text)
                .background(Color.white.opacity(0.08))
                .overlay {
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.white.opacity(0.3), lineWidth: 2)
                }
                .cornerRadius(14)
                .frame(height: 110)

            HStack {
                let normalized = DouyinAPI.normalizedCookie(from: text)
                Text("已接收 \(normalized.count) 个字符、\(normalized.split(separator: ";").count) 个字段")
                    .font(.headline)
                    .foregroundStyle(Color.white.opacity(0.7))

                Spacer()

                if !normalized.isEmpty {
                    Button("完成输入") {
                        dismiss()
                    }
                    .font(.headline)
                }
            }
        }
        .padding(70)
        .background(Color.black.ignoresSafeArea())
    }
}

struct SettingsView: View {
    @EnvironmentObject var api: DouyinAPI
    @StateObject private var qrLogin = DouyinQRLoginController()
    @State private var inputCookie = ""
    @State private var showSaveAlert = false
    @State private var alertMessage = ""
    @State private var isValidating = false
    @State private var showCookieEditor = false
    @State private var showEmergencyCookie = false
    @FocusState private var focusedField: Field?

    enum Field: Hashable {
        case qrRefresh
        case emergencyToggle
        case editCookie
        case saveBtn
        case clearBtn
    }

    var body: some View {
        HStack(spacing: 60) {
            VStack(alignment: .leading, spacing: 30) {
                Text("系统设置")
                    .font(.system(size: 55, weight: .bold))
                    .foregroundStyle(.primary)

                Text("摸鱼抖音 Apple TV 原生版本")
                    .font(.title3)
                    .foregroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 15) {
                    Text("扫码登录")
                        .font(.headline)
                        .foregroundStyle(.primary)

                    Text("1. 使用抖音 App 扫描右侧二维码\n2. 在手机上确认登录\n3. 如出现身份验证，请扫描自动更新的二维码并完成刷脸\n4. 验证成功后 Apple TV 会自动保存登录信息")
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .lineSpacing(8)
                }
                .padding(25)
                .background(Color.white.opacity(0.04))
                .cornerRadius(15)

                Spacer()
            }
            .frame(width: 470)

            VStack(alignment: .leading, spacing: 22) {
                Text("使用抖音扫码登录")
                    .font(.title2)
                    .foregroundStyle(.primary)

                Label(
                    api.cookie.isEmpty ? "当前未登录" : "已登录（Cookie 已安全保存）",
                    systemImage: api.cookie.isEmpty ? "xmark.circle" : "checkmark.circle.fill"
                )
                .font(.headline)
                .foregroundStyle(api.cookie.isEmpty ? Color.orange : Color.green)

                HStack(spacing: 30) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 20)
                            .fill(Color.white)

                        if let image = qrLogin.qrImage {
                            Image(uiImage: image)
                                .resizable()
                                .interpolation(.none)
                                .scaledToFit()
                                .padding(18)
                        } else if qrLogin.isWorking {
                            ProgressView()
                                .tint(.black)
                                .scaleEffect(1.5)
                        } else {
                            Image(systemName: qrLogin.isLoggedIn ? "checkmark.circle.fill" : "qrcode")
                                .font(.system(size: 90))
                                .foregroundStyle(qrLogin.isLoggedIn ? Color.green : Color.gray)
                        }
                    }
                    .frame(width: 300, height: 300)

                    VStack(alignment: .leading, spacing: 22) {
                        Text(qrLogin.message)
                            .font(.headline)
                            .foregroundStyle(qrLogin.isLoggedIn ? Color.green : Color.secondary)
                            .lineLimit(4)
                            .frame(maxWidth: 430, alignment: .leading)

                        Button {
                            qrLogin.start(api: api)
                        } label: {
                            Label(
                                qrLogin.qrImage == nil ? "生成二维码" : "重新生成二维码",
                                systemImage: "arrow.clockwise"
                            )
                            .font(.headline)
                        }
                        .buttonStyle(.borderedProminent)
                        .focused($focusedField, equals: .qrRefresh)

                        Button {
                            showEmergencyCookie.toggle()
                        } label: {
                            Label(
                                showEmergencyCookie ? "收起 Cookie 紧急登录" : "Cookie 紧急登录",
                                systemImage: "cross.case.fill"
                            )
                            .font(.callout)
                        }
                        .focused($focusedField, equals: .emergencyToggle)
                    }
                }

                if showEmergencyCookie {
                    emergencyCookiePanel
                }

                Spacer()
            }
            .frame(maxWidth: .infinity)
        }
        .padding(50)
        .onAppear {
            inputCookie = api.cookie
            if api.cookie.isEmpty {
                qrLogin.start(api: api)
            } else {
                qrLogin.showCurrentLogin()
            }
            focusedField = .qrRefresh
        }
        .onDisappear {
            qrLogin.cancel()
        }
        .sheet(isPresented: $showCookieEditor) {
            CookieEditorSheet(text: $inputCookie)
        }
        .alert(isPresented: $showSaveAlert) {
            Alert(title: Text("提示"), message: Text(alertMessage), dismissButton: .default(Text("确定")))
        }
    }

    private var emergencyCookiePanel: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("紧急方式：手动输入 Cookie")
                .font(.headline)
                .foregroundStyle(.orange)

            Button {
                showCookieEditor = true
            } label: {
                Label(
                    inputCookie.isEmpty ? "粘贴 Cookie" : "重新粘贴或编辑 Cookie",
                    systemImage: "doc.on.clipboard.fill"
                )
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .focused($focusedField, equals: .editCookie)

            let normalized = DouyinAPI.normalizedCookie(from: inputCookie)
            let fieldCount = normalized.split(separator: ";").count
            let hasSession = normalized
                .split(separator: ";")
                .map { $0.trimmingCharacters(in: .whitespaces).lowercased() }
                .contains { $0.hasPrefix("sessionid=") || $0.hasPrefix("sessionid_ss=") }
            Label(
                "已接收 \(normalized.count) 个字符、\(fieldCount) 个字段"
                    + (hasSession ? "，包含登录字段" : "，缺少 sessionid"),
                systemImage: hasSession ? "checkmark.shield.fill" : "exclamationmark.triangle.fill"
            )
            .font(.callout)
            .foregroundStyle(hasSession ? Color.green : Color.orange)

            HStack(spacing: 25) {
                Button(action: saveCookie) {
                    if isValidating {
                        ProgressView()
                            .padding(.horizontal, 36)
                    } else {
                        Label("验证并保存", systemImage: "checkmark.circle.fill")
                            .font(.headline)
                    }
                }
                .focused($focusedField, equals: .saveBtn)
                .disabled(isValidating)

                Button(action: clearCookie) {
                    Label("清空 Cookie", systemImage: "trash.fill")
                        .font(.headline)
                        .foregroundColor(.red)
                }
                .focused($focusedField, equals: .clearBtn)
                .disabled(isValidating)
            }
        }
        .padding(20)
        .background(Color.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 16))
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
                qrLogin.showCurrentLogin()
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
        qrLogin.start(api: api)
    }
}
