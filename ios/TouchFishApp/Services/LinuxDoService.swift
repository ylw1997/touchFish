import Foundation

/// Linux.do RSS 服务
/// 数据源: https://linux.do/latest.rss (需要 Cookie)
struct LinuxDoService: PlatformServiceProtocol {

    private var cookie: String {
        UserDefaults.standard.string(forKey: "linuxdo_cookie") ?? ""
    }

    func fetchNewsList(tab: String?) async throws -> [NewsItem] {
        guard !cookie.isEmpty else {
            return [NewsItem(
                id: "linuxdo:configure",
                title: "⚙️ Linux.do Cookie 未配置 (请在设置中配置)",
                url: "configure_linuxdo_cookie",
                source: .linuxdo
            )]
        }

        let tabParam = tab ?? "latest"
        let urlMap = [
            "latest": "https://linux.do/latest.rss",
            "hot": "https://linux.do/hot.rss",
            "top": "https://linux.do/top.rss",
        ]
        let urlString = urlMap[tabParam] ?? urlMap["latest"]!
        let url = URL(string: urlString)!

        let headers = [
            "Cookie": cookie,
            "Referer": urlString.replacingOccurrences(of: ".rss", with: ""),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ]

        let xmlString = try await NetworkService.shared.fetchString(from: url, headers: headers)

        guard xmlString.contains("<?xml") || xmlString.contains("<rss") else {
            throw NetworkError.unauthorized
        }

        // 简单 RSS XML 解析
        let items = parseRSSItems(xmlString)

        return items.map { rssItem in
            NewsItem(
                id: "linuxdo:\(rssItem.guid)",
                title: rssItem.title,
                url: rssItem.link,
                source: .linuxdo,
                time: formatTime(rssItem.pubDate),
                author: rssItem.author,
                category: rssItem.category
            )
        }
    }

