import Foundation

// Copy HTMLParser here
struct HTMLParser {
    private let html: String
    init(_ html: String) { self.html = html }
    func select(_ selector: String) -> [HTMLElement] {
        let parts = selector.split(separator: " ").map(String.init)
        if parts.count == 1 { return findElements(in: html, matching: parts[0]) }
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
    func selectFirst(_ selector: String) -> HTMLElement? { select(selector).first }
    private func findElements(in html: String, matching selector: String) -> [HTMLElement] {
        var results: [HTMLElement] = []
        let (tag, id, classes) = parseSelector(selector)
        let tagPattern = tag.isEmpty ? "[a-zA-Z][a-zA-Z0-9]*" : NSRegularExpression.escapedPattern(for: tag)
        let openTagPattern = "<(\(tagPattern))([^>]*)>"
        guard let regex = try? NSRegularExpression(pattern: openTagPattern, options: []) else { return results }
        let nsHTML = html as NSString
        let matches = regex.matches(in: html, range: NSRange(location: 0, length: nsHTML.length))
        for match in matches {
            guard let tagNameRange = Range(match.range(at: 1), in: html),
                  let attrsRange = Range(match.range(at: 2), in: html) else { continue }
            let matchedTag = String(html[tagNameRange])
            let attrs = String(html[attrsRange])
            if !id.isEmpty { guard extractAttr("id", from: attrs) == id else { continue } }
            if !classes.isEmpty {
                let elementClasses = Set((extractAttr("class", from: attrs) ?? "").split(separator: " ").map(String.init))
                let requiredClasses = Set(classes)
                guard requiredClasses.isSubset(of: elementClasses) else { continue }
            }
            let startPos = match.range.location
            if let outerHTML = extractElement(from: nsHTML, tag: matchedTag, startAt: startPos) {
                results.append(HTMLElement(outerHTML: outerHTML))
            }
        }
        return results
    }
    private func parseSelector(_ selector: String) -> (String, String, [String]) {
        var tag = "", id = "", classes: [String] = []
        let current = selector
        if let hashIdx = current.firstIndex(of: "#") {
            let beforeHash = String(current[current.startIndex..<hashIdx])
            let afterHash = String(current[current.index(after: hashIdx)...])
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
            let parts = current.split(separator: ".", omittingEmptySubsequences: false)
            if let first = parts.first {
                if first.isEmpty {
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
    private func extractAttr(_ name: String, from attrs: String) -> String? {
        let patterns = ["\(name)\\s*=\\s*\"([^\"]*)\"", "\(name)\\s*=\\s*'([^']*)'"]
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern),
               let match = regex.firstMatch(in: attrs, range: NSRange(attrs.startIndex..., in: attrs)),
               let range = Range(match.range(at: 1), in: attrs) {
                return String(attrs[range])
            }
        }
        return nil
    }
    private func extractElement(from nsHTML: NSString, tag: String, startAt: Int) -> String? {
        let length = nsHTML.length
        guard startAt < length else { return nil }
        let openTag = "<\(tag)"
        let closeTag = "</\(tag)>"
        var pos = startAt, depth = 0, foundStart = false
        while pos < length {
            let remaining = nsHTML.substring(from: pos)
            if !foundStart {
                if remaining.hasPrefix(openTag) {
                    foundStart = true
                    depth = 1
                    if let endOfTag = remaining.range(of: ">") {
                        let tagContent = String(remaining[remaining.startIndex..<endOfTag.upperBound])
                        if tagContent.hasSuffix("/>") { return nsHTML.substring(with: NSRange(location: startAt, length: pos - startAt + tagContent.count)) }
                        pos += tagContent.count
                        continue
                    }
                }
                pos += 1; continue
            }
            if remaining.hasPrefix(closeTag) {
                depth -= 1
                if depth == 0 { return nsHTML.substring(with: NSRange(location: startAt, length: pos + closeTag.count - startAt)) }
                pos += closeTag.count; continue
            }
            if remaining.hasPrefix(openTag) {
                let afterTag = String(remaining.dropFirst(openTag.count))
                if afterTag.first == " " || afterTag.first == ">" || afterTag.first == "/" {
                    if let endOfTag = remaining.range(of: ">") {
                        let tagContent = String(remaining[remaining.startIndex..<endOfTag.upperBound])
                        if tagContent.hasSuffix("/>") { pos += tagContent.count; continue }
                    }
                    depth += 1
                }
            }
            pos += 1
        }
        return nsHTML.substring(from: startAt)
    }
}
struct HTMLElement {
    let outerHTML: String
    func text() -> String {
        outerHTML.replacingOccurrences(of: #"<[^>]+>"#, with: "", options: .regularExpression).trimmingCharacters(in: .whitespacesAndNewlines)
    }
    func html() -> String {
        guard let firstClose = outerHTML.range(of: ">"), let lastOpen = outerHTML.range(of: "</", options: .backwards) else { return outerHTML }
        return String(outerHTML[firstClose.upperBound..<lastOpen.lowerBound])
    }
    func attr(_ name: String) -> String? {
        guard let firstClose = outerHTML.range(of: ">") else { return nil }
        let openTag = String(outerHTML[outerHTML.startIndex..<firstClose.upperBound])
        let patterns = ["\(name)\\s*=\\s*\"([^\"]*)\"", "\(name)\\s*=\\s*'([^']*)'"]
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern),
               let match = regex.firstMatch(in: openTag, range: NSRange(openTag.startIndex..., in: openTag)),
               let range = Range(match.range(at: 1), in: openTag) {
                return String(openTag[range])
            }
        }
        return nil
    }
}

let v2exHtml = """
<div id="Main">
    <div class="cell item">
        <a href="/t/123" class="topic-link">V2EX Title</a>
    </div>
</div>
"""
let doc = HTMLParser(v2exHtml)
print("V2EX cells:", doc.select("#Main").first?.select(".cell.item").count ?? 0)
let chiphellHtml = """
<table id="threadlisttableid">
    <tr>
        <th><a href="thread-123.html" class="s xst">ChipHell Title</a></th>
    </tr>
</table>
"""
let doc2 = HTMLParser(chiphellHtml)
print("Chiphell links:", doc2.select("#threadlisttableid a.s.xst").count)
