import Foundation

/// 轻量级 HTML 解析器 (替代 SwiftSoup，无需外部依赖)
/// 提供基本的 CSS 选择器查询和文本/属性提取功能
struct HTMLParser {

    private let html: String

    init(_ html: String) {
        self.html = html
    }

    /// 通过简单 CSS 选择器查找元素 (支持 tag, .class, #id, tag.class 组合)
    func select(_ selector: String) -> [HTMLElement] {
        // 处理组合选择器: "#Main .box .cell.item"
        let parts = selector.split(separator: " ").map(String.init)

        if parts.count == 1 {
            return findElements(in: html, matching: parts[0])
        }

        // 多级选择器: 先找外层，再在结果内部找
        var currentHTML = [html]
        for part in parts {
            var results: [String] = []
            for h in currentHTML {
                let elements = findElements(in: h, matching: part)
                results.append(contentsOf: elements.map { $0.outerHTML })
            }
            currentHTML = results
        }

        return currentHTML.map { HTMLElement(outerHTML: $0) }
    }

    /// 查找并返回第一个匹配元素
    func selectFirst(_ selector: String) -> HTMLElement? {
        select(selector).first
    }

    private func findElements(in html: String, matching selector: String) -> [HTMLElement] {
        var results: [HTMLElement] = []

        // 解析选择器
        let (tag, id, classes) = parseSelector(selector)

        // 构建正则匹配开标签
        let tagPattern = tag.isEmpty ? "[a-zA-Z][a-zA-Z0-9]*" : NSRegularExpression.escapedPattern(for: tag)
        let openTagPattern = "<(\(tagPattern))([^>]*)>"
        guard let regex = try? NSRegularExpression(pattern: openTagPattern, options: []) else {
            return results
        }

        let nsHTML = html as NSString
        let matches = regex.matches(in: html, range: NSRange(location: 0, length: nsHTML.length))

        for match in matches {
            guard let tagNameRange = Range(match.range(at: 1), in: html),
                  let attrsRange = Range(match.range(at: 2), in: html) else { continue }

            let matchedTag = String(html[tagNameRange])
            let attrs = String(html[attrsRange])

            // 检查 ID
            if !id.isEmpty {
                guard extractAttr("id", from: attrs) == id else { continue }
            }

            // 检查 class
            if !classes.isEmpty {
                let elementClasses = Set(
                    (extractAttr("class", from: attrs) ?? "")
                        .split(separator: " ")
                        .map(String.init)
                )
                let requiredClasses = Set(classes)
                guard requiredClasses.isSubset(of: elementClasses) else { continue }
            }

            // 提取完整元素内容 (包含子元素)
            let startPos = match.range.location
            if let outerHTML = extractElement(from: nsHTML, tag: matchedTag, startAt: startPos) {
                results.append(HTMLElement(outerHTML: outerHTML))
            }
        }

        return results
    }

    /// 解析选择器为 (tag, id, [classes])
    private func parseSelector(_ selector: String) -> (String, String, [String]) {
        var tag = ""
        var id = ""
        var classes: [String] = []

        let current = selector

        // 提取 #id
        if let hashIdx = current.firstIndex(of: "#") {
            let beforeHash = String(current[current.startIndex..<hashIdx])
            let afterHash = String(current[current.index(after: hashIdx)...])

            // ID 可能后面跟着 .class
            let idParts = afterHash.split(separator: ".", maxSplits: 1)
            id = String(idParts[0])

            if !beforeHash.isEmpty {
                let tagParts = beforeHash.split(separator: ".")
                tag = String(tagParts[0])
                classes.append(contentsOf: tagParts.dropFirst().map(String.init))
            }

            if idParts.count > 1 {
                classes.append(contentsOf: String(idParts[1]).split(separator: ".").map(String.init))
            }
        } else {
            // 只有 tag.class1.class2 或 .class1.class2
            let parts = current.split(separator: ".", omittingEmptySubsequences: false)
            if let first = parts.first {
                if first.isEmpty {
                    // 以 . 开头，没有 tag
                    classes = parts.dropFirst().filter { !$0.isEmpty }.map(String.init)
                } else {
                    let firstStr = String(first)
                    if firstStr.first?.isLetter == true {
                        tag = firstStr
                        classes = parts.dropFirst().filter { !$0.isEmpty }.map(String.init)
                    } else {
                        classes = parts.filter { !$0.isEmpty }.map(String.init)
                    }
                }
            }
        }

        return (tag, id, classes)
    }

