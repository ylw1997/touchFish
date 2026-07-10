# tvOS 抖音遥控切换 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在控制栏隐藏时通过遥控器上下键一步切换视频，并保证快速连续切换时始终只有当前视频播放，同时清理播放链路中的无效参数、全局通知和失效功能。

**Architecture:** `DouyinFeedView` 继续作为 `activeIndex` 的唯一所有者，通过闭包将上一个/下一个操作传给播放器。`PlayerManager` 复用唯一的 `AVQueuePlayer`，每次切换先彻底拆除旧循环和播放项，再装载目标视频；`RemotePlayerViewController` 只在原生控件没有获得焦点时拦截上下键。

**Tech Stack:** Swift 5、SwiftUI、UIKit、AVKit、tvOS 16+

---

## 文件结构

- 修改 `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift`
  - 稳定的单播放器生命周期；
  - 遥控器方向键处理；
  - 原生功能菜单；
  - 删除无效播放器参数和失效“主页”状态。
- 修改 `ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift`
  - 用直接闭包替代全局通知；
  - 集中处理索引边界和预加载。
- 修改 `ios/TouchFishTV/TouchFishTV/Views/FavoritesView.swift`
  - 适配精简后的播放器参数。
- 修改 `ios/TouchFishTV/TouchFishTV/Views/AuthorWorksView.swift`
  - 适配精简后的播放器参数。

本次不新增测试 target。工程当前没有测试基础设施，而核心遥控焦点行为必须在 tvOS 模拟器或真机验证；为避免引入与功能不成比例的 Xcode 工程改造，采用编译检查、代码搜索和逐项人工回归。

### Task 1: 收口 Feed 索引切换入口

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift:39-62`

- [ ] **Step 1: 记录改造前的全局通知依赖**

Run:

```powershell
rg -n "requestScrollToNext|requestScrollToPrevious|NotificationCenter" ios/TouchFishTV/TouchFishTV/Views
```

Expected: `DouyinFeedView.swift` 包含两个订阅，`VideoPlayerView.swift` 包含两个发送点。

- [ ] **Step 2: 将播放器调用改为明确回调**

将 Feed 中播放器调用替换为：

```swift
VideoPlayerView(
    aweme: list[activeIndex],
    onPrevious: playPrevious,
    onNext: playNext
)
.ignoresSafeArea()
```

- [ ] **Step 3: 添加唯一的索引切换方法**

在 `DouyinFeedView` 中添加：

```swift
private func playPrevious() {
    guard activeIndex > list.startIndex else { return }
    activeIndex -= 1
}

private func playNext() {
    guard activeIndex + 1 < list.count else { return }
    activeIndex += 1
    checkPreload()
}
```

`playPrevious()` 和 `playNext()` 必须是所有遥控器及菜单入口最终调用的方法，不允许其他位置直接增减索引。

- [ ] **Step 4: 搜索确认 Feed 不再订阅全局切换通知**

Run:

```powershell
rg -n "onReceive|requestScrollToNext|requestScrollToPrevious" ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift
```

Expected: 无匹配。

- [ ] **Step 5: 提交索引入口改造**

```powershell
git add ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift
git commit -m "refactor: 收口抖音视频切换入口"
```

### Task 2: 将播放器改为稳定的单实例生命周期

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift:4-57`

- [ ] **Step 1: 将可选播放器改为稳定实例**

将 `PlayerManager` 的播放器和切换状态定义为：

```swift
@MainActor
final class PlayerManager: ObservableObject {
    let player = AVQueuePlayer()

    private var playerLooper: AVPlayerLooper?
    private var currentAwemeId: String?
    private var playbackGeneration: UInt = 0
}
```

不再发布或替换 `player` 对象，避免 SwiftUI 更新期间旧控制器仍持有旧播放器。

- [ ] **Step 2: 用固定顺序实现播放项切换**

将 `setup(aweme:)` 实现为：

```swift
func setup(aweme: Aweme) {
    if currentAwemeId == aweme.aweme_id, !player.items().isEmpty {
        player.play()
        return
    }

    playbackGeneration &+= 1
    let generation = playbackGeneration
    stopCurrentItem()
    currentAwemeId = aweme.aweme_id

    guard
        let urlString = aweme.video?.play_addr?.url_list?.first,
        let url = URL(string: urlString)
    else {
        currentAwemeId = nil
        return
    }

    let headers = [
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.douyin.com/"
    ]
    let asset = AVURLAsset(
        url: url,
        options: ["AVURLAssetHTTPHeaderFieldsKey": headers]
    )
    let item = AVPlayerItem(asset: asset)

    guard generation == playbackGeneration else { return }

    playerLooper = AVPlayerLooper(player: player, templateItem: item)
    player.automaticallyWaitsToMinimizeStalling = true
    player.play()
}
```

