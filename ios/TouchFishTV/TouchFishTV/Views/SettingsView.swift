import SwiftUI
import UIKit

private struct LongCookieEditor: UIViewRepresentable {
    @Binding var text: String

    func makeCoordinator() -> Coordinator {
        Coordinator(text: $text)
    }

    func makeUIView(context: Context) -> UITextView {
        let textView = UITextView()
        textView.delegate = context.coordinator
        textView.backgroundColor = .clear
        textView.textColor = .white
        textView.font = .preferredFont(forTextStyle: .body)
        textView.autocapitalizationType = .none
        textView.autocorrectionType = .no
        textView.spellCheckingType = .no
        textView.keyboardType = .asciiCapable
        textView.textContainerInset = UIEdgeInsets(top: 14, left: 14, bottom: 14, right: 14)
        textView.text = text
        return textView
    }

    func updateUIView(_ textView: UITextView, context: Context) {
        guard textView.text != text else { return }
        textView.text = text
    }

    final class Coordinator: NSObject, UITextViewDelegate {
        private var text: Binding<String>

        init(text: Binding<String>) {
            self.text = text
        }

        func textViewDidChange(_ textView: UITextView) {
            text.wrappedValue = textView.text
        }
    }
}

struct SettingsView: View {
    @EnvironmentObject var api: DouyinAPI
    @State private var inputCookie: String = ""
    @State private var showSaveAlert: Bool = false
    @State private var alertMessage: String = ""
    @State private var isValidating: Bool = false
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
                    
                    Text("1. 在电脑浏览器登录 douyin.com\n2. 按 F12 打开开发者工具控制台或网络面板\n3. 找到任意一个请求，复制请求头（Headers）中的 Cookie 字符串\n4. 在此处使用遥控器键盘或者 iPhone「接力键盘」进行粘贴。")
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

                LongCookieEditor(text: $inputCookie)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(10)
                    .frame(height: 180)
                    .focused($focusedField, equals: .cookieText)

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