    /// 从属性字符串中提取指定属性值
    private func extractAttr(_ name: String, from attrs: String) -> String? {
        let patterns = [
            "\(name)\\s*=\\s*\"([^\"]*)\"",
            "\(name)\\s*=\\s*'([^']*)'",
        ]
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern),
               let match = regex.firstMatch(in: attrs, range: NSRange(attrs.startIndex..., in: attrs)),
               let range = Range(match.range(at: 1), in: attrs) {
                return String(attrs[range])
            }
        }
        return nil
    }

    /// 从 HTML 字符串中提取完整的元素（处理嵌套同名标签）
    private func extractElement(from nsHTML: NSString, tag: String, startAt: Int) -> String? {
        let length = nsHTML.length
        guard startAt < length else { return nil }

        let openTag = "<\(tag)"
        let closeTag = "</\(tag)>"
        _ = "/>"

        var pos = startAt
        var depth = 0
        var foundStart = false

        while pos < length {
            let remaining = nsHTML.substring(from: pos)

            if !foundStart {
                if remaining.hasPrefix(openTag) {
                    foundStart = true
                    depth = 1
                    // 跳过开标签
                    if let endOfTag = remaining.range(of: ">") {
                        let tagContent = String(remaining[remaining.startIndex..<endOfTag.upperBound])
                        if tagContent.hasSuffix("/>") {
                            // 自闭合标签
                            return nsHTML.substring(with: NSRange(location: startAt, length: pos - startAt + tagContent.count))
                        }
                        pos += tagContent.count
                        continue
                    }
                }
                pos += 1
                continue
            }

            // 检查闭标签
            if remaining.hasPrefix(closeTag) {
                depth -= 1
                if depth == 0 {
                    let endPos = pos + closeTag.count
                    return nsHTML.substring(with: NSRange(location: startAt, length: endPos - startAt))
                }
                pos += closeTag.count
                continue
            }

            // 检查开标签 (同名嵌套)
            if remaining.hasPrefix(openTag) {
                let afterTag = String(remaining.dropFirst(openTag.count))
                if afterTag.first == " " || afterTag.first == ">" || afterTag.first == "/" {
                    // 检查是否自闭合
                    if let endOfTag = remaining.range(of: ">") {
                        let tagContent = String(remaining[remaining.startIndex..<endOfTag.upperBound])
                        if tagContent.hasSuffix("/>") {
                            pos += tagContent.count
                            continue
                        }
                    }
                    depth += 1
                }
            }

            pos += 1
        }

        // 没找到闭标签，返回从开始到末尾
        return nsHTML.substring(from: startAt)
    }
}

/// HTML 元素封装
struct HTMLElement {
    let outerHTML: String

    /// 获取元素的文本内容（去除所有 HTML 标签）
    func text() -> String {
        outerHTML
            .replacingOccurrences(of: #"<[^>]+>"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: "&amp;", with: "&")
            .replacingOccurrences(of: "&lt;", with: "<")
            .replacingOccurrences(of: "&gt;", with: ">")
            .replacingOccurrences(of: "&quot;", with: "\"")
            .replacingOccurrences(of: "&#39;", with: "'")
            .replacingOccurrences(of: "&nbsp;", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// 获取元素的 innerHTML（去除最外层标签）
    func html() -> String {
        // 移除第一个 > 之前的内容和最后一个 </ 之后的内容
        guard let firstClose = outerHTML.range(of: ">"),
              let lastOpen = outerHTML.range(of: "</", options: .backwards) else {
            return outerHTML
        }
        return String(outerHTML[firstClose.upperBound..<lastOpen.lowerBound])
    }

    /// 获取属性值
    func attr(_ name: String) -> String? {
        // 提取开标签中的属性
        guard let firstClose = outerHTML.range(of: ">") else { return nil }
        let openTag = String(outerHTML[outerHTML.startIndex..<firstClose.upperBound])

        let patterns = [
            "\(name)\\s*=\\s*\"([^\"]*)\"",
            "\(name)\\s*=\\s*'([^']*)'",
        ]
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern),
               let match = regex.firstMatch(in: openTag, range: NSRange(openTag.startIndex..., in: openTag)),
               let range = Range(match.range(at: 1), in: openTag) {
                return String(openTag[range])
            }
        }
        return nil
    }

    /// 在当前元素内部查找子元素
    func select(_ selector: String) -> [HTMLElement] {
        HTMLParser(html()).select(selector)
    }

    func selectFirst(_ selector: String) -> HTMLElement? {
        HTMLParser(html()).selectFirst(selector)
    }
}
