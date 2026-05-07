import Foundation

/// V2EX 抓取服务
/// 数据源: https://www.v2ex.com/?tab=all
struct V2EXService: PlatformServiceProtocol {

    func fetchNewsList(tab: String?) async throws -> [NewsItem] {
        let tabParam = tab ?? "all"
        let url = URL(string: "https://www.v2ex.com/?tab=\(tabParam)")!

        let html = try await NetworkService.shared.fetchString(from: url)
        let doc = HTMLParser(html)
        var items: [NewsItem] = []
        var seen = Set<String>()

        let cells = doc.select(".cell.item")
        for cell in cells {
            guard let linkEl = cell.selectFirst(".topic-link") else { continue }
            let title = linkEl.text().trimmingCharacters(in: .whitespacesAndNewlines)
            var href = (linkEl.attr("href") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            guard !title.isEmpty, !href.isEmpty else { continue }

            // 清理 URL: 移除 hash 和查询参数
            href = href.components(separatedBy: "#").first ?? href
            href = href.components(separatedBy: "?").first ?? href

            // 去重
            guard !seen.contains(href) else { continue }
            seen.insert(href)

            items.append(NewsItem(
                id: "v2ex:\(href)",
                title: title,
                url: href,
                source: .v2ex
            ))
        }

        return items
    }

    func fetchDetail(url: String) async throws -> String {
        var fullUrl = "https://www.v2ex.com\(url)"
        if url.hasPrefix("http") {
            fullUrl = url
        }

        guard let detailURL = URL(string: fullUrl) else {
            return "<p>无效的 URL</p>"
        }

        let html = try await NetworkService.shared.fetchString(from: detailURL)
        let doc = HTMLParser(html)

        guard let content = doc.selectFirst("#Main")?.html() else {
            return "<p>获取 V2EX 内容失败</p>"
        }

        return content.replacingOccurrences(of: "&nbsp;", with: "")
    }
}
