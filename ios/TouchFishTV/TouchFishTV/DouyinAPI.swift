import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case badResponse
    case httpError(statusCode: Int)
    case apiError(message: String)
    case emptyCookie
    case emptyResponse
    case invalidResponseData

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
        case .emptyResponse:
            return "抖音接口返回了空数据，请稍后重试"
        case .invalidResponseData:
            return "抖音接口数据格式发生变化，请更新后重试"
        }
    }
}

@MainActor
final class DouyinAPI: ObservableObject {
    static let shared = DouyinAPI()
    
    private let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
    
    @Published var cookie: String = "" {
        didSet {
            UserDefaults.standard.set(cookie, forKey: "douyin_cookie")
            cookieRevision &+= 1
        }
    }
    @Published private(set) var cookieRevision: UInt = 0
    
    private init() {
        let savedCookie = UserDefaults.standard.string(forKey: "douyin_cookie") ?? ""
#if DEBUG
        self.cookie = savedCookie.isEmpty ? Self.loadDebugCookieFile() : savedCookie
#else
        self.cookie = savedCookie
#endif
    }

#if DEBUG
    /// 模拟器调试专用。Cookie 文件位于 App 沙盒 Documents，不会进入应用包或 Git。
    private static func loadDebugCookieFile() -> String {
        guard let documentsURL = FileManager.default.urls(
            for: .documentDirectory,
            in: .userDomainMask
        ).first else { return "" }

        let cookieURL = documentsURL.appendingPathComponent("douyin-cookie.txt")
        guard let content = try? String(contentsOf: cookieURL, encoding: .utf8) else {
            return ""
        }
        return normalizedCookie(from: content)
    }
#endif
    
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
            "Origin": "https://www.douyin.com",
            // tvOS 27 模拟器偶尔会把 Brotli 正文原样交给 JSONDecoder。
            // 请求未压缩 JSON，避免响应以二进制 br 数据开头。
            "Accept-Encoding": "identity",
            "Accept": "application/json, text/plain, */*"
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
        // SignatureManager 会按内置算法的契约提取 query 并生成 X-Bogus。
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
#if DEBUG
            logResponseFailure(data: data, response: httpResponse, reason: "http-error")
#endif
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
        
        guard !data.isEmpty else {
#if DEBUG
            logResponseFailure(data: data, response: httpResponse, reason: "empty-response")
#endif
            throw APIError.emptyResponse
        }

        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
#if DEBUG
            logResponseFailure(data: data, response: httpResponse, reason: "decode-error")
            print("[DouyinAPI] decodingError=\(error)")
#endif
            throw APIError.invalidResponseData
        }
    }

#if DEBUG
    private func logResponseFailure(data: Data, response: HTTPURLResponse, reason: String) {
        let contentType = response.value(forHTTPHeaderField: "Content-Type") ?? "unknown"
        let contentEncoding = response.value(forHTTPHeaderField: "Content-Encoding") ?? "identity"
        let firstByte = data.first.map { String(format: "%02X", $0) } ?? "none"
        let rawPrefix = String(data: data.prefix(160), encoding: .utf8) ?? "non-utf8"
        let prefix = rawPrefix
            .replacingOccurrences(of: "\r", with: " ")
            .replacingOccurrences(of: "\n", with: " ")
            .replacingOccurrences(of: "\t", with: " ")
            .prefix(160)
        print(
            "[DouyinAPI] reason=\(reason) status=\(response.statusCode) "
            + "contentType=\(contentType) contentEncoding=\(contentEncoding) "
            + "bytes=\(data.count) firstByte=\(firstByte) prefix=\(prefix)"
        )
    }
