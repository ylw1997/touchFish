import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case badResponse
    case httpError(statusCode: Int)
    case apiError(message: String)
    case emptyCookie

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "请求地址无效"
        case .badResponse:
            return "服务器响应无效"
        case .httpError(let statusCode):
            return "网络请求失败（HTTP \(statusCode)）"
        case .apiError(let message):
            return message
        case .emptyCookie:
            return "Cookie 不能为空"
        }
    }
}

class DouyinAPI: ObservableObject {
    static let shared = DouyinAPI()
    
    private let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    
    @Published var cookie: String = "" {
        didSet {
            UserDefaults.standard.set(cookie, forKey: "douyin_cookie")
            cookieRevision &+= 1
        }
    }
    @Published private(set) var cookieRevision: UInt = 0
    
    private init() {
        self.cookie = UserDefaults.standard.string(forKey: "douyin_cookie") ?? ""
    }
    
    static func normalizedCookie(from input: String) -> String {
        let lines = input
            .components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        if let cookieLine = lines.first(where: { $0.lowercased().hasPrefix("cookie:") }),
           let separator = cookieLine.firstIndex(of: ":") {
            return String(cookieLine[cookieLine.index(after: separator)...])
                .trimmingCharacters(in: .whitespacesAndNewlines)
        }

        let joined = lines.joined(separator: " ")
        if joined.lowercased().hasPrefix("cookie:"), let separator = joined.firstIndex(of: ":") {
            return String(joined[joined.index(after: separator)...])
                .trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return joined
    }

    private func getHeaders(cookieOverride: String? = nil, extra: [String: String] = [:]) -> [String: String] {
        var headers = [
            "User-Agent": userAgent,
            "Referer": "https://www.douyin.com/",
            "Origin": "https://www.douyin.com"
        ]
        let requestCookie = cookieOverride ?? cookie
        if !requestCookie.isEmpty {
            headers["Cookie"] = requestCookie
        }
        for (key, val) in extra {
            headers[key] = val
        }
        return headers
    }
    
    private func request<T: Decodable>(
        url: String,
        method: String = "GET",
        body: Data? = nil,
        cookieOverride: String? = nil,
        extraHeaders: [String: String] = [:]
    ) async throws -> T {
        // 使用完整 URL 生成 X-Bogus，保持与桌面端已验证的调用方式一致。
        let signedUrlStr = SignatureManager.shared.sign(url: url, userAgent: userAgent)
        guard let requestUrl = URL(string: signedUrlStr) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: requestUrl)
        request.httpMethod = method
        request.httpBody = body
        request.timeoutInterval = 15.0
        request.cachePolicy = .reloadIgnoringLocalCacheData // 禁用本地缓存，保证网络请求能获取最新数据
        
        let headers = getHeaders(cookieOverride: cookieOverride, extra: extraHeaders)
        for (key, val) in headers {
            request.setValue(val, forHTTPHeaderField: key)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.badResponse
        }
        
        if !(200...299).contains(httpResponse.statusCode) {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }

    
    // MARK: - API Methods
    
    func validateCookie(_ input: String) async throws -> String {
        let normalized = Self.normalizedCookie(from: input)
        guard !normalized.isEmpty else { throw APIError.emptyCookie }

        let url = "https://www.douyin.com/aweme/v1/web/aweme/favorite/?device_platform=webapp&aid=6383&channel=channel_pc_web&pc_client_type=1&max_cursor=0&count=1&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32"
        let res: StatusResponse = try await request(url: url, cookieOverride: normalized)
        try validateStatus(res.status_code, message: res.status_msg)
        return normalized
    }

    private func validateStatus(_ statusCode: Int, message: String?) throws {
        guard statusCode == 0 else {
            let detail = message.flatMap { $0.isEmpty ? nil : $0 }
                ?? "抖音接口返回错误（\(statusCode)）"
            throw APIError.apiError(message: detail)
        }
    }

    /// 获取推荐视频流
    func getFeed() async throws -> [Aweme] {
        let ts = Int(Date().timeIntervalSince1970 * 1000)
        let url = "https://www.douyin.com/aweme/v1/web/channel/feed/?device_platform=webapp&aid=6383&count=10&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32&_t=\(ts)"
        let res: FeedResponse = try await request(url: url)
        try validateStatus(res.status_code, message: res.status_msg)
        return res.aweme_list ?? []
    }
    
    /// 获取关注视频流
    func getFollowing(maxCursor: Int = 0) async throws -> ([Aweme], Int, Bool) {
        let url = "https://www.douyin.com/aweme/v1/web/follow/feed/?device_platform=webapp&aid=6383&channel=channel_pc_web&count=10&min_cursor=0&max_cursor=\(maxCursor)&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32"
        let res: FollowingResponse = try await request(url: url, extraHeaders: ["Referer": "https://www.douyin.com/follow"])
        try validateStatus(res.status_code, message: res.status_msg)
        let awemes = (res.data ?? []).compactMap { $0.aweme }
        let nextCursor = res.cursor ?? maxCursor
        let hasMore = res.has_more ?? (res.has_more_int == 1)
        return (awemes, nextCursor, hasMore)
    }
    
}

// MARK: - Models

struct FeedResponse: Decodable {
    let status_code: Int
    let status_msg: String?
    let aweme_list: [Aweme]?
}

struct FollowingResponse: Decodable {
    let status_code: Int
    let status_msg: String?
    let data: [FollowingItem]?
    let cursor: Int?
    let has_more: Bool?
    let has_more_int: Int?
    