    func fetchDetail(url: String) async throws -> String {
        guard !cookie.isEmpty else {
            return "<p>请先在设置中配置 Linux.do Cookie</p>"
        }

        let rssUrl = url.hasSuffix(".rss") ? url : "\(url).rss"
        guard let detailURL = URL(string: rssUrl) else {
            return "<p>无效的 URL</p>"
        }

        let headers = [
            "Cookie": cookie,
            "Referer": "https://linux.do/latest",
        ]

        let xmlString = try await NetworkService.shared.fetchString(from: detailURL, headers: headers)

        // 解析标题
        let titleMatch = xmlString.range(of: #"<title>([^<]+)</title>"#, options: .regularExpression)
        let title = titleMatch.flatMap {
            String(xmlString[$0]).replacingOccurrences(of: "<title>", with: "")
                .replacingOccurrences(of: "</title>", with: "")
        } ?? ""

        let categoryMatch = xmlString.range(of: #"<category>([^<]+)</category>"#, options: .regularExpression)
        let category = categoryMatch.flatMap {
            String(xmlString[$0]).replacingOccurrences(of: "<category>", with: "")
                .replacingOccurrences(of: "</category>", with: "")
        } ?? ""

        let items = parseRSSItems(xmlString)

        // 构建 HTML
        var html = """
        <div class="topic-header">
            <h1>\(title)</h1>
            <div class="topic-meta">
                <span class="category">\(category)</span>
                <span class="reply-count">\(items.count) 条回复</span>
            </div>
        </div>
        """

        // 主楼 (RSS 是倒序，最后一个是主楼)
        if let mainPost = items.last {
            let cleanDesc = mainPost.description
                .replacingOccurrences(of: #"<p><a[^>]*>阅读完整话题</a></p>"#, with: "", options: .regularExpression)
                .replacingOccurrences(of: #"<a[^>]*>阅读完整话题</a>"#, with: "", options: .regularExpression)

            html += """
            <div class="main-post">
                <div class="main-post-header">
                    <span class="post-author">\(mainPost.author)</span>
                    <span class="post-time">\(formatTime(mainPost.pubDate))</span>
                </div>
                <div class="main-post-content">\(cleanDesc)</div>
            </div>
            """
        }

        // 回复
        html += """
        <div class="replies-section">
            <div class="replies-header">\(items.count > 1 ? "\(items.count - 1) 条回复" : "暂无回复")</div>
        """

        if items.count > 1 {
            for i in stride(from: items.count - 2, through: 0, by: -1) {
                let item = items[i]
                let cleanDesc = item.description
                    .replacingOccurrences(of: #"<p><a[^>]*>阅读完整话题</a></p>"#, with: "", options: .regularExpression)
                    .replacingOccurrences(of: #"<a[^>]*>阅读完整话题</a>"#, with: "", options: .regularExpression)

                html += """
                <div class="reply-item">
                    <div class="reply-header">
                        <span class="post-author">\(item.author)</span>
                        <span class="post-time">\(formatTime(item.pubDate))</span>
                        <span class="post-floor">#\(i + 1)</span>
                    </div>
                    <div class="reply-content">\(cleanDesc)</div>
                </div>
                """
            }
        } else {
            html += "<div class=\"no-replies\">还没有人回复，快来抢沙发吧！</div>"
        }

        html += "</div>"
        return html
    }

    // MARK: - RSS 解析

    private struct RSSItem {
        let title: String
        let link: String
        let pubDate: String
        let author: String
        let category: String
        let description: String
        let guid: String
    }

    private func parseRSSItems(_ xml: String) -> [RSSItem] {
        var items: [RSSItem] = []

        // 正则提取 <item>...</item>
        let itemPattern = #"<item>([\s\S]*?)</item>"#
        guard let regex = try? NSRegularExpression(pattern: itemPattern) else { return [] }

        let matches = regex.matches(in: xml, range: NSRange(xml.startIndex..., in: xml))
        for match in matches {
            guard let range = Range(match.range(at: 1), in: xml) else { continue }
            let itemContent = String(xml[range])

            items.append(RSSItem(
                title: extractField("title", from: itemContent),
                link: extractField("link", from: itemContent),
                pubDate: extractField("pubDate", from: itemContent),
                author: extractField("dc:creator", from: itemContent),
                category: extractField("category", from: itemContent),
                description: extractField("description", from: itemContent),
                guid: extractField("guid", from: itemContent)
            ))
        }

        return items
    }

    private func extractField(_ field: String, from content: String) -> String {
        // 尝试 CDATA
        let cdataPattern = "<\(field)[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></\(field)>"
        if let regex = try? NSRegularExpression(pattern: cdataPattern),
           let match = regex.firstMatch(in: content, range: NSRange(content.startIndex..., in: content)),
           let range = Range(match.range(at: 1), in: content) {
            return String(content[range]).trimmingCharacters(in: .whitespacesAndNewlines)
        }

        // 普通标签
        let plainPattern = "<\(field)[^>]*>([\\s\\S]*?)</\(field)>"
        if let regex = try? NSRegularExpression(pattern: plainPattern),
           let match = regex.firstMatch(in: content, range: NSRange(content.startIndex..., in: content)),
           let range = Range(match.range(at: 1), in: content) {
            return String(content[range]).trimmingCharacters(in: .whitespacesAndNewlines)
        }

        return ""
    }

    // MARK: - 时间格式化

    private func formatTime(_ timeStr: String) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "E, dd MMM yyyy HH:mm:ss Z"

        guard let date = formatter.date(from: timeStr) else { return timeStr }

        let now = Date()
        let diff = now.timeIntervalSince(date)

        if diff < 60 { return "刚刚" }
        if diff < 3600 { return "\(Int(diff / 60)) 分钟前" }
        if diff < 86400 { return "\(Int(diff / 3600)) 小时前" }
        if diff < 604800 { return "\(Int(diff / 86400)) 天前" }

        let displayFormatter = DateFormatter()
        displayFormatter.locale = Locale(identifier: "zh_CN")
        if Calendar.current.isDate(date, equalTo: now, toGranularity: .year) {
            displayFormatter.dateFormat = "MM-dd HH:mm"
        } else {
            displayFormatter.dateFormat = "yyyy-MM-dd HH:mm"
        }
        return displayFormatter.string(from: date)
    }
}
