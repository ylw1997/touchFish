import SwiftUI
import WebKit

/// WKWebView 包装器, 用于渲染 HTML 详情内容
struct HTMLContentView: UIViewRepresentable {
    let htmlContent: String
    let baseURL: String

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.showsHorizontalScrollIndicator = false
        webView.navigationDelegate = context.coordinator
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        let styledHTML = wrapWithCSS(htmlContent)
        webView.loadHTMLString(styledHTML, baseURL: URL(string: baseURL))
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        func webView(_ webView: WKWebView,
                     decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            // 拦截链接点击，在外部浏览器打开
            if navigationAction.navigationType == .linkActivated,
               let url = navigationAction.request.url {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }
    }

    // MARK: - CSS 样式注入

    private func wrapWithCSS(_ html: String) -> String {
        """
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0">
        <style>
        :root {
            --bg: #ffffff;
            --text: #1d1d1f;
            --secondary: #86868b;
            --border: #e5e5ea;
            --link: #007aff;
            --code-bg: #f5f5f7;
            --card-bg: #f9f9fb;
            --quote-bg: #f0f0f5;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #1c1c1e;
                --text: #f5f5f7;
                --secondary: #98989d;
                --border: #38383a;
                --link: #0a84ff;
                --code-bg: #2c2c2e;
                --card-bg: #2c2c2e;
                --quote-bg: #2c2c2e;
            }
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
            font-size: 17px;
            line-height: 1.65;
            color: var(--text);
            background-color: var(--bg);
            padding: 16px;
            margin: 0;
            -webkit-text-size-adjust: 100%;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        h1, h2, h3, h4, h5, h6 {
            font-weight: 700;
            line-height: 1.3;
            margin-top: 1.2em;
            margin-bottom: 0.6em;
        }
        h1 { font-size: 24px; }
        h2 { font-size: 20px; }
        h3 { font-size: 18px; }
        p {
            margin: 0.8em 0;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            margin: 8px 0;
        }
        a {
            color: var(--link);
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        pre, code {
            font-family: "SF Mono", Menlo, monospace;
            font-size: 14px;
            background: var(--code-bg);
            border-radius: 6px;
        }
        code {
            padding: 2px 6px;
        }
        pre {
            padding: 14px;
            overflow-x: auto;
            border: 1px solid var(--border);
        }
        pre code {
            padding: 0;
            background: none;
        }
        blockquote {
            border-left: 4px solid var(--link);
            margin: 12px 0;
            padding: 10px 16px;
            background: var(--quote-bg);
            border-radius: 0 8px 8px 0;
            color: var(--secondary);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
        }
        th, td {
            border: 1px solid var(--border);
            padding: 8px 12px;
            text-align: left;
        }
        th {
            background: var(--card-bg);
            font-weight: 600;
        }
        hr {
            border: none;
            border-top: 1px solid var(--border);
            margin: 20px 0;
        }
        video {
            max-width: 100%;
            border-radius: 10px;
        }
        /* 帖子相关样式 */
        .topic-header h1 {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .topic-meta {
            display: flex;
            gap: 12px;
            color: var(--secondary);
            font-size: 14px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .category {
            background: var(--link);
            color: white;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .reply-item, .main-post {
            border-bottom: 1px solid var(--border);
            padding: 16px 0;
        }
        .main-post {
            border-bottom: 2px solid var(--border);
        }
        .reply-header, .main-post-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            flex-wrap: wrap;
        }
        .post-author {
            font-weight: 600;
            color: var(--link);
            font-size: 15px;
        }
        .post-time {
            color: var(--secondary);
            font-size: 13px;
        }
        .post-floor {
            color: var(--secondary);
            font-size: 12px;
            background: var(--card-bg);
            padding: 2px 8px;
            border-radius: 10px;
        }
        .replies-header {
            font-weight: 600;
            font-size: 16px;
            padding: 12px 0;
            color: var(--secondary);
        }
        .no-replies {
            text-align: center;
            color: var(--secondary);
            padding: 30px;
        }
        /* NGA 特定样式 */
        .comment_c {
            background: var(--quote-bg);
            padding: 10px 14px;
            border-radius: 8px;
            margin: 8px 0;
            border-left: 3px solid var(--secondary);
        }
        </style>
        </head>
        <body>
        \(html)
        </body>
        </html>
        """
    }
}
