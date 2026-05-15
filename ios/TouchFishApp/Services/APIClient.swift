import Foundation

/// API 客户端 - 与服务端通信的核心类
class APIClient {
    static let shared = APIClient()
    
    // MARK: - Configuration
    
    /// 服务端基础 URL（默认本地开发环境）
    var baseURL: String {
        // 可从 UserDefaults 读取用户自定义地址
        if let customURL = UserDefaults.standard.string(forKey: "api_base_url"), !customURL.isEmpty {
            return customURL
        }
        return "http://127.0.0.1:3210"
    }
    
    private let session: URLSession
    private let decoder: JSONDecoder
    
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.httpAdditionalHeaders = [
            "User-Agent": "TouchFish-iOS/1.0",
            "Accept": "application/json"
        ]
        session = URLSession(configuration: config)
        
        decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
    }
    
    // MARK: - Generic Request Methods
    
    /// 发送请求并解码响应
    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .GET,
        queryItems: [URLQueryItem]? = nil,
        body: Encodable? = nil,
        headers: [String: String]? = nil
    ) async throws -> T {
        // 构建完整 URL
        var urlComponents = URLComponents(string: baseURL + endpoint)!
        if let queryItems = queryItems, !queryItems.isEmpty {
            urlComponents.queryItems = queryItems
        }
        
        let url = urlComponents.url!
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        
        // 添加自定义 headers
        headers?.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        
        // 添加 body
        if let body = body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        // 发送请求
        let (data, response) = try await session.data(for: request)
        
        // 验证响应
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        // 处理错误状态码
        if !(200...299).contains(httpResponse.statusCode) {
            // 尝试解析错误消息
            if let errorResponse = try? decoder.decode(APIErrorResponse.self, from: data) {
                throw APIError.serverError(errorResponse.message ?? "服务器错误", httpResponse.statusCode)
            }
            throw APIError.httpError(httpResponse.statusCode)
        }
        
        // 解码响应
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            print("[APIClient] Decoding error: \(error)")
            print("[APIClient] Response data: \(String(data: data, encoding: .utf8) ?? "nil")")
            throw APIError.decodingFailed(error)
        }
    }
    
    // MARK: - Server Configuration
    
    /// 设置服务端配置（Cookie/Token）
    func setServerConfig(key: String, value: String) async throws {
        struct ConfigBody: Encodable {
            let value: String
        }
        
        let _: APIResponse<ConfigResponse> = try await request(
            endpoint: "/api/config/\(key)",
            method: .POST,
            body: ConfigBody(value: value)
        )
    }
    
    // MARK: - Platform-specific API Methods
    
    /// 获取新闻列表
    func fetchNewsList(platform: Platform, tab: String?) async throws -> [NewsItem] {
        let endpoint = platform.listEndpoint
        var queryItems: [URLQueryItem] = []
        var headers: [String: String] = [:]
        
        if let tab = tab, !tab.isEmpty {
            queryItems.append(URLQueryItem(name: platform.tabParamName, value: tab))
        }
        
        // 添加认证信息（在 Header 中传递 Cookie）
        if platform.requiresCookie {
            let cookieKey = platform.cookieKey
            if let cookie = UserDefaults.standard.string(forKey: cookieKey), !cookie.isEmpty {
                headers["Cookie"] = cookie
                headers["X-TouchFish-Cookie"] = cookie
                if platform == .nga {
                    headers["Referer"] = "https://bbs.nga.cn/"
                } else if platform == .linuxdo {
                    headers["Referer"] = "https://linux.do/"
                }
            }
        }
        
        let response: APIResponse<NewsListData> = try await request(
            endpoint: endpoint,
            queryItems: queryItems,
            headers: headers
        )
        
        guard response.ok else {
            throw APIError.apiError(response.status, response.message ?? "API 返回错误")
        }
        
        // 转换为 NewsItem（使用 allItems() 支持不同格式）
        return response.data.allItems().map { item in
            // 生成唯一 ID：优先使用 item.id，否则使用 url 的 hash
            let uniqueId = item.id ?? (item.url != nil ? String(item.url!.hashValue) : UUID().uuidString)
            return NewsItem(
                id: "\(platform.rawValue):\(uniqueId)",
                title: item.title ?? "无标题",
                url: item.url ?? "",
                source: platform,
                time: item.time,
                author: item.author,
                category: item.category,
                isRead: false,
                rawId: item.id  // 保存原始 ID
            )
        }
    }
    
    /// 获取详情
    func fetchDetail(platform: Platform, url: String, page: Int? = nil) async throws -> DetailData {
        let endpoint = platform.detailEndpoint
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "url", value: url)
        ]
        var headers: [String: String] = [:]
        
        if let page = page {
            queryItems.append(URLQueryItem(name: "page", value: String(page)))
        }
        
        // 添加认证信息（在 Header 中传递 Cookie）
        if platform.requiresCookie {
            let cookieKey = platform.cookieKey
            if let cookie = UserDefaults.standard.string(forKey: cookieKey), !cookie.isEmpty {
                headers["Cookie"] = cookie
                headers["X-TouchFish-Cookie"] = cookie
                if platform == .nga {
                    headers["Referer"] = "https://bbs.nga.cn/"
                } else if platform == .linuxdo {
                    headers["Referer"] = "https://linux.do/"
                }
            }
        }
        
        let response: APIResponse<DetailData> = try await request(
            endpoint: endpoint,
            queryItems: queryItems,
            headers: headers
        )
        
        guard response.ok else {
            throw APIError.apiError(response.status, response.message ?? "API 返回错误")
        }
        
        return response.data
    }
    
    // MARK: - Special Platform APIs
    
    /// IT之家详情（使用 id 参数）
    func fetchITHomeDetail(id: String) async throws -> DetailData {
        let response: APIResponse<ITHomeDetailData> = try await request(
            endpoint: "/api/ithome/detail",
            queryItems: [URLQueryItem(name: "id", value: id)]
        )
        
        guard response.ok else {
            throw APIError.apiError(response.status, response.message ?? "API 返回错误")
        }
        
        // 转换为通用 DetailData（优先使用 detail 字段）
        return DetailData(
            html: response.data.detail ?? response.data.content ?? "",
            totalPages: 1,
            currentPage: 1
        )
    }
    
    /// NGA 详情（使用 tid 和 page 参数）
    func fetchNGADetail(tid: String, page: Int? = nil) async throws -> DetailData {
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "tid", value: tid)
        ]
        if let page = page {
            queryItems.append(URLQueryItem(name: "page", value: String(page)))
        }
        
        // 添加 Cookie 到 Header
        var headers: [String: String] = [:]
        if let cookie = UserDefaults.standard.string(forKey: "nga_cookie"), !cookie.isEmpty {
            headers["Cookie"] = cookie
            headers["X-TouchFish-Cookie"] = cookie
            headers["Referer"] = "https://bbs.nga.cn/"
        }
        
        let response: APIResponse<DetailData> = try await request(
            endpoint: "/api/nga/detail",
            queryItems: queryItems,
            headers: headers
        )
        
        guard response.ok else {
            throw APIError.apiError(response.status, response.message ?? "API 返回错误")
        }
        
        return response.data
    }
    
    /// Linux.do 详情（使用 topicId 参数）
    func fetchLinuxDoDetail(topicId: String) async throws -> DetailData {
        let queryItems: [URLQueryItem] = [
            URLQueryItem(name: "topicId", value: topicId)
        ]
        
        // 添加 Cookie 到 Header
        var headers: [String: String] = [:]
        if let cookie = UserDefaults.standard.string(forKey: "linuxdo_cookie"), !cookie.isEmpty {
            headers["Cookie"] = cookie
            headers["X-TouchFish-Cookie"] = cookie
        }
        
        let response: APIResponse<DetailData> = try await request(
            endpoint: "/api/linuxdo/detail",
            queryItems: queryItems,
            headers: headers
        )
        
        guard response.ok else {
            throw APIError.apiError(response.status, response.message ?? "API 返回错误")
        }
        
        return response.data
    }
}

