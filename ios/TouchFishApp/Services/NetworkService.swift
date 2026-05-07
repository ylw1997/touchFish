import Foundation

/// 平台服务协议 — 每个平台实现列表获取和详情获取
protocol PlatformServiceProtocol {
    func fetchNewsList(tab: String?) async throws -> [NewsItem]
    func fetchDetail(url: String) async throws -> String
}

/// 通用网络请求服务
class NetworkService {
    static let shared = NetworkService()

    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        config.httpAdditionalHeaders = [
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        ]
        session = URLSession(configuration: config)
    }

    /// 获取字符串内容
    func fetchString(from url: URL, headers: [String: String]? = nil, encoding: String.Encoding = .utf8) async throws -> String {
        var request = URLRequest(url: url)
        headers?.forEach { request.setValue($1, forHTTPHeaderField: $0) }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        guard (200...499).contains(httpResponse.statusCode) else {
            throw NetworkError.httpError(httpResponse.statusCode)
        }

        if httpResponse.statusCode == 403 || httpResponse.statusCode == 401 {
            throw NetworkError.unauthorized
        }

        guard let string = String(data: data, encoding: encoding) else {
            // 尝试 GBK 编码 (NGA 使用 GBK)
            let cfEncoding = CFStringConvertEncodingToNSStringEncoding(
                CFStringEncoding(CFStringEncodings.GB_18030_2000.rawValue)
            )
            let gbkEncoding = String.Encoding(rawValue: cfEncoding)
            guard let gbkString = String(data: data, encoding: gbkEncoding) else {
                throw NetworkError.decodingFailed
            }
            return gbkString
        }

        return string
    }

    /// 获取原始数据
    func fetchData(from url: URL, headers: [String: String]? = nil) async throws -> Data {
        var request = URLRequest(url: url)
        headers?.forEach { request.setValue($1, forHTTPHeaderField: $0) }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...499).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }

        return data
    }

    /// 获取 JSON 并解码
    func fetchJSON<T: Decodable>(from url: URL, headers: [String: String]? = nil) async throws -> T {
        let data = try await fetchData(from: url, headers: headers)
        return try JSONDecoder().decode(T.self, from: data)
    }
}

enum NetworkError: LocalizedError {
    case invalidResponse
    case httpError(Int)
    case unauthorized
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "无效的服务器响应"
        case .httpError(let code): return "HTTP 错误: \(code)"
        case .unauthorized: return "认证失败，请检查 Cookie 配置"
        case .decodingFailed: return "数据解码失败"
        }
    }
}
