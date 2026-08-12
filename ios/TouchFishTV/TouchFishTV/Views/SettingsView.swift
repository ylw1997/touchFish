import SwiftUI
import UIKit

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
        guard textField.text != text else { return }
        textField.text = text
    }

    final class Coordinator: NSObject, UITextFieldDelegate {
        private var text: Binding<String>

        init(text: Binding<String>) {
            self.text = text
        }

        @objc func textDidChange(_ textField: UITextField) {
            text.wrappedValue = textField.text ?? ""
        }

        func textField(
            _ textField: UITextField,
            shouldChangeCharactersIn range: NSRange,
            replacementString string: String
        ) -> Bool {
            let current = textField.text ?? ""
            guard let swiftRange = Range(range, in: current) else { return true }
            let updated = current.replacingCharacters(in: swiftRange, with: string)
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

            Text("请使用 iPhone 接力键盘粘贴完整 Cookie。粘贴后按遥控器返回键收起键盘，再选择“完成输入”。")
                .font(.title3)
                .foregroundStyle(.secondary)

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
                    .foregroundStyle(.secondary)

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
    @State private var inputCookie: String = ""
    @State private var showSaveAlert: Bool = false
    @State private var alertMessage: String = ""
    @State private var isValidating: Bool = false
    @State private var showCookieEditor: Bool = false
    @FocusState private var focusedField: Field?
    
    enum Field: Hashable {
        case editCookie
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

                Button {
                    showCookieEditor = true
                } label: {
                    Label(
                        inputCookie.isEmpty ? "粘贴 Cookie" : "重新粘贴或编辑 Cookie",
                        systemImage: "doc.on.clipboard.fill"
                    )
                    .font(.headline)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 16)
                }
                .buttonStyle(.borderedProminent)
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
                self.focusedField = .editCookie
            } else {
                self.focusedField = .saveBtn
            }
        }
        .sheet(isPresented: $showCookieEditor) {
            CookieEditorSheet(text: $inputCookie)
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