// MARK: - Supporting Types

enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
}

enum APIError: LocalizedError {
    case invalidResponse
    case httpError(Int)
    case serverError(String, Int)
    case apiError(Int, String)
    case decodingFailed(Error)
    case unauthorized
    case networkError(Error)
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "无效的服务器响应"
        case .httpError(let code):
            return "HTTP 错误: \(code)"
        case .serverError(let message, _):
            return message
        case .apiError(let code, let message):
            return "API 错误 (\(code)): \(message)"
        case .decodingFailed(let error):
            return "数据解析失败: \(error.localizedDescription)"
        case .unauthorized:
            return "认证失败，请检查 Cookie 配置"
        case .networkError(let error):
            return "网络错误: \(error.localizedDescription)"
        }
    }
}

// MARK: - Response Models

/// 通用 API 响应包装
struct APIResponse<T: Decodable>: Decodable {
    let ok: Bool
    let status: Int
    let data: T
    var message: String?
    var refreshedToken: Bool?
}

/// API 错误响应
struct APIErrorResponse: Decodable {
    let ok: Bool?
    let status: Int?
    let message: String?
}

/// 新闻列表数据（通用格式）
struct NewsListData: Decodable {
    let items: [NewsItemResponse]?
    
    // IT之家特殊格式
    let newslist: [ITHomeNewsItemResponse]?
    let toplist: [ITHomeNewsItemResponse]?
    
