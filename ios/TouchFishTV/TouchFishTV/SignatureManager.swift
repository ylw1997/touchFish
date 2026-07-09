import Foundation
import JavaScriptCore

class SignatureManager {
    static let shared = SignatureManager()
    private var context: JSContext?

    private init() {
        setupJSContext()
    }

    private func setupJSContext() {
        guard let context = JSContext() else {
            print("[SignatureManager] Failed to create JSContext")
            return
        }
        // 设置虚假的 module 和 window，以兼容 CommonJS 打包格式
        context.evaluateScript("var module = { exports: {} }; var window = null;")
        
        // 加载 xbogus.js
        guard let path = Bundle.main.path(forResource: "xbogus", ofType: "js") else {
            print("[SignatureManager] Failed to find xbogus.js in Bundle")
            return
        }
        
        do {
            let jsContent = try String(contentsOfFile: path, encoding: .utf8)
            context.evaluateScript(jsContent)
            self.context = context
            print("[SignatureManager] JSContext loaded successfully with xbogus.js")
        } catch {
            print("[SignatureManager] Failed to load xbogus.js contents: \(error)")
        }
    }

    func sign(url: String, userAgent: String) -> String {
        guard let context = context else {
            print("[SignatureManager] JSContext is nil, returning unsigned URL")
            return url
        }
        
        let module = context.objectForKeyedSubscript("module")
        let exports = module?.objectForKeyedSubscript("exports")
        
        guard let signFunction = exports, !signFunction.isUndefined else {
            print("[SignatureManager] xbogus sign function is undefined")
            return url
        }
        
        // xbogus 的核心方法接受的是 URL 的 query 参数串而非完整 URL
        // 比如: device_platform=webapp&aid=6383...
        let queryString: String
        if let queryRange = url.range(of: "?") {
            queryString = String(url[queryRange.upperBound...])
        } else {
            queryString = ""
        }
        
        guard let signedValVal = signFunction.call(withArguments: [queryString, userAgent]) else {
            print("[SignatureManager] Calling sign function failed")
            return url
        }
        
        let signedValue = signedValVal.toString() ?? ""
        if signedValue.isEmpty {
            return url
        }
        
        let separator = url.contains("?") ? "&" : "?"
        return "\(url)\(separator)X-Bogus=\(signedValue)"
    }
}