#endif

    
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

    /// 获取推荐视频流。
    ///
    /// 网页端当前使用 tab/feed，并通过 refresh_index + view_count 维持
    /// 推荐上下文。count 仍按网页请求传 10，实际条数以服务端响应为准。
    func getFeed(refreshIndex: Int, viewCount: Int) async throws -> ([Aweme], Bool) {
        let recommendationContext = """
        {"is_client":false,"ff_danmaku_status":1,"danmaku_switch_status":1,"is_dash_user":1,"is_auto_play":0,"is_full_screen":0,"is_full_webscreen":0,"is_mute":0,"is_speed":1,"is_visible":1,"related_recommend":1,"is_xigua_user":0}
        """
        var components = URLComponents(
            string: "https://www.douyin.com/aweme/v1/web/tab/feed/"
        )
        components?.queryItems = [
            URLQueryItem(name: "device_platform", value: "webapp"),
            URLQueryItem(name: "aid", value: "6383"),
            URLQueryItem(name: "channel", value: "channel_pc_web"),
            URLQueryItem(name: "filterGids", value: ""),
            URLQueryItem(name: "tag_id", value: ""),
            URLQueryItem(name: "share_aweme_id", value: ""),
            URLQueryItem(name: "live_insert_type", value: ""),
            URLQueryItem(name: "count", value: "10"),
            URLQueryItem(name: "refresh_index", value: String(refreshIndex)),
            URLQueryItem(name: "video_type_select", value: "1"),
            URLQueryItem(name: "aweme_pc_rec_raw_data", value: recommendationContext),
            URLQueryItem(name: "globalwid", value: ""),
            URLQueryItem(name: "pull_type", value: "2"),
            URLQueryItem(name: "min_window", value: "0"),
            URLQueryItem(name: "free_right", value: "0"),
            URLQueryItem(name: "view_count", value: String(viewCount)),
            URLQueryItem(name: "plug_block", value: "0"),
            URLQueryItem(name: "ug_source", value: ""),
            URLQueryItem(name: "creative_id", value: ""),
            URLQueryItem(name: "pc_client_type", value: "1"),
            URLQueryItem(name: "pc_libra_divert", value: "Windows"),
            URLQueryItem(name: "support_h265", value: "1"),
            URLQueryItem(name: "support_dash", value: "1"),
            URLQueryItem(name: "webcast_sdk_version", value: "170400"),
            URLQueryItem(name: "webcast_version_code", value: "170400"),
            URLQueryItem(name: "version_code", value: "170400"),
            URLQueryItem(name: "version_name", value: "17.4.0"),
            URLQueryItem(name: "cookie_enabled", value: "true"),
            URLQueryItem(name: "screen_width", value: "1920"),
            URLQueryItem(name: "screen_height", value: "1080"),
            URLQueryItem(name: "browser_language", value: "zh-CN"),
            URLQueryItem(name: "browser_platform", value: "Win32"),
            URLQueryItem(name: "browser_name", value: "Chrome"),
            URLQueryItem(name: "browser_version", value: "150.0.0.0"),
            URLQueryItem(name: "browser_online", value: "true"),
            URLQueryItem(name: "engine_name", value: "Blink"),
            URLQueryItem(name: "engine_version", value: "150.0.0.0"),
            URLQueryItem(name: "os_name", value: "Windows"),
            URLQueryItem(name: "os_version", value: "10"),
            URLQueryItem(name: "platform", value: "PC"),
            URLQueryItem(name: "timestamp", value: String(Int(Date().timeIntervalSince1970)))
        ]
        guard let url = components?.url?.absoluteString else {
            throw APIError.invalidURL
        }

        let res: FeedResponse = try await request(
            url: url,
            extraHeaders: ["Referer": "https://www.douyin.com/?recommend=1"]
        )
        try validateStatus(res.status_code, message: res.status_msg)
        let awemes = (res.aweme_list ?? []).filter { $0.video != nil }
        let hasMore = (res.has_more ?? 1) != 0
#if DEBUG
        PlaybackDiagnostics.shared.event(
            "recommend-response",
            category: "api",
            fields: [
                "refreshIndex": refreshIndex,
                "viewCount": viewCount,
                "entries": res.aweme_list?.count ?? 0,
                "videos": awemes.count,
                "hasMore": hasMore
            ]
        )
#endif
        return (awemes, hasMore)
    }
    
    /// 获取关注视频流
    func getFollowing(cursor: Int = 0) async throws -> ([Aweme], Int, Bool) {
        // 关注流使用时间游标，不是收藏接口的 max_cursor。首屏网页会传当前
        // 毫秒时间，后续严格使用响应中的 cursor 继续向前翻页。
        let requestCursor = cursor > 0
            ? cursor
            : Int(Date().timeIntervalSince1970 * 1_000)
        let url = "https://www.douyin.com/aweme/v1/web/follow/feed/?device_platform=webapp&aid=6383&channel=channel_pc_web&cursor=\(requestCursor)&level=1&count=20&pull_type=2&aweme_ids=&room_ids=&pc_client_type=1&pc_libra_divert=Windows&support_h265=1&support_dash=1&version_code=170400&version_name=17.4.0&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32"
        let res: FollowingResponse = try await request(url: url, extraHeaders: ["Referer": "https://www.douyin.com/follow"])
        try validateStatus(res.status_code, message: res.status_msg)
        let awemes = (res.data ?? []).compactMap { $0.aweme }.filter { $0.video != nil }
        let nextCursor = res.cursor ?? requestCursor
        let hasMore = res.has_more ?? (res.has_more_int == 1)
#if DEBUG
        PlaybackDiagnostics.shared.event(
            "following-response",
            category: "api",
            fields: [
                "requestCursor": requestCursor,
                "nextCursor": nextCursor,
                "entries": res.data?.count ?? 0,
                "videos": awemes.count,
                "nonVideoEntries": (res.data?.count ?? 0) - awemes.count,
                "hasMore": hasMore
            ]
        )
#endif
        return (awemes, nextCursor, hasMore)
    }

    /// 获取当前账号已喜欢的视频，只读展示，不执行点赞或取消点赞。
    func getFavorites(maxCursor: Int = 0) async throws -> ([Aweme], Int, Bool) {
        let url = "https://www.douyin.com/aweme/v1/web/aweme/favorite/?device_platform=webapp&aid=6383&channel=channel_pc_web&pc_client_type=1&max_cursor=\(maxCursor)&count=10&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32"
        let res: FavoritesResponse = try await request(url: url)
        try validateStatus(res.status_code, message: res.status_msg)
        return (res.aweme_list ?? [], res.max_cursor ?? maxCursor, res.has_more == 1)
    }

    /// 获取指定作者发布的作品。
    func getUserPosts(secUserID: String, maxCursor: Int = 0) async throws -> ([Aweme], Int, Bool) {
        guard !secUserID.isEmpty else { throw APIError.invalidURL }
        var components = URLComponents(
            string: "https://www.douyin.com/aweme/v1/web/aweme/post/"
        )
        components?.queryItems = [
            URLQueryItem(name: "device_platform", value: "webapp"),
            URLQueryItem(name: "aid", value: "6383"),
            URLQueryItem(name: "channel", value: "channel_pc_web"),
            URLQueryItem(name: "sec_user_id", value: secUserID),
            URLQueryItem(name: "max_cursor", value: String(maxCursor)),
            URLQueryItem(name: "count", value: "18"),
            URLQueryItem(name: "publish_video_strategy_type", value: "2"),
            URLQueryItem(name: "pc_client_type", value: "1"),
            URLQueryItem(name: "version_code", value: "170400"),
            URLQueryItem(name: "version_name", value: "17.4.0"),
            URLQueryItem(name: "cookie_enabled", value: "true"),
            URLQueryItem(name: "browser_language", value: "zh-CN"),
            URLQueryItem(name: "browser_platform", value: "Win32"),
            URLQueryItem(name: "browser_name", value: "Chrome"),
            URLQueryItem(name: "browser_version", value: "150.0.0.0"),
            URLQueryItem(name: "browser_online", value: "true"),
            URLQueryItem(name: "engine_name", value: "Blink"),
            URLQueryItem(name: "engine_version", value: "150.0.0.0"),
            URLQueryItem(name: "os_name", value: "Windows"),
            URLQueryItem(name: "os_version", value: "10"),
            URLQueryItem(name: "platform", value: "PC")
        ]
        guard let url = components?.url?.absoluteString else { throw APIError.invalidURL }

        let res: FavoritesResponse = try await request(
            url: url,
            extraHeaders: ["Referer": "https://www.douyin.com/user/\(secUserID)"]
        )
        try validateStatus(res.status_code, message: res.status_msg)
        let awemes = (res.aweme_list ?? []).filter { $0.video != nil }
#if DEBUG
        PlaybackDiagnostics.shared.event(
            "author-posts-response",
            category: "api",
            fields: [
                "author": String(secUserID.prefix(12)),
                "cursor": maxCursor,
                "videos": awemes.count,
                "hasMore": res.has_more == 1
            ]
        )
#endif
        return (awemes, res.max_cursor ?? maxCursor, res.has_more == 1)
    }
    
}