    // 其他字段（忽略）
    let array: [String]?  // IT之家额外字段
    let lapin: Bool?  // IT之家额外字段（布尔值）
    
    /// 获取所有新闻项（统一格式）
    func allItems() -> [NewsItemResponse] {
        // 通用格式
        if let items = items, !items.isEmpty {
            return items
        }
        
        // IT之家格式：合并置顶和普通列表
        var result: [NewsItemResponse] = []
        if let toplist = toplist {
            result.append(contentsOf: toplist.map { $0.toNewsItemResponse() })
        }
        if let newslist = newslist {
            result.append(contentsOf: newslist.map { $0.toNewsItemResponse() })
        }
        return result
    }
}

/// IT之家新闻项响应
struct ITHomeNewsItemResponse: Decodable {
    let newsid: Int?
    let title: String?
    let url: String?
    let postdate: String?
    let orderdate: String?
    let description: String?
    let image: String?
    let hitcount: Int?
    let commentcount: Int?
    let hidecount: Bool?
    let cid: Int?
    let nd: Int?
    let sid: Int?
    let forbidcomment: Bool?
    let kwdlist: [String]?
    let client: String?
    let device: String?
    let topplat: String?
    let aid: Int?
    let v: String?
    
    func toNewsItemResponse() -> NewsItemResponse {
        NewsItemResponse(
            id: newsid?.description,
            title: title,
            url: url,
            time: postdate,
            author: nil,
            category: nil,
            thumbnail: image
        )
    }
}

/// 新闻项响应（通用格式）
struct NewsItemResponse: Decodable {
    let id: String?
    let title: String?
    let url: String?
    let time: String?
    let author: String?
    let category: String?
    let thumbnail: String?
    
    // 自定义解码，支持不同字段名
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decodeIfPresent(String.self, forKey: .id)
        title = try container.decodeIfPresent(String.self, forKey: .title)
        url = try container.decodeIfPresent(String.self, forKey: .url)
        time = try container.decodeIfPresent(String.self, forKey: .time)
        author = try container.decodeIfPresent(String.self, forKey: .author)
        category = try container.decodeIfPresent(String.self, forKey: .category)
        thumbnail = try container.decodeIfPresent(String.self, forKey: .thumbnail)
    }
    
    // 支持手动创建
    init(id: String?, title: String?, url: String?, time: String?, author: String?, category: String?, thumbnail: String?) {
        self.id = id
        self.title = title
        self.url = url
        self.time = time
        self.author = author
        self.category = category
        self.thumbnail = thumbnail
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case url
        case time
        case author
        case category
        case thumbnail
    }
}

/// 配置响应
struct ConfigResponse: Decodable {
    let key: String
}

/// 详情数据
struct DetailData: Decodable {
    let html: String
    let totalPages: Int?
    let currentPage: Int?
}

/// IT之家详情数据
struct ITHomeDetailData: Decodable {
    let success: Bool?
    let newsid: Int?
    let title: String?
    let url: String?
    let newssource: String?
    let newsauthor: String?
    let keyword: String?
    let image: String?
    let newstags: [ITHomeNewsTag]?
    let newsflag: Int?
    let detail: String?  // HTML 内容
    let postdate: String?
    let hitcount: Int?
    let btheme: Bool?
    let forbidcomment: Bool?
    let commentcount: Int?
    let z: String?
    let content: String?  // 兼容旧格式
}

/// IT之家新闻标签
struct ITHomeNewsTag: Decodable {
    let id: Int?
    let keyword: String?
    let link: String?
}
