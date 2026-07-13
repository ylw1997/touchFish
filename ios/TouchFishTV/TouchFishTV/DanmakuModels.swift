import Foundation

struct DanmakuResponse: Decodable {
    let status_code: Int
    let danmaku_list: [DanmakuItem]?
    let total: Int?
}

struct DanmakuItem: Decodable, Identifiable {
    var id: String { danmaku_id }
    let danmaku_id: String
    let offset_time: Int
    let text: String
}

enum DanmakuWindow {
    static let lengthMilliseconds = 32_000

    static func start(for seconds: Double) -> Int {
        max(0, Int(seconds * 1000) / lengthMilliseconds * lengthMilliseconds)
    }
}
