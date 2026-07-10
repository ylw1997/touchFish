import Foundation

enum APIError: Error {
    case invalidURL
    case badResponse
    case httpError(statusCode: Int)
    case decodeError
}

class DouyinAPI: ObservableObject {
    static let shared = DouyinAPI()
    
    private let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    
    @Published var cookie: String = "" {
        didSet {
            UserDefaults.standard.set(cookie, forKey: "douyin_cookie")
        }
    }
    
    private init() {
        self.cookie = UserDefaults.standard.string(forKey: "douyin_cookie") ?? ""
    }
    
    private func getHeaders(extra: [String: String] = [:]) -> [String: String] {
        var headers = [
            "User-Agent": userAgent,
            "Referer": "https://www.douyin.com/",
            "Origin": "https://www.douyin.com",
            "Cookie": cookie
        ]
        for (key, val) in extra {
            headers[key] = val
        }
        return headers
    }
    
    private func request<T: Decodable>(url: String, method: String = "GET", body: Data? = nil, extraHeaders: [String: String] = [:]) async throws -> T {
        // 进行 X-Bogus 签名
        let signedUrlStr = SignatureManager.shared.sign(url: url, userAgent: userAgent)
        guard let requestUrl = URL(string: signedUrlStr) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: requestUrl)
        request.httpMethod = method
        request.httpBody = body
        request.timeoutInterval = 15.0
        request.cachePolicy = .reloadIgnoringLocalCacheData // 禁用本地缓存，保证网络请求能获取最新数据
        
        let headers = getHeaders(extra: extraHeaders)
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
    
    /// 获取推荐视频流
    func getFeed() async -> [Aweme] {
        let ts = Int(Date().timeIntervalSince1970 * 1000)
        let url = "https://www.douyin.com/aweme/v1/web/channel/feed/?device_platform=webapp&aid=6383&count=10&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32&_t=\(ts)"
        do {
            let res: FeedResponse = try await request(url: url)
            return res.aweme_list ?? []
        } catch {
            print("[DouyinAPI] Error fetching feed: \(error)")
            return []
        }
    }
    
    /// 获取关注视频流
    func getFollowing(maxCursor: Int = 0) async -> ([Aweme], Int, Bool) {
        let url = "https://www.douyin.com/aweme/v1/web/follow/feed/?device_platform=webapp&aid=6383&channel=channel_pc_web&count=10&min_cursor=0&max_cursor=\(maxCursor)&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32"
        do {
            let res: FollowingResponse = try await request(url: url, extraHeaders: ["Referer": "https://www.douyin.com/follow"])
            let awemes = (res.data ?? []).compactMap { $0.aweme }
            let nextCursor = res.cursor ?? maxCursor
            let hasMore = res.has_more ?? (res.has_more_int == 1)
            return (awemes, nextCursor, hasMore)
        } catch {
            print("[DouyinAPI] Error fetching following: \(error)")
            return ([], maxCursor, false)
        }
    }
    
    /// 获取喜欢视频列表
    func getFavorites(maxCursor: Int = 0) async -> ([Aweme], Int, Bool) {
        let url = "https://www.douyin.com/aweme/v1/web/aweme/favorite/?device_platform=webapp&aid=6383&channel=channel_pc_web&pc_client_type=1&max_cursor=\(maxCursor)&count=10&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32"
        do {
            let res: FavoritesResponse = try await request(url: url)
            let hasMore = res.has_more == 1
            return (res.aweme_list ?? [], res.max_cursor, hasMore)
        } catch {
            print("[DouyinAPI] Error fetching favorites: \(error)")
            return ([], maxCursor, false)
        }
    }
    
    /// 获取指定作者作品列表
    func getUserPosts(secUserId: String, maxCursor: Int = 0) async -> ([Aweme], Int, Bool) {
        let url = "https://www.douyin.com/aweme/v1/web/aweme/post/?device_platform=webapp&aid=6383&channel=channel_pc_web&sec_user_id=\(secUserId)&max_cursor=\(maxCursor)&count=18&publish_video_strategy_type=2&pc_client_type=1&version_code=170400&version_name=17.4.0&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32"
        do {
            let res: UserPostsResponse = try await request(url: url, extraHeaders: ["Referer": "https://www.douyin.com/user/\(secUserId)"])
            let hasMore = res.has_more == 1
            return (res.aweme_list ?? [], res.max_cursor ?? maxCursor, hasMore)
        } catch {
            print("[DouyinAPI] Error fetching user posts: \(error)")
            return ([], maxCursor, false)
        }
    }
    
