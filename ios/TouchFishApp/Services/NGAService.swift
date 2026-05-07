import Foundation

/// NGA 精英玩家俱乐部抓取服务
/// 数据源: https://bbs.nga.cn/thread.php?fid={tab}
/// 注意: 需要 Cookie, 页面编码为 GBK
struct NGAService: PlatformServiceProtocol {

    private var cookie: String {
        UserDefaults.standard.string(forKey: "nga_cookie") ?? ""
    }

    func fetchNewsList(tab: String?) async throws -> [NewsItem] {
        guard !cookie.isEmpty else {
            return [NewsItem(
                id: "nga:configure",
                title: "⚙️ NGA Cookie 未配置 (请在设置中配置)",
                url: "configure_nga_cookie",
                source: .nga
            )]
        }

        let tabParam = tab ?? "-7"
        let url = URL(string: "https://bbs.nga.cn/thread.php?fid=\(tabParam)")!
        let headers = [
            "Cookie": cookie,
        ]

        let data = try await NetworkService.shared.fetchData(from: url, headers: headers)

        // NGA 使用 GBK 编码
        let cfEncoding = CFStringConvertEncodingToNSStringEncoding(
            CFStringEncoding(CFStringEncodings.GB_18030_2000.rawValue)
        )
        let gbkEncoding = String.Encoding(rawValue: cfEncoding)
        guard let html = String(data: data, encoding: gbkEncoding)
                ?? String(data: data, encoding: .utf8) else {
            throw NetworkError.decodingFailed
        }

        let doc = HTMLParser(html)
        var items: [NewsItem] = []

        let topics = doc.select("#topicrows .topic")
        for element in topics {
            let title = element.text().trimmingCharacters(in: .whitespacesAndNewlines)
            let href = (element.attr("href") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            guard !title.isEmpty, !href.isEmpty else { continue }

            items.append(NewsItem(
                id: "nga:\(href)",
                title: title,
                url: href,
                source: .nga
            ))
        }

        return items
    }

    func fetchDetail(url: String) async throws -> String {
        guard !cookie.isEmpty else {
            return "<p>请先在设置中配置 NGA Cookie</p>"
        }

        let fullUrl = "https://bbs.nga.cn\(url)"
        guard let detailURL = URL(string: fullUrl) else {
            return "<p>无效的 URL</p>"
        }

        let headers = [
            "Cookie": cookie,
        ]

        let data = try await NetworkService.shared.fetchData(from: detailURL, headers: headers)

        let cfEncoding = CFStringConvertEncodingToNSStringEncoding(
            CFStringEncoding(CFStringEncodings.GB_18030_2000.rawValue)
        )
        let gbkEncoding = String.Encoding(rawValue: cfEncoding)
        guard var html = String(data: data, encoding: gbkEncoding)
                ?? String(data: data, encoding: .utf8) else {
            throw NetworkError.decodingFailed
        }

        // NGA BBCode → HTML 转换 (与 TypeScript 版逻辑一致)
        html = html.replacingOccurrences(of: "[img]./", with: "[img]")
        html = html.replacingOccurrences(
            of: #"\[img\](.*?)\[/img\]"#,
            with: "<img src=\"https://img.nga.178.com/attachments/$1\" />",
            options: .regularExpression
        )
        html = html.replacingOccurrences(
            of: #"\[pid=.*?\].*?\[/b\]"#,
            with: "",
            options: .regularExpression
        )
        html = html.replacingOccurrences(
            of: #"\[s:.*?\]"#,
            with: "",
            options: .regularExpression
        )
        html = html.replacingOccurrences(of: "[quote]", with: "<div class=\"comment_c\">")
        html = html.replacingOccurrences(of: "[/quote]", with: "</div>")
        html = html.replacingOccurrences(
            of: #"\[tid.*?\].*?\[/tid\]"#,
            with: "",
            options: .regularExpression
        )
        html = html.replacingOccurrences(
            of: #"\[b\].*?\[/b\]"#,
            with: "",
            options: .regularExpression
        )

        let doc = HTMLParser(html)
        guard let content = doc.selectFirst("#m_posts")?.html() else {
            return "<p>获取 NGA 内容失败</p>"
        }

        return content
    }
}
