# Apple TV 我的喜欢媒体库 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“我的喜欢”从直接播放改为适配横竖屏封面的四列媒体库，点选后复用原生播放器连续播放。

**Architecture:** 独立 `FavoritesLibraryStore` 管理只读列表和分页，`FavoritesLibraryView` 管理网格、焦点恢复及播放器呈现。播放器与弹幕继续复用 `VideoPlayerView`，不新增 AVPlayer。

**Tech Stack:** SwiftUI、AVKit、tvOS 原生 Card ButtonStyle、AsyncImage

---

### Task 1: 建立媒体库数据与页面

**Files:**
- Create: `ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/ContentView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/DouyinAPI.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/DouyinFeedStore.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV.xcodeproj/project.pbxproj`

- [ ] 增加只读列表 Store，保留服务端顺序并按 cursor 分页。
- [ ] 构建四列原生 Card 网格，标题和作者单行省略。
- [ ] 横屏封面填满；竖屏封面完整显示并增加模糊侧边背景。
- [ ] 点选后呈现 `VideoPlayerView`，上下切换列表，返回恢复焦点。
- [ ] 删除 FeedType 的 favorites 分支，确保我的喜欢不再直接播放。
- [ ] 运行 `git diff --check` 并在 Mac tvOS 模拟器构建验证。
