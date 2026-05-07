import SwiftUI

/// 所有支持的平台
enum Platform: String, CaseIterable, Identifiable, Codable {
    case ithome
    case chiphell
    case v2ex
    case hupu
    case nga
    case linuxdo

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .ithome: return "IT之家"
        case .chiphell: return "ChipHell"
        case .v2ex: return "V2EX"
        case .hupu: return "虎扑步行街"
        case .nga: return "NGA"
        case .linuxdo: return "Linux.do"
        }
    }

    var icon: String {
        switch self {
        case .ithome: return "newspaper.fill"
        case .chiphell: return "cpu.fill"
        case .v2ex: return "bubble.left.and.bubble.right.fill"
        case .hupu: return "sportscourt.fill"
        case .nga: return "gamecontroller.fill"
        case .linuxdo: return "terminal.fill"
        }
    }

    var accentColor: Color {
        switch self {
        case .ithome: return Color(red: 0.85, green: 0.18, blue: 0.15)
        case .chiphell: return Color(red: 0.20, green: 0.45, blue: 0.80)
        case .v2ex: return Color(red: 0.30, green: 0.30, blue: 0.32)
        case .hupu: return Color(red: 0.90, green: 0.55, blue: 0.10)
        case .nga: return Color(red: 0.25, green: 0.65, blue: 0.35)
        case .linuxdo: return Color(red: 0.55, green: 0.30, blue: 0.80)
        }
    }

    var requiresCookie: Bool {
        switch self {
        case .nga, .linuxdo: return true
        default: return false
        }
    }

    var defaultTab: String? {
        switch self {
        case .v2ex: return "all"
        case .hupu: return "all-gambia"
        case .nga: return "-7"
        case .linuxdo: return "latest"
        default: return nil
        }
    }

    var tabs: [TabOption] {
        switch self {
        case .v2ex:
            return [
                TabOption(id: "all", name: "全部"),
                TabOption(id: "tech", name: "技术"),
                TabOption(id: "creative", name: "创意"),
                TabOption(id: "play", name: "好玩"),
                TabOption(id: "apple", name: "Apple"),
                TabOption(id: "jobs", name: "酷工作"),
                TabOption(id: "deals", name: "交易"),
                TabOption(id: "city", name: "城市"),
                TabOption(id: "qna", name: "问与答"),
                TabOption(id: "hot", name: "最热"),
            ]
        case .hupu:
            return [
                TabOption(id: "all-gambia", name: "步行街热帖"),
                TabOption(id: "topic-daily", name: "步行街主干道"),
                TabOption(id: "stock", name: "股票区"),
                TabOption(id: "history", name: "历史区"),
                TabOption(id: "fit", name: "健身区"),
                TabOption(id: "love", name: "恋爱区"),
                TabOption(id: "school", name: "校园区"),
                TabOption(id: "workplace", name: "职场区"),
            ]
        case .nga:
            return [
                TabOption(id: "-7", name: "网事杂谈"),
                TabOption(id: "-7955747", name: "晴风村"),
                TabOption(id: "-343809", name: "寂寞的车"),
                TabOption(id: "-81981", name: "生命之杯"),
                TabOption(id: "524", name: "漩涡书院"),
                TabOption(id: "843", name: "国际新闻"),
                TabOption(id: "706", name: "股票大时代"),
                TabOption(id: "-576177", name: "音乐影视"),
                TabOption(id: "-39223361", name: "娱乐吃瓜"),
                TabOption(id: "436", name: "消费电子"),
                TabOption(id: "-202020", name: "程序员职业交流"),
            ]
        case .linuxdo:
            return [
                TabOption(id: "latest", name: "最新"),
                TabOption(id: "hot", name: "热门"),
                TabOption(id: "top", name: "排行榜"),
            ]
        default:
            return []
        }
    }
}