    /// 获取视频评论列表
    func getComments(awemeId: String, cursor: Int = 0) async -> ([Comment], Int, Bool, Int) {
        let url = "https://www-hj.douyin.com/aweme/v1/web/comment/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&aweme_id=\(awemeId)&pc_img_format=webp&cursor=\(cursor)&count=10&item_type=0&update_version_code=170400&pc_client_type=1&pc_libra_divert=Windows&support_h265=1&support_dash=1&cpu_core_num=22&version_code=170400&version_name=17.4.0&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32"
        do {
            let res: CommentsResponse = try await request(url: url, extraHeaders: ["Referer": "https://www.douyin.com/video/\(awemeId)"])
            let hasMore = res.has_more == 1
            return (res.comments ?? [], res.cursor ?? cursor, hasMore, res.total ?? 0)
        } catch {
            print("[DouyinAPI] Error fetching comments: \(error)")
            return ([], cursor, false, 0)
        }
    }
    
    /// 点赞视频
    func likeVideo(awemeId: String, type: Int) async -> Bool {
        let baseUrl = "https://www.douyin.com/aweme/v1/web/commit/item/digg/?device_platform=webapp&aid=6383&channel=channel_pc_web&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32"
        let postDataStr = "aweme_id=\(awemeId)&type=\(type)"
        
        // 抖音点赞需要 csrf token 验证，防止 403 跨站伪造拦截
        var csrfToken = ""
        if let range = cookie.range(of: "passport_csrf_token=") {
            let start = range.upperBound
            let endStr = cookie[start...]
            if let semicolon = endStr.range(of: ";") {
                csrfToken = String(endStr[..<semicolon.lowerBound])
            } else {
                csrfToken = String(endStr)
            }
        }
        
        let extraHeaders = [
            "Referer": "https://www.douyin.com/video/\(awemeId)",
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Secsdk-Csrf-Token": csrfToken
        ]
        
        let bodyData = postDataStr.data(using: .utf8)
        let fullUrlForSign = baseUrl + "&" + postDataStr
        
        do {
            let res: DiggResponse = try await request(url: fullUrlForSign, method: "POST", body: bodyData, extraHeaders: extraHeaders)
            return res.status_code == 0
        } catch {
            print("[DouyinAPI] Error liking video: \(error)")
            return false
        }
    }
}

// MARK: - Models

struct FeedResponse: Decodable {
    let status_code: Int
    let aweme_list: [Aweme]?
}

struct FollowingResponse: Decodable {
    let status_code: Int
    let data: [FollowingItem]?
    let cursor: Int?
    let has_more: Bool?
    let has_more_int: Int?
    
    enum CodingKeys: String, CodingKey {
        case status_code
        case data
        case cursor
        case has_more
        case has_more_int = "has_more_type" // 抖音可能返回不同命名
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.status_code = try container.decode(Int.self, forKey: .status_code)
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

struct FavoritesResponse: Decodable {
    let status_code: Int
    let aweme_list: [Aweme]?
    let max_cursor: Int
    let has_more: Int
}

struct UserPostsResponse: Decodable {
    let status_code: Int
    let aweme_list: [Aweme]?
    let max_cursor: Int?
    let has_more: Int?
}

struct CommentsResponse: Decodable {
    let status_code: Int
    let comments: [Comment]?
    let total: Int?
    let cursor: Int?
    let has_more: Int?
}

struct DiggResponse: Decodable {
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
    var user_digg: Int? // 1: 喜欢, 0: 未喜欢
    
    enum CodingKeys: String, CodingKey {
        case aweme_id
        case desc
        case author
        case video
        case statistics
        case user_digg
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.aweme_id = try container.decode(String.self, forKey: .aweme_id)
        self.desc = try container.decodeIfPresent(String.self, forKey: .desc)
        self.author = try container.decodeIfPresent(Author.self, forKey: .author)
        self.video = try container.decodeIfPresent(Video.self, forKey: .video)
        self.statistics = try container.decodeIfPresent(Statistics.self, forKey: .statistics)
        
        if let intVal = try? container.decode(Int.self, forKey: .user_digg) {
            self.user_digg = intVal
        } else if let boolVal = try? container.decode(Bool.self, forKey: .user_digg) {
            self.user_digg = boolVal ? 1 : 0
        } else {
            self.user_digg = 0
        }
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
}

struct VideoAddr: Decodable {
    let url_list: [String]?
}

struct Statistics: Decodable {
    let digg_count: Int?
    let comment_count: Int?
}

struct Comment: Decodable, Identifiable {
    var id: String { cid }
    let cid: String
    let text: String?
    let create_time: Int?
    let user: CommentUser?
    let reply_comment: [Comment]?
}

struct CommentUser: Decodable {
    let nickname: String?
    let avatar_thumb: AvatarUrl?
}
