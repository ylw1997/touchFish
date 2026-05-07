import Foundation

/// 通用新闻条目模型
struct NewsItem: Identifiable, Hashable {
    let id: String
    let title: String
    let url: String
    let source: Platform
    var time: String?
    var author: String?
    var category: String?
    var isRead: Bool = false

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: NewsItem, rhs: NewsItem) -> Bool {
        lhs.id == rhs.id
    }
}

/// IT之家 JSON 响应模型
struct ITHomeResponse: Codable {
    let newslist: [ITHomeNewsItem]?
}

struct ITHomeNewsItem: Codable {
    let newsid: Int?
    let title: String?
    let description: String?
    let postdate: String?
    let image: String?
    let url: String?
}

/// IT之家详情响应
struct ITHomeDetailResponse: Codable {
    let detail: String?
    let content: String?
    let title: String?
    let newsid: Int?
}