// MARK: - Models

struct FeedResponse: Decodable {
    let status_code: Int
    let status_msg: String?
    let aweme_list: [Aweme]?
    let has_more: Int?
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
    let statistics: Statistics?
    
    enum CodingKeys: String, CodingKey {
        case aweme_id
        case desc
        case author
        case video
        case statistics
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.aweme_id = try container.decode(String.self, forKey: .aweme_id)
        self.desc = try container.decodeIfPresent(String.self, forKey: .desc)
        self.author = try container.decodeIfPresent(Author.self, forKey: .author)
        self.video = try container.decodeIfPresent(Video.self, forKey: .video)
        self.statistics = try container.decodeIfPresent(Statistics.self, forKey: .statistics)
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
    let signature: String?
    let unique_id: String?
    let follower_count: Int?
    let aweme_count: Int?

    private enum CodingKeys: String, CodingKey {
        case sec_uid
        case sec_user_id
        case nickname
        case avatar_thumb
        case signature
        case unique_id
        case follower_count
        case aweme_count
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        sec_uid = try? container.decode(String.self, forKey: .sec_uid)
        sec_user_id = try? container.decode(String.self, forKey: .sec_user_id)
        nickname = try? container.decode(String.self, forKey: .nickname)
        avatar_thumb = try? container.decode(AvatarUrl.self, forKey: .avatar_thumb)
        signature = try? container.decode(String.self, forKey: .signature)
        unique_id = try? container.decode(String.self, forKey: .unique_id)
        follower_count = Self.decodeInt(from: container, forKey: .follower_count)
        aweme_count = Self.decodeInt(from: container, forKey: .aweme_count)
    }

