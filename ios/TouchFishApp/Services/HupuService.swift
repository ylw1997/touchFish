import Foundation

/// 虎扑步行街抓取服务
/// 数据源: https://bbs.hupu.com/{tab}
struct HupuService: PlatformServiceProtocol {

    func fetchNewsList(tab: String?) async throws -> [NewsItem] {
        let tabParam = tab ?? "all-gambia"
        let url = URL(string: "https://bbs.hupu.com/\(tabParam)")!

        let html = try await NetworkService.shared.fetchString(from: url)
        let doc = HTMLParser(html)
        var items: [NewsItem] = []
        var seen = Set<String>()

        if tabParam == "all-gambia" {
            let listItems = doc.select(".text-list-model .list-item")
            for element in listItems {
                guard let linkEl = element.selectFirst("a") else { continue }
                let title = (linkEl.selectFirst(".t-title")?.text() ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                var href = (linkEl.attr("href") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                guard !title.isEmpty, !href.isEmpty else { continue }

                if !href.hasPrefix("http") && !href.hasPrefix("/") {
                    href = "/" + href
                }
                guard !seen.contains(href) else { continue }
                seen.insert(href)

                items.append(NewsItem(
                    id: "hupu:\(href)",
                    title: title,
                    url: href,
                    source: .hupu
                ))
            }
        } else {
            let postItems = doc.select(".bbs-sl-web-post .post-title")
            for element in postItems {
                guard let titleEl = element.selectFirst(".p-title") else { continue }
                let title = titleEl.text().trimmingCharacters(in: .whitespacesAndNewlines)
                var href = (titleEl.attr("href") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                guard !title.isEmpty, !href.isEmpty else { continue }

                if !href.hasPrefix("http") && !href.hasPrefix("/") {
                    href = "/" + href
                }
                guard !seen.contains(href) else { continue }
                seen.insert(href)

                items.append(NewsItem(
                    id: "hupu:\(href)",
                    title: title,
                    url: href,
                    source: .hupu
                ))
            }
        }

        return items
    }

    func fetchDetail(url: String) async throws -> String {
        var fullUrl = url
        if !url.hasPrefix("http") {
            fullUrl = "https://bbs.hupu.com\(url.hasPrefix("/") ? url : "/\(url)")"
        }

        guard let detailURL = URL(string: fullUrl) else {
            return "<p>无效的 URL</p>"
        }

        let html = try await NetworkService.shared.fetchString(from: detailURL)
        // 去掉 CSS 动态字符串
        let cleaned = html
            .replacingOccurrences(of: #"__.\w*""#, with: "\"", options: .regularExpression)
            .replacingOccurrences(of: #"__.\w*\s"#, with: " ", options: .regularExpression)

        let doc = HTMLParser(cleaned)
        guard let content = doc.selectFirst(".index_bbs-post-web-body-left-wrapper")?.html() else {
            return "<p>获取虎扑内容失败</p>"
        }

        return content
    }
}
