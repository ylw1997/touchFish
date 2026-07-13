import Foundation

struct DanmakuService {
    private let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"

    func fetch(awemeID: String, duration: Int, start: Int, cookie: String) async throws -> [DanmakuItem] {
        let end = max(start, min(start + DanmakuWindow.lengthMilliseconds, duration))
        var components = URLComponents(string: "https://www-hj.douyin.com/aweme/v1/web/danmaku/get_v2/")!
        components.queryItems = [
            URLQueryItem(name: "device_platform", value: "webapp"),
            URLQueryItem(name: "aid", value: "6383"),
            URLQueryItem(name: "channel", value: "channel_pc_web"),
            URLQueryItem(name: "app_name", value: "aweme"),
            URLQueryItem(name: "format", value: "json"),
            URLQueryItem(name: "group_id", value: awemeID),
            URLQueryItem(name: "item_id", value: awemeID),
            URLQueryItem(name: "start_time", value: String(start)),
            URLQueryItem(name: "end_time", value: String(end)),
            URLQueryItem(name: "duration", value: String(duration)),
            URLQueryItem(name: "update_version_code", value: "170400"),
            URLQueryItem(name: "pc_client_type", value: "1"),
            URLQueryItem(name: "cookie_enabled", value: "true"),
            URLQueryItem(name: "browser_language", value: "zh-CN"),
            URLQueryItem(name: "browser_platform", value: "Win32")
        ]
        guard let url = components.url else { throw APIError.invalidURL }
        var request = URLRequest(url: url)
        request.timeoutInterval = 15
        request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        request.setValue("https://www.douyin.com/", forHTTPHeaderField: "Referer")
        request.setValue("application/json, text/plain, */*", forHTTPHeaderField: "Accept")
        request.setValue("identity", forHTTPHeaderField: "Accept-Encoding")
        if !cookie.isEmpty { request.setValue(cookie, forHTTPHeaderField: "Cookie") }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw APIError.badResponse
        }
        let payload = try JSONDecoder().decode(DanmakuResponse.self, from: data)
        guard payload.status_code == 0 else {
            throw APIError.apiError(message: "弹幕暂时不可用")
        }
        return payload.danmaku_list ?? []
    }
}