    private static func decodeInt(
        from container: KeyedDecodingContainer<CodingKeys>,
        forKey key: CodingKeys
    ) -> Int? {
        if let value = try? container.decode(Int.self, forKey: key) { return value }
        if let value = try? container.decode(String.self, forKey: key) { return Int(value) }
        return nil
    }
    
    var uid: String {
        if let sec_uid, !sec_uid.isEmpty { return sec_uid }
        return sec_user_id ?? ""
    }
}

struct Statistics: Decodable {
    let digg_count: Int?
}

struct AvatarUrl: Decodable {
    let url_list: [String]?
}

struct Video: Decodable {
    let play_addr: VideoAddr?
    let play_addr_h264: VideoAddr?
    let bit_rate: [VideoBitRate]?
    let cover: AvatarUrl?
    let duration: Int?
    let width: Int?
    let height: Int?
}

struct VideoAddr: Decodable {
    let url_list: [String]?
}

struct VideoBitRate: Decodable {
    let bit_rate: Int?
    let is_h265: Int?
    let play_addr: VideoAddr?

    private enum CodingKeys: String, CodingKey {
        case bit_rate
        case is_h265
        case play_addr
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        bit_rate = try container.decodeIfPresent(Int.self, forKey: .bit_rate)
        play_addr = try container.decodeIfPresent(VideoAddr.self, forKey: .play_addr)
        if let value = try? container.decode(Int.self, forKey: .is_h265) {
            is_h265 = value
        } else if let value = try? container.decode(Bool.self, forKey: .is_h265) {
            is_h265 = value ? 1 : 0
        } else {
            is_h265 = nil
        }
    }
}

struct FavoritesResponse: Decodable {
    let status_code: Int
    let status_msg: String?
    let aweme_list: [Aweme]?
    let max_cursor: Int?
    let has_more: Int?
}