    enum CodingKeys: String, CodingKey {
        case status_code
        case status_msg
        case data
        case cursor
        case has_more
        case has_more_int = "has_more_type" // 抖音可能返回不同命名
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.status_code = try container.decode(Int.self, forKey: .status_code)
        self.status_msg = try container.decodeIfPresent(String.self, forKey: .status_msg)
        self.data = try container.decodeIfPresent([FollowingItem].self, forKey: .data)
        self.cursor = try container.decodeIfPresent(Int.self, forKey: .cursor)
        
        if let boolVal = try? container.decode(Bool.self, forKey: .has_more) {
            self.has_more = boolVal
        } else if let intVal = try? container.decode(Int.self, forKey: .has_more) {
            self.has_more = intVal == 1
        } else {
            self.has_more = false
        }
        
        self.has_more_int = try container.decodeIfPresent(Int.self, forKey: .has_more_int)
    }
}

struct FollowingItem: Decodable {
    let aweme: Aweme?
}

struct StatusResponse: Decodable {
    let status_code: Int
    let status_msg: String?
}

struct Aweme: Decodable, Identifiable, Equatable {
    var id: String { aweme_id }
    let aweme_id: String
    let desc: String?
    let author: Author?
    let video: Video?
    
    enum CodingKeys: String, CodingKey {
        case aweme_id
        case desc
        case author
        case video
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.aweme_id = try container.decode(String.self, forKey: .aweme_id)
        self.desc = try container.decodeIfPresent(String.self, forKey: .desc)
        self.author = try container.decodeIfPresent(Author.self, forKey: .author)
        self.video = try container.decodeIfPresent(Video.self, forKey: .video)
    }
    
    static func == (lhs: Aweme, rhs: Aweme) -> Bool {
        return lhs.aweme_id == rhs.aweme_id
    }
}

struct Author: Decodable {
    let sec_uid: String?
    let sec_user_id: String?
    let nickname: String?
    let avatar_thumb: AvatarUrl?
    
    var uid: String {
        return sec_uid ?? sec_user_id ?? ""
    }
}

struct AvatarUrl: Decodable {
    let url_list: [String]?
}

struct Video: Decodable {
    let play_addr: VideoAddr?
    let cover: AvatarUrl?
    let duration: Int?
}

struct VideoAddr: Decodable {
    let url_list: [String]?
}

