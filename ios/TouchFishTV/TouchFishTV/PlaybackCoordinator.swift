import AVFoundation
import Foundation

@MainActor
final class PlaybackCoordinator: ObservableObject {
    let player = AVPlayer()
    @Published private(set) var isTransitioning = false
    @Published private(set) var presentationOpacity = 1.0

    private(set) var generation: UInt = 0
    private var assetTask: Task<Void, Never>?
    private var currentAwemeID: String?

    func play(_ aweme: Aweme, cookie: String) {
        guard currentAwemeID != aweme.aweme_id || player.currentItem == nil else { return }

        generation &+= 1
        let requestedGeneration = generation
        assetTask?.cancel()
        isTransitioning = true
        presentationOpacity = 0.82
        player.pause()
        player.replaceCurrentItem(with: nil)
        currentAwemeID = aweme.aweme_id

        let urls = preferredURLs(for: aweme)
        guard !urls.isEmpty else {
            isTransitioning = false
            return
        }

        var headers = ["User-Agent": "Mozilla/5.0", "Referer": "https://www.douyin.com/"]
        if !cookie.isEmpty { headers["Cookie"] = cookie }

        assetTask = Task { [weak self] in
            guard let self else { return }
            for url in urls {
                guard !Task.isCancelled, requestedGeneration == generation else { return }
                do {
                    let asset = AVURLAsset(
                        url: url,
                        options: ["AVURLAssetHTTPHeaderFieldsKey": headers]
                    )
                    guard try await asset.load(.isPlayable) else { continue }
                    _ = try await asset.load(.commonMetadata)
                    guard !Task.isCancelled, requestedGeneration == generation else { return }

                    let item = AVPlayerItem(asset: asset)
                    item.externalMetadata = metadata(for: aweme)
                    player.replaceCurrentItem(with: item)
                    player.automaticallyWaitsToMinimizeStalling = true
                    player.play()
                    completeTransition(for: requestedGeneration)
                    return
                } catch {
                    continue
                }
            }

            guard requestedGeneration == generation else { return }
            isTransitioning = false
            presentationOpacity = 1
        }
    }

    func completeTransition(for requestedGeneration: UInt) {
        guard requestedGeneration == generation else { return }
        isTransitioning = false
        presentationOpacity = 1
    }

    func stop() {
        generation &+= 1
        assetTask?.cancel()
        player.pause()
        player.replaceCurrentItem(with: nil)
        currentAwemeID = nil
        isTransitioning = false
    }

    private func preferredURLs(for aweme: Aweme) -> [URL] {
        let urls = aweme.video?.play_addr?.url_list ?? []
        return urls.compactMap(URL.init(string:)).sorted {
            score($0.absoluteString) > score($1.absoluteString)
        }
    }

    private func score(_ value: String) -> Int {
        if value.contains("/aweme/v1/play/") { return 3 }
        if value.contains("douyinvod.com") { return 2 }
        return value.contains("douyin.com") ? 1 : 0
    }

    private func metadata(for aweme: Aweme) -> [AVMetadataItem] {
        [
            metadataItem(.commonIdentifierTitle, aweme.desc?.isEmpty == false ? aweme.desc! : "无标题"),
            metadataItem(.iTunesMetadataTrackSubTitle, aweme.author?.nickname?.isEmpty == false ? aweme.author!.nickname! : "未知作者")
        ]
    }

    private func metadataItem(_ identifier: AVMetadataIdentifier, _ value: String) -> AVMetadataItem {
        let item = AVMutableMetadataItem()
        item.identifier = identifier
        item.value = value as NSString
        item.extendedLanguageTag = "zh-Hans"
        return item.copy() as! AVMetadataItem
    }
}
