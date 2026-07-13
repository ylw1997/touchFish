# Apple TV 抖音原生播放器实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除旧 tvOS 抖音页面并重建为单一 `AVPlayerViewController` 播放器，支持可靠的上下切换、原生进度控制、原生标题和顶部 25% 弹幕。

**Architecture:** SwiftUI 只负责推荐/关注入口与加载状态，播放生命周期集中到单一 `PlaybackCoordinator`。UIKit 容器嵌入 `AVPlayerViewController` 并仲裁遥控器事件，`DanmakuOverlayController` 作为不接收焦点的覆盖层同步播放时间。

**Tech Stack:** Swift 5、SwiftUI、UIKit、AVKit、AVFoundation、JavaScriptCore、URLSession、tvOS 27 SDK

---

### Task 1: 删除旧功能与悬空工程引用

**Files:**
- Delete: `ios/TouchFishTV/TouchFishTV/Views/CommentsView.swift`
- Delete: `ios/TouchFishTV/TouchFishTV/Views/AuthorWorksView.swift`
- Delete: `ios/TouchFishTV/TouchFishTV/Views/FavoritesView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV.xcodeproj/project.pbxproj`
- Modify: `ios/TouchFishTV/TouchFishTV/ContentView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/DouyinAPI.swift`

- [ ] **Step 1: 记录旧符号引用基线**

Run: `rg -n "CommentsView|AuthorWorksView|FavoritesView|getComments|getFavorites|getUserPosts" ios/TouchFishTV`

Expected: 输出旧页面、API 和 Xcode 工程引用，证明清理检查能够捕获遗留代码。

- [ ] **Step 2: 删除三个旧页面**

使用补丁删除 `CommentsView.swift`、`AuthorWorksView.swift`、`FavoritesView.swift`。

- [ ] **Step 3: 删除工程引用和旧 API**

从 `project.pbxproj` 的 `PBXBuildFile`、`PBXFileReference`、Views group 和 Sources phase 删除三个文件；从 `ContentView` 删除“我的喜欢”Tab；从 `DouyinAPI` 删除评论、喜欢、作者作品响应模型和请求方法，仅保留推荐、关注、播放及弹幕需要的模型字段。

- [ ] **Step 4: 验证旧符号已清空**

Run: `rg -n "CommentsView|AuthorWorksView|FavoritesView|getComments|getFavorites|getUserPosts" ios/TouchFishTV`

Expected: 无匹配。

- [ ] **Step 5: 提交清理**

```powershell
git add ios/TouchFishTV
git commit -m "refactor(tvos): 删除旧抖音页面与接口"
```

### Task 2: 修复完整 URL 签名

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/SignatureManager.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/DouyinAPI.swift`

- [ ] **Step 1: 建立失败检查**

Run: `rg -n "queryRange|queryString" ios/TouchFishTV/TouchFishTV/SignatureManager.swift`

Expected: 找到只截取 query 的旧实现。

- [ ] **Step 2: 将完整 URL 传入 JS**

将签名调用改为：

```swift
guard let signedValue = signFunction.call(withArguments: [url, userAgent])?.toString(),
      !signedValue.isEmpty else {
    return url
}
```

仍只在最终请求 URL 追加一个 `X-Bogus`，日志不得包含完整 URL 或签名值。

- [ ] **Step 3: 对齐已验证的请求参数**

推荐和关注接口保持与桌面 `src/api/douyin.ts` 相同的 URL 参数及 Chrome 129 User-Agent；弹幕请求不经过签名。

- [ ] **Step 4: 验证旧 query 签名路径不存在**

Run: `rg -n "queryRange|queryString" ios/TouchFishTV/TouchFishTV/SignatureManager.swift`

Expected: 无匹配。

- [ ] **Step 5: 提交签名修复**

```powershell
git add ios/TouchFishTV/TouchFishTV/SignatureManager.swift ios/TouchFishTV/TouchFishTV/DouyinAPI.swift
git commit -m "fix(tvos): 使用完整地址生成抖音签名"
```

### Task 3: 建立 Feed 状态与稳定切换边界

**Files:**
- Create: `ios/TouchFishTV/TouchFishTV/DouyinFeedStore.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV.xcodeproj/project.pbxproj`

- [ ] **Step 1: 定义可断言的索引规则**

新增纯 Swift 规则：

```swift
enum FeedNavigation {
    static func previousIndex(current: Int, count: Int) -> Int? {
        current > 0 && current < count ? current - 1 : nil
    }

