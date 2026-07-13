# tvOS Single Active Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 保证 tvOS 抖音模块任意时刻只有当前标签页挂载一个活动播放器，避免后台播放器互相暂停和内存持续累积。

**Architecture:** `ContentView` 维护原生 `TabView` 的显式 selection，并持有唯一根级 `PlaybackCoordinator`。各页面保留 Feed 数据状态，但仅在活动标签中挂载 `VideoPlayerView`；播放器视图通过 Environment 共享全局播放器，并使用来源加 UUID 的所有权租约避免异步生命周期竞态。

**Tech Stack:** SwiftUI、AVKit、tvOS、PowerShell 静态回归脚本

---

### Task 1: 建立单活动标签生命周期约束

**Files:**
- Modify: `scripts/verify-tvos-douyin.ps1`
- Modify: `ios/TouchFishTV/TouchFishTV/ContentView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift`

- [ ] **Step 1: 写入失败的回归检查**

在 `$checks` 中增加以下检查：

```powershell
@{ Path = 'ios/TouchFishTV/TouchFishTV/ContentView.swift'; Pattern = 'TabView\(selection:\s*\$selectedTab\)'; Description = 'selected native tab lifecycle' },
@{ Path = 'ios/TouchFishTV/TouchFishTV/ContentView.swift'; Pattern = 'DouyinFeedView\(feedType:\s*\.recommend,\s*isActive:\s*selectedTab\s*==\s*\.recommend\)'; Description = 'recommend feed active state' },
@{ Path = 'ios/TouchFishTV/TouchFishTV/ContentView.swift'; Pattern = 'DouyinFeedView\(feedType:\s*\.following,\s*isActive:\s*selectedTab\s*==\s*\.following\)'; Description = 'following feed active state' },
@{ Path = 'ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift'; Pattern = 'if\s+isActive,\s*let\s+aweme\s*=\s*store\.activeItem'; Description = 'active-only player mounting' },
```

- [ ] **Step 2: 运行检查并确认按预期失败**

Run: `powershell -ExecutionPolicy Bypass -File scripts/verify-tvos-douyin.ps1`

Expected: FAIL，并列出 `selected native tab lifecycle`、两个 Feed active state 和 `active-only player mounting`。

- [ ] **Step 3: 给原生 TabView 增加显式 selection**

将 `ContentView.swift` 改为：

```swift
import SwiftUI

private enum DouyinTab: Hashable {
    case recommend
    case following
    case favorites
    case settings
}

struct ContentView: View {
    @State private var selectedTab: DouyinTab = .recommend

    var body: some View {
        TabView(selection: $selectedTab) {
            DouyinFeedView(feedType: .recommend, isActive: selectedTab == .recommend)
                .tabItem { Label("推荐", systemImage: "sparkles") }
                .tag(DouyinTab.recommend)

            DouyinFeedView(feedType: .following, isActive: selectedTab == .following)
                .tabItem { Label("关注", systemImage: "person.2.fill") }
                .tag(DouyinTab.following)

            FavoritesLibraryView()
                .tabItem { Label("我的喜欢", systemImage: "heart.fill") }
                .tag(DouyinTab.favorites)

            SettingsView()
                .tabItem { Label("设置", systemImage: "gearshape.fill") }
                .tag(DouyinTab.settings)
        }
    }
}
```

- [ ] **Step 4: 仅在活动 Feed 中挂载播放器**

在 `DouyinFeedView` 增加 `isActive`，并收紧播放器条件：

```swift
private let isActive: Bool

init(feedType: FeedType, isActive: Bool) {
    self.isActive = isActive
    _store = StateObject(wrappedValue: DouyinFeedStore(feedType: feedType))
}
```

```swift
if isActive, let aweme = store.activeItem {
    VideoPlayerView(/* 保留现有参数 */)
} else if store.isLoading {
    loadingView
} else if store.activeItem == nil {
    emptyView
}
```

非活动但已有数据时只保留黑色背景，不创建第二个 `PlaybackCoordinator`。

- [ ] **Step 5: 运行回归检查并确认通过**

Run: `powershell -ExecutionPolicy Bypass -File scripts/verify-tvos-douyin.ps1`

Expected: `tvOS Douyin regression checks passed.`

- [ ] **Step 6: 检查差异格式**

Run: `git diff --check`

Expected: exit code 0。

- [ ] **Step 7: 提交实现**

```bash
git add ios/TouchFishTV/TouchFishTV/ContentView.swift ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift scripts/verify-tvos-douyin.ps1 docs/superpowers/plans/2026-07-13-tvos-single-active-player.md
git commit -m "fix(tvos): 限制为单活动播放器"
```

### Task 2: Mac 模拟器行为验证

**Files:**
- Verify only: `ios/TouchFishTV/TouchFishTV`

- [ ] **Step 1: 拉取并启动 tvOS 模拟器版本**

Run on Mac: `git pull touchFish atv`

Expected: 项目编译并进入推荐页，视频自动播放。

- [ ] **Step 2: 验证标签生命周期**

依次进入推荐、关注、我的喜欢、设置，再返回推荐。

Expected: Xcode 控制台中同一时刻只有当前页面的一组 `PlaybackDiagnostics` 持续输出；离开页面后旧 generation 停止输出。

- [ ] **Step 3: 验证持续播放内存**

在推荐页连续向下切换至少 20 条视频，并观察 Xcode Memory gauge。

Expected: 播放器仍正常推进；内存允许随解码升降并进入平台期，不应随着每次切换持续单调增长。

### Task 3: 收紧“我的喜欢”播放器生命周期

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/ContentView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift`
- Modify: `scripts/verify-tvos-douyin.ps1`

- [x] **Step 1: 用失败检查覆盖喜欢标签活动状态、离开标签关闭详情和播放时卸载网格**
- [x] **Step 2: 将 `isActive` 传入 `FavoritesLibraryView`**
- [x] **Step 3: 非活动标签关闭详情，播放期间卸载封面网格**
- [x] **Step 4: 运行回归检查与 `git diff --check`**

### Task 4: 收敛为全局单播放器

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/ContentView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift`
- Modify: `scripts/verify-tvos-douyin.ps1`

- [x] **Step 1: 写入并运行全局播放器失败检查**
- [x] **Step 2: 在 `ContentView` 创建并分发唯一 `PlaybackCoordinator`**
- [x] **Step 3: 删除 `VideoPlayerView` 内的独立 `@StateObject`**
- [x] **Step 4: 使用来源加 UUID 的 `PlaybackOwner` 保护播放与停止时序**
- [x] **Step 5: 扫描工程，确认仅根页面创建 `PlaybackCoordinator()`**
- [x] **Step 6: 运行回归检查与 `git diff --check`**
