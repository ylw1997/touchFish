import Foundation

/// ChipHell 抓取服务
/// 数据源: https://www.chiphell.com/forum.php?mod=forumdisplay&fid=319
struct ChipHellService: PlatformServiceProtocol {

    func fetchNewsList(tab: String?) async throws -> [NewsItem] {
        let url = URL(string: "https://www.chiphell.com/forum.php?mod=forumdisplay&fid=319&filter=author&orderby=dateline")!
        let headers = [
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Referer": "https://www.chiphell.com/forum.php",
        ]

        let html = try await NetworkService.shared.fetchString(from: url, headers: headers)
        let doc = HTMLParser(html)
        var items: [NewsItem] = []

        // 普通列表模式
        let links = doc.select("a.s.xst")
        for link in links {
            let title = link.text().trimmingCharacters(in: .whitespacesAndNewlines)
            let href = (link.attr("href") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            guard !title.isEmpty, !href.isEmpty, href.hasPrefix("thread-") else { continue }

            let cleanHref = href.components(separatedBy: "#").first ?? href
            items.append(NewsItem(
                id: "chiphell:\(cleanHref)",
                title: title,
                url: "https://www.chiphell.com/\(cleanHref)",
                source: .chiphell
            ))
        }

        // 瀑布流模式 fallback
        if items.isEmpty {
            let waterfallLinks = doc.select("h3.xw0 a")
            for link in waterfallLinks {
                let title = link.text().trimmingCharacters(in: .whitespacesAndNewlines)
                let href = (link.attr("href") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                guard !title.isEmpty, !href.isEmpty else { continue }

                let cleanHref = href.components(separatedBy: "#").first ?? href
                items.append(NewsItem(
                    id: "chiphell:\(cleanHref)",
                    title: title,
                    url: "https://www.chiphell.com/\(cleanHref)",
                    source: .chiphell
                ))
            }
        }

        return items
    }

    func fetchDetail(url: String) async throws -> String {
        let detailURL = URL(string: url)!
        let html = try await NetworkService.shared.fetchString(from: detailURL)
        let doc = HTMLParser(html)

        guard var content = doc.selectFirst(".t_fsz")?.html() else {
            return "<p>获取 ChipHell 文章内容失败</p>"
        }

        // 修复图片路径
        content = content.replacingOccurrences(
            of: "src=\"static/image/common/none.gif",
            with: ""
        )
        content = content.replacingOccurrences(
            of: "src=\"static",
            with: "src=\"https://www.chiphell.com/static"
        )
        content = content.replacingOccurrences(of: "zoomfile", with: "src")

        return content
    }
}