    static func nextIndex(current: Int, count: Int) -> Int? {
        current >= 0 && current + 1 < count ? current + 1 : nil
    }
}
```

- [ ] **Step 2: 将加载和游标迁入 Store**

`DouyinFeedStore` 持有 `items`、`activeIndex`、`isLoading`、`hasMore`、`cursor`、`generation` 和错误。推荐列表每次追加原始返回，不去重；关注列表按 cursor 加载。

- [ ] **Step 3: 简化 SwiftUI 页面**

`DouyinFeedView` 只渲染播放器、加载状态和错误状态，把 previous/next/loadMore 交给 Store，删除旧 toast 和 `.id(activeIndex)` 强制重建播放器的做法。

- [ ] **Step 4: 静态检查索引边界**

Run: `rg -n "activeIndex [+-]=" ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift`

Expected: 页面中无直接修改索引的散落逻辑。

- [ ] **Step 5: 提交 Feed 状态层**

```powershell
git add ios/TouchFishTV
git commit -m "refactor(tvos): 集中管理抖音视频流状态"
```

### Task 4: 重建单一原生播放器

**Files:**
- Create: `ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift`
- Replace: `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV.xcodeproj/project.pbxproj`

- [ ] **Step 1: 定义切换状态机**

`PlaybackCoordinator` 只持有一个 `AVPlayer`，并提供：

```swift
func play(_ aweme: Aweme)
func stop()
func completeTransition(for generation: UInt)
var isTransitioning: Bool { get }
```

`play` 必须先增加 generation、取消旧资源任务、暂停并 `replaceCurrentItem(with: nil)`，然后再创建新 item。

- [ ] **Step 2: 设置原生 metadata**

为新 item 写入 `.commonIdentifierTitle` 和 `.iTunesMetadataTrackSubTitle`，空值分别回退为“无标题”和“未知作者”。

- [ ] **Step 3: 重建 UIKit 容器**

`VideoPlayerView` 使用一个普通容器控制器嵌入 `AVPlayerViewController`。开启 `showsPlaybackControls` 和 `transportBarIncludesTitleView`，不添加评论、作者、喜欢菜单项。

- [ ] **Step 4: 实现遥控器仲裁**

只有满足以下全部条件才消费上下键：播放器正在播放、没有切换任务、系统控制焦点未激活。左右键、播放暂停键、中心键、Menu/Back 始终调用 `super`。

- [ ] **Step 5: 连接播放结束事件**

只在通知的 item 等于当前 item 且 generation 有效时请求下一条。

- [ ] **Step 6: 检查多播放器风险**

Run: `rg -n "AVPlayer\(" ios/TouchFishTV/TouchFishTV`

Expected: 只有 `PlaybackCoordinator` 创建 `AVPlayer`。

- [ ] **Step 7: 提交播放器重构**

```powershell
git add ios/TouchFishTV
git commit -m "feat(tvos): 重建原生单播放器交互"
```

### Task 5: 接入顶部 25% 弹幕

**Files:**
- Create: `ios/TouchFishTV/TouchFishTV/DanmakuModels.swift`
- Create: `ios/TouchFishTV/TouchFishTV/DanmakuService.swift`
- Create: `ios/TouchFishTV/TouchFishTV/DanmakuOverlayController.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/DouyinAPI.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV.xcodeproj/project.pbxproj`

- [ ] **Step 1: 定义窗口计算**

```swift
enum DanmakuWindow {
    static let lengthMilliseconds = 32_000
    static func start(for seconds: Double) -> Int {
        max(0, Int(seconds * 1000) / lengthMilliseconds * lengthMilliseconds)
    }
}
```

- [ ] **Step 2: 实现无签名弹幕请求**

请求 `/aweme/v1/web/danmaku/get_v2/`，传入 `group_id`、`item_id`、`start_time`、`end_time` 和 `duration`。使用 Cookie 和浏览器请求头，但不调用 `SignatureManager`。

- [ ] **Step 3: 建立覆盖层**

覆盖层约束到 `contentOverlayView` 顶部，宽度占满，高度为父视图 `0.25`；`isUserInteractionEnabled = false`，不参与焦点。

- [ ] **Step 4: 实现轨道与文字样式**

使用白色 88% 不透明文字、细黑描边、轻阴影、系统字体。依据区域高度计算轨道数，超长单行尾部省略，同轨按剩余距离避免追尾。

- [ ] **Step 5: 同步播放时间**

使用周期 time observer 驱动弹幕；暂停时停止 layer 时间，恢复时继续；seek 后清屏并重建当前窗口；视频切换时取消请求并清空全部 layer。

- [ ] **Step 6: 验证 25% 约束和窗口常量**

Run: `rg -n "multiplier: 0\.25|lengthMilliseconds = 32_000" ios/TouchFishTV/TouchFishTV`

Expected: 两项均有匹配。

- [ ] **Step 7: 提交弹幕功能**

```powershell
git add ios/TouchFishTV
git commit -m "feat(tvos): 添加原生播放器弹幕覆盖层"
```

### Task 6: 精致化状态界面并完成验证

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/ContentView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/SettingsView.swift`

- [ ] **Step 1: 统一 Apple TV 状态视觉**

加载使用居中 `ProgressView`；空状态和错误状态使用 SF Symbol、系统标题、次级说明和原生重试按钮。保持纯黑背景、宽松留白，不增加自绘播放控件。

- [ ] **Step 2: 添加克制切换动画**

新 item ready 后只对视频容器应用约 `0.18` 秒 opacity 过渡，不使用滑页或缩放。

- [ ] **Step 3: 完成静态清理检查**

Run: `rg -n "CommentsView|AuthorWorksView|FavoritesView|transportBarCustomMenuItems|heart.fill" ios/TouchFishTV`

Expected: 无旧功能匹配。

- [ ] **Step 4: 完成工程一致性检查**

Run: `git diff --check`

Expected: exit 0。

Run on Mac: `xcodebuild -project ios/TouchFishTV/TouchFishTV.xcodeproj -scheme TouchFishTV -sdk appletvsimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build`

Expected: `** BUILD SUCCEEDED **`。

- [ ] **Step 5: tvOS 模拟器人工验收**

依次验证：播放时上下切换；上一条声音立即停止；暂停并唤起控件后上下只移动焦点；左右操作原生进度；标题作者显示在原生标题区；弹幕仅在顶部 25%；暂停、seek、切换后弹幕同步正确。

- [ ] **Step 6: 提交视觉与清理**

```powershell
git add ios/TouchFishTV
git commit -m "style(tvos): 完善原生播放器状态视觉"
```
