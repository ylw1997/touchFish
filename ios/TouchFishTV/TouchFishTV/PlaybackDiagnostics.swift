import Darwin
import Foundation

#if DEBUG
final class PlaybackDiagnostics: @unchecked Sendable {
    static let shared = PlaybackDiagnostics()
    static let maximumFileSize = 2 * 1024 * 1024

    let sessionID = String(UUID().uuidString.prefix(6))

    private let queue = DispatchQueue(label: "com.touchfish.tv.playback-diagnostics", qos: .utility)
    private let fileURL: URL
    private let formatter: ISO8601DateFormatter

    private init() {
        // tvOS 的 Documents 在部分模拟器/设备环境中不可写；诊断日志属于缓存，
        // 放到 Caches 才符合平台目录语义，也不会触发反复的权限错误。
        let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        fileURL = caches.appendingPathComponent("playback-diagnostics.log")
        formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        event(
            "start",
            category: "session",
            fields: [
                "process": ProcessInfo.processInfo.processName,
                "system": ProcessInfo.processInfo.operatingSystemVersionString
            ]
        )
    }

    func event(
        _ name: String,
        category: String,
        fields: [String: CustomStringConvertible] = [:]
    ) {
        let safeName = sanitize(name)
        let safeCategory = sanitize(category)
        let safeFields = fields.mapValues { sanitize($0.description) }
        queue.async { [self] in
            var components = [
                "[PlaybackDiagnostics]",
                "time=\(formatter.string(from: Date()))",
                "session=\(sessionID)",
                "category=\(safeCategory)",
                "event=\(safeName)"
            ]
            components.append(contentsOf: safeFields.keys.sorted().map { "\($0)=\(safeFields[$0]!)" })
            let line = components.joined(separator: " ") + "\n"
            print(line, terminator: "")
            append(line)
        }
    }

    func residentMemoryMegabytes() -> Double? {
        var info = task_vm_info_data_t()
        var count = mach_msg_type_number_t(
            MemoryLayout<task_vm_info_data_t>.size / MemoryLayout<natural_t>.size
        )
        let result = withUnsafeMutablePointer(to: &info) { infoPointer in
            infoPointer.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { integerPointer in
                task_info(
                    mach_task_self_,
                    task_flavor_t(TASK_VM_INFO),
                    integerPointer,
                    &count
                )
            }
        }
        guard result == KERN_SUCCESS else { return nil }
        return Double(info.phys_footprint) / 1_048_576
    }

    private func append(_ line: String) {
        guard let lineData = line.data(using: .utf8) else { return }
        do {
            try FileManager.default.createDirectory(
                at: fileURL.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            let currentSize = fileSize()
            if currentSize + UInt64(lineData.count) > UInt64(Self.maximumFileSize) {
                try truncateAndAppend(lineData)
                return
            }

            if !FileManager.default.fileExists(atPath: fileURL.path) {
                try lineData.write(to: fileURL, options: .atomic)
                return
            }

            let handle = try FileHandle(forWritingTo: fileURL)
            try handle.seekToEnd()
            try handle.write(contentsOf: lineData)
            try handle.close()
        } catch {
            print("[PlaybackDiagnostics] category=logger event=write-failed error=\(sanitize(error.localizedDescription))")
        }
    }

    private func truncateAndAppend(_ lineData: Data) throws {
        let existing = (try? Data(contentsOf: fileURL)) ?? Data()
        let retained = Data(existing.suffix(Self.maximumFileSize / 2))
        let marker = "[PlaybackDiagnostics] session=\(sessionID) category=logger event=log-truncated\n"
        var replacement = Data(marker.utf8)
        replacement.append(retained)
        replacement.append(lineData)
        try replacement.write(to: fileURL, options: .atomic)
    }

    private func fileSize() -> UInt64 {
        let attributes = try? FileManager.default.attributesOfItem(atPath: fileURL.path)
        return (attributes?[.size] as? NSNumber)?.uint64Value ?? 0
    }

    private func sanitize(_ value: String) -> String {
        value
            .replacingOccurrences(of: "\r", with: " ")
            .replacingOccurrences(of: "\n", with: " ")
            .replacingOccurrences(of: " ", with: "_")
    }
}
#else
final class PlaybackDiagnostics: @unchecked Sendable {
    static let shared = PlaybackDiagnostics()
    static let maximumFileSize = 2 * 1024 * 1024
    let sessionID = "release"

    private init() {}

    func event(
        _ name: String,
        category: String,
        fields: [String: CustomStringConvertible] = [:]
    ) {}

    func residentMemoryMegabytes() -> Double? { nil }
}
#endif
