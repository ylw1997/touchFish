import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var api: DouyinAPI
    @State private var inputCookie: String = ""
    @State private var showSaveAlert: Bool = false
    @State private var alertMessage: String = ""
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
                
                TextField("在此粘贴或输入您的 Cookie 字符串", text: $inputCookie)
                    .font(.body)
                    .foregroundColor(.white)
                    .padding(15)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(10)
                    .focused($focusedField, equals: .cookieText)
                
                HStack(spacing: 25) {
                    Button(action: saveCookie) {
                        Label("保存设置", systemImage: "checkmark.circle.fill")
                            .font(.headline)
                            .padding(.horizontal, 10)
                    }
                    .focused($focusedField, equals: .saveBtn)
                    
                    Button(action: clearCookie) {
                        Label("清空 Cookie", systemImage: "trash.fill")
                            .font(.headline)
                            .foregroundColor(.red)
                            .padding(.horizontal, 10)
                    }
                    .focused($focusedField, equals: .clearBtn)
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
        let trimmed = inputCookie.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            alertMessage = "Cookie 不能为空，请粘贴有效的 Cookie 内容"
            showSaveAlert = true
            return
        }
        api.cookie = trimmed
        alertMessage = "Cookie 保存成功，数据已生效！"
        showSaveAlert = true
    }
    
    private func clearCookie() {
        inputCookie = ""
        api.cookie = ""
        alertMessage = "Cookie 已成功清空"
        showSaveAlert = true
    }
}