- [ ] **Step 3: 集中实现停止与销毁**

添加并使用：

```swift
private func stopCurrentItem() {
    player.pause()
    playerLooper?.disableLooping()
    playerLooper = nil
    player.removeAllItems()
}

func cleanup() {
    playbackGeneration &+= 1
    stopCurrentItem()
    currentAwemeId = nil
}
```

切换视频、页面退出和对象销毁都必须经过这条清理路径。

- [ ] **Step 4: 删除不再需要的播放器可选状态分支**

`VideoPlayerView.body` 直接把 `manager.player` 交给原生播放器，不再使用 `if let player` 和因播放器为 `nil` 显示的分支。缓冲状态由原生 `AVPlayerViewController` 负责呈现。

- [ ] **Step 5: 静态检查不会创建第二个 AVQueuePlayer**

Run:

```powershell
rg -n "AVQueuePlayer\(" ios/TouchFishTV/TouchFishTV/Views
```

Expected: 只有 `PlayerManager` 中的稳定播放器初始化一处匹配。

- [ ] **Step 6: 提交单播放器改造**

```powershell
git add ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift
git commit -m "fix: 保证视频切换时旧播放项停止"
```

### Task 3: 增加遥控器一步切换并保留原生焦点行为

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift:60-195`

- [ ] **Step 1: 添加遥控器感知的播放器控制器**

在 `NativeAVPlayerView` 前添加：

```swift
final class RemotePlayerViewController: AVPlayerViewController {
    var onPrevious: (() -> Void)?
    var onNext: (() -> Void)?

    override func pressesBegan(
        _ presses: Set<UIPress>,
        with event: UIPressesEvent?
    ) {
        guard !isPlaybackControlFocused else {
            super.pressesBegan(presses, with: event)
            return
        }

        var unhandledPresses = presses
        for press in presses {
            switch press.type {
            case .upArrow:
                onPrevious?()
                unhandledPresses.remove(press)
            case .downArrow:
                onNext?()
                unhandledPresses.remove(press)
            default:
                break
            }
        }

        if !unhandledPresses.isEmpty {
            super.pressesBegan(unhandledPresses, with: event)
        }
    }

    private var isPlaybackControlFocused: Bool {
        guard var focusedView = UIFocusSystem.focusSystem(for: view)?.focusedItem as? UIView else {
            return false
        }

        while focusedView !== view {
            if focusedView is UIControl
                || focusedView.accessibilityTraits.contains(.button)
                || focusedView.accessibilityTraits.contains(.adjustable) {
                return true
            }
            guard let superview = focusedView.superview else { break }
            focusedView = superview
        }
        return false
    }
}
```

该实现只依据焦点语义判断，不读取控件尺寸，也不依赖 AVKit 私有类名。

- [ ] **Step 2: 给播放器视图增加直接回调**

`VideoPlayerView` 增加带默认值的可选回调，使收藏和作者作品页可以继续只播放单条视频：

```swift
var onPrevious: (() -> Void)? = nil
var onNext: (() -> Void)? = nil
```

`NativeAVPlayerView` 使用没有默认值的 `let onPrevious: (() -> Void)?` 和 `let onNext: (() -> Void)?`，由外层明确传入。`makeUIViewController` 返回 `RemotePlayerViewController`，并在 `makeUIViewController` 与 `updateUIViewController` 中同步设置两个回调，避免 SwiftUI 更新后控制器持有过期闭包。

- [ ] **Step 3: 功能菜单复用同一回调**

只有对应回调存在时才加入菜单项：

```swift
var menuItems: [UIMenuElement] = []

if let onPrevious {
    menuItems.append(UIAction(
        title: "上一个视频",
        image: UIImage(systemName: "backward.end.fill")
    ) { _ in onPrevious() })
}

