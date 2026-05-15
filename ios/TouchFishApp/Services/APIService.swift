import Foundation

/// API 服务适配器 - 通过服务端 API 获取数据
struct APIService: PlatformServiceProtocol {
    let platform: Platform
    private let client = APIClient.shared
    
    func fetchNewsList(tab: String?) async throws -> [NewsItem] {
        // 检查是否需要 Cookie 但未配置
        if platform.requiresCookie {
            let cookieKey = platform.cookieKey
            let cookie = UserDefaults.standard.string(forKey: cookieKey) ?? ""
            if cookie.isEmpty {
                // 返回提示项
                return [
                    NewsItem(
                        id: "\(platform.rawValue):configure",
                        title: "⚙️ \(platform.displayName) Cookie 未配置",
                        url: "configure_cookie",
                        source: platform,
                        time: nil,
                        author: nil,
                        category: nil,
                        isRead: false
                    )
                ]
            }
        }
        
        // 调用 API 获取列表
        return try await client.fetchNewsList(platform: platform, tab: tab)
    }
    
    func fetchDetail(url: String) async throws -> String {
        // 处理特殊平台的详情获取
        switch platform {
        case .ithome:
            // IT之家使用 id 参数 - 从 URL 路径提取完整 newsid
            // URL 格式: /0/948/658.htm -> newsid: 948658
            let id = extractITHomeId(from: url)
            print("[TouchFish] IT之家详情请求 - URL: \(url), extracted ID: \(id)")
            let detail = try await client.fetchITHomeDetail(id: id)
            return detail.html
            
        case .nga:
            // NGA 使用 tid 参数
            let tid = extractNGATid(from: url)
            let detail = try await client.fetchNGADetail(tid: tid)
            return detail.html
            
        case .linuxdo:
            // Linux.do 使用 topicId 参数
            let topicId = extractLinuxDoTopicId(from: url)
            let detail = try await client.fetchLinuxDoDetail(topicId: topicId)
            return detail.html
            
        default:
            // 其他平台使用 url 参数
            // 构建完整 URL（如果是相对路径）
            let fullUrl = buildFullUrl(for: platform, url: url)
            print("[TouchFish] \(platform.displayName) 详情请求 - original: \(url), full: \(fullUrl)")
            let detail = try await client.fetchDetail(platform: platform, url: fullUrl)
            return detail.html
        }
    }
    
    // MARK: - URL Helpers
    
    /// 构建完整 URL
    private func buildFullUrl(for platform: Platform, url: String) -> String {
        // 如果已经是完整 URL，直接返回
        if url.hasPrefix("http://") || url.hasPrefix("https://") {
            return url
        }
        
        // 根据平台构建基础 URL
        switch platform {
        case .v2ex:
            return "https://www.v2ex.com" + (url.hasPrefix("/") ? url : "/" + url)
        case .hupu:
            return "https://bbs.hupu.com" + (url.hasPrefix("/") ? url : "/" + url)
        case .chiphell:
            return "https://www.chiphell.com" + (url.hasPrefix("/") ? url : "/" + url)
        default:
            return url
        }
    }
    
    // MARK: - URL Extraction Helpers
    
    /// 从 IT之家 URL 提取新闻 ID
    /// URL 格式: /0/948/658.htm -> 需要提取 948658 (完整 newsid)
    private func extractITHomeId(from url: String) -> String {
        // 如果已经是纯数字，直接返回
        if url.allSatisfy({ $0.isNumber }) {
            return url
        }
        
        // 尝试从 URL 路径提取完整 newsid
        // 格式: /0/948/658.htm -> 948658
        // 格式: /html/123456.html -> 123456
        // 格式: /html/digi/948655.htm -> 948655
        
        // 首先尝试匹配 /0/xxx/yyy.htm 格式，提取 xxx 和 yyy 组合
        if let regex = try? NSRegularExpression(pattern: "/0/(\\d+)/(\\d+)\\.htm", options: []),
           let match = regex.firstMatch(in: url, range: NSRange(url.startIndex..., in: url)),
           let range1 = Range(match.range(at: 1), in: url),
           let range2 = Range(match.range(at: 2), in: url) {
            let part1 = String(url[range1])
            let part2 = String(url[range2])
            let fullId = part1 + part2
            print("[TouchFish] Extracted IT之家 ID from /0/xxx/yyy.htm: \(fullId)")
            return fullId
        }
        
        // 匹配 /html/123456.html
        if let regex = try? NSRegularExpression(pattern: "/html/(\\d+)\\.html", options: []),
           let match = regex.firstMatch(in: url, range: NSRange(url.startIndex..., in: url)),
           let range = Range(match.range(at: 1), in: url) {
            let id = String(url[range])
            print("[TouchFish] Extracted IT之家 ID from /html/xxx.html: \(id)")
            return id
        }
        
        // 匹配 /html/digi/948655.htm
        if let regex = try? NSRegularExpression(pattern: "/html/\\w+/(\\d+)\\.htm", options: []),
           let match = regex.firstMatch(in: url, range: NSRange(url.startIndex..., in: url)),
           let range = Range(match.range(at: 1), in: url) {
            let id = String(url[range])
            print("[TouchFish] Extracted IT之家 ID from /html/xxx/yyy.htm: \(id)")
            return id
        }
        
        // 匹配 newsid=xxx
        if let regex = try? NSRegularExpression(pattern: "newsid=(\\d+)", options: []),
           let match = regex.firstMatch(in: url, range: NSRange(url.startIndex..., in: url)),
           let range = Range(match.range(at: 1), in: url) {
            let id = String(url[range])
            print("[TouchFish] Extracted IT之家 ID from newsid: \(id)")
            return id
        }
        
        // 如果无法提取，返回 URL 本身（让服务端处理）
        print("[TouchFish] Failed to extract IT之家 ID from URL: \(url)")
        return url
    }
    
    /// 从 NGA URL 提取帖子 ID (tid)
    private func extractNGATid(from url: String) -> String {
        // URL 格式示例：
        // https://bbs.nga.cn/read.php?tid=123456
        // https://nga.178.com/read.php?tid=123456
        
        if let regex = try? NSRegularExpression(pattern: "tid=(\\d+)"),
           let match = regex.firstMatch(in: url, range: NSRange(url.startIndex..., in: url)),
           let range = Range(match.range(at: 1), in: url) {
            return String(url[range])
        }
        
        // 如果无法提取，返回 URL 本身
        return url
    }
    
    /// 从 Linux.do URL 提取 topicId
    private func extractLinuxDoTopicId(from url: String) -> String {
        // URL 格式示例：
        // https://linux.do/t/123456
        // https://linux.do/t/topic-name/123456
        
        // 尝试提取路径中的数字
        if let regex = try? NSRegularExpression(pattern: "/t/[^/]*/(\\d+)"),
           let match = regex.firstMatch(in: url, range: NSRange(url.startIndex..., in: url)),
           let range = Range(match.range(at: 1), in: url) {
            return String(url[range])
        }
        
        // 尝试提取 /t/ 后的数字
        if let regex = try? NSRegularExpression(pattern: "/t/(\\d+)"),
           let match = regex.firstMatch(in: url, range: NSRange(url.startIndex..., in: url)),
           let range = Range(match.range(at: 1), in: url) {
            return String(url[range])
        }
        
        // 如果无法提取，返回 URL 本身
        return url
    }
}

// MARK: - Service Factory

/// 创建平台服务实例
func createService(for platform: Platform) -> any PlatformServiceProtocol {
    // 使用 API 服务
    return APIService(platform: platform)
}