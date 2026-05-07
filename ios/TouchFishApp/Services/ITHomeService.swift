import Foundation

/// IT之家 API 服务
/// 数据源: https://api.ithome.com/json/newslist/news
struct ITHomeService: PlatformServiceProtocol {

    func fetchNewsList(tab: String?) async throws -> [NewsItem] {
        let url = URL(string: "https://api.ithome.com/json/newslist/news?r=0")!
        let data = try await NetworkService.shared.fetchData(from: url)

        // IT之家返回的 JSON 结构: { newslist: [...] }
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let newslist = json["newslist"] as? [[String: Any]] else {
            return []
        }

        return newslist.compactMap { item in
            guard let title = item["title"] as? String,
                  let newsid = item["newsid"] else { return nil }

            return NewsItem(
                id: "ithome:\(newsid)",
                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                url: "\(newsid)",
                source: .ithome,
                time: (item["postdate"] as? String)?.components(separatedBy: " ").last
            )
        }
    }

    func fetchDetail(url: String) async throws -> String {
        let detailURL = URL(string: "https://api.ithome.com/json/newscontent/\(url)")!
        let data = try await NetworkService.shared.fetchData(from: detailURL)

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw NetworkError.decodingFailed
        }

        // 尝试提取内容
        if let detail = json["detail"] as? String {
            return detail
        }
        if let content = json["content"] as? String {
            return content
        }

        // 返回整个 JSON 的可读形式
        let prettyData = try JSONSerialization.data(withJSONObject: json, options: .prettyPrinted)
        return String(data: prettyData, encoding: .utf8) ?? "无法解析内容"
    }
}