if let onNext {
    menuItems.append(UIAction(
        title: "下一个视频",
        image: UIImage(systemName: "forward.end.fill")
    ) { _ in onNext() })
}
```

随后追加仍有效的“喜欢”和“评论”菜单项。不得再发布 `NotificationCenter` 通知。

- [ ] **Step 4: 检查方向键只存在一个处理通道**

Run:

```powershell
rg -n "pressesBegan|UISwipeGestureRecognizer|onMoveCommand|requestScrollTo" ios/TouchFishTV/TouchFishTV
```

Expected: 只有 `RemotePlayerViewController.pressesBegan` 处理方向键；没有滑动识别器和旧通知名称。

- [ ] **Step 5: 提交遥控器交互**

```powershell
git add ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift
git commit -m "feat: 支持遥控器上下键切换视频"
```

### Task 4: 清理播放器遗留接口和失效代码

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift:59-151`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/FavoritesView.swift:68-79`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/AuthorWorksView.swift:108-119`

- [ ] **Step 1: 删除未使用参数和状态**

从 `VideoPlayerView` 删除：

```swift
let playlist: [Aweme]
var isModal: Bool
let onClose: () -> Void
var isActive: Bool
@EnvironmentObject var api: DouyinAPI
@State private var showAuthorWorks: Bool
```

同时删除 `isActive` 对应的封面分支、`onChange(of: isActive)` 和无效“主页”菜单项。保留真正使用的 `aweme`、喜欢状态、评论状态以及上下切换回调。

- [ ] **Step 2: 统一页面生命周期**

`VideoPlayerView` 使用：

```swift
.onAppear {
    manager.setup(aweme: aweme)
}
.onChange(of: aweme.aweme_id) { _ in
    manager.setup(aweme: aweme)
}
.onDisappear {
    manager.cleanup()
}
```

页面离开时必须清空播放项，不只暂停，防止 Tab、全屏页面或弹层销毁时残留声音。

- [ ] **Step 3: 更新收藏和作者作品调用点**

两个全屏播放器只传当前视频：

```swift
VideoPlayerView(aweme: aweme)
```

`fullScreenCover(item:)` 自身负责系统返回与 dismiss，不再传入没有被调用的 `onClose`。

- [ ] **Step 4: 搜索确认遗留接口全部清除**

Run:

```powershell
rg -n "playlist:|isModal:|onClose:|isActive:|showAuthorWorks|requestScrollTo" ios/TouchFishTV/TouchFishTV/Views
```

Expected: `VideoPlayerView` 调用链无匹配；`AuthorWorksView` 自身用于关闭作者页的 `onClose` 可以保留。

- [ ] **Step 5: 提交遗留代码清理**

```powershell
git add ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift ios/TouchFishTV/TouchFishTV/Views/FavoritesView.swift ios/TouchFishTV/TouchFishTV/Views/AuthorWorksView.swift
git commit -m "refactor: 清理 tvOS 播放器遗留代码"
```

### Task 5: 编译与遥控器回归验证

**Files:**
- Verify: `ios/TouchFishTV/TouchFishTV.xcodeproj`

- [ ] **Step 1: 做仓库级静态检查**

Run:

```powershell
git diff --check
rg -n "requestScrollTo|UISwipeGestureRecognizer|playlist: list|isModal:|showAuthorWorks" ios/TouchFishTV/TouchFishTV
```

Expected: `git diff --check` 无输出；代码搜索无匹配。

- [ ] **Step 2: 在 macOS 上执行 tvOS 编译**

Run:

```bash
xcodebuild -project ios/TouchFishTV/TouchFishTV.xcodeproj -scheme TouchFishTV -sdk appletvsimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build
```

Expected: `** BUILD SUCCEEDED **`。

- [ ] **Step 3: 在 tvOS 模拟器或真机逐项验证**

1. 播放控制栏隐藏时按下键，立即切到下一条；旧视频声音马上停止。
2. 按上键回到上一条，视频顺序正确。
3. 连续快速按三次下键，只播放最终选中的视频且没有重叠声音。
4. 第一条按上键不跳转，最后一条暂无新数据时按下键不越界。
5. 唤出原生控制栏并聚焦按钮或进度条，上下键由系统控制焦点。
6. 暂停、播放、快进、快退、返回、喜欢、评论和功能菜单正常。
7. 从推荐/关注切到其他 Tab，离开页面后没有视频声音残留。

- [ ] **Step 4: 查看最终改动和工作树**

Run:

```powershell
git diff --stat HEAD~4..HEAD
git status --short
```

Expected: 只包含计划中的四个 Swift 文件；工作树为空。

- [ ] **Step 5: 提交验证阶段产生的必要修正**

仅当验证阶段产生修正时执行：

```powershell
git add ios/TouchFishTV/TouchFishTV/Views
git commit -m "fix: 修正 tvOS 遥控切换回归问题"
```
