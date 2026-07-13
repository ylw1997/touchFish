# Apple TV 抖音短视频性能修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让原生播放器快速出首帧、限制连续播放的内存增长，并完成“我的喜欢”竖屏封面及弹幕暂停同步。

**Architecture:** 保留单一 `AVPlayer`，通过明确的资源释放顺序和有限前向缓冲控制每条视频的生命周期。Feed 只保留当前项向上最多 5 条已播放历史，并以播放序列而非 `aweme_id` 驱动切换，确保重复视频仍会重新安装 item。弹幕同时观察 `rate` 与 `timeControlStatus`。

**Tech Stack:** Swift、SwiftUI、AVFoundation、AVKit、tvOS、PowerShell 源级回归检查

---

### Task 1: 建立回归检查

**Files:**
- Create: `scripts/verify-tvos-douyin.ps1`

- [x] 写入源级检查，要求播放器包含 8 秒缓冲、立即播放、旧 item 释放，Feed 包含有界窗口及播放序列，弹幕观察 rate，喜欢页使用 3:4 封面且不显示数量。
- [x] 运行 `powershell -ExecutionPolicy Bypass -File scripts/verify-tvos-douyin.ps1`，确认在实现前以缺少资源策略失败。

### Task 2: 修复播放器资源生命周期

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift`

- [x] 为播放请求增加 `playbackToken`，相同 `aweme_id` 但不同序列仍执行切换。
- [x] 切换前取消异步加载、pending seek、preroll 和旧 asset 加载，再移除旧 item。
- [x] 删除阻塞启动的 `commonMetadata` 加载，将 `preferredForwardBufferDuration` 设为 8 秒。
- [x] 关闭自动最小化卡顿等待，使用 `playImmediately(atRate: 1)` 尽快播放已有数据。
- [x] 保留 Debug 诊断，但诊断身份改为播放序列。

### Task 3: 限制 Feed 数据增长

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/DouyinFeedStore.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift`

- [x] 增加单调递增的 `playbackToken`，刷新和每次有效上下切换都更新。
- [x] Feed 只裁剪已播放历史，当前视频向上最多保留 5 条供“上一个”使用；推荐请求保持 `count=10`，实际数量以响应为准，并在剩余 2 条时预取下一批。
- [x] 裁剪头部后同步修正 `activeIndex`，不改变当前播放内容。

### Task 4: 同步弹幕并收敛喜欢页面

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/DanmakuOverlayController.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift`

- [x] 弹幕按播放序列重新配置，并同时观察 `rate` 和 `timeControlStatus`；任一不是实际播放状态就冻结动画且不投放新弹幕。
- [x] 喜欢列表使用索引作为焦点和 ForEach 身份，支持重复 `aweme_id`。
- [x] 删除“我的喜欢 XX 个视频”页内标题、模糊横卡背景和包裹文字的 Card 底纹，使用 tvOS 原生 `.borderless` lockup 焦点效果。
- [x] 四列封面统一为 3:4，图片居中裁切；标题显示两行，下方显示作者头像、用户名和点赞数量。

### Task 5: 验证与交付

**Files:**
- Modify: `docs/superpowers/specs/2026-07-13-tvos-douyin-native-player-design.md`

- [x] 更新设计文档中的 16:9 喜欢卡片和无限 Feed 描述。
- [x] 运行 `powershell -ExecutionPolicy Bypass -File scripts/verify-tvos-douyin.ps1`，预期全部检查通过。
- [x] 运行 `git diff --check`，预期无空白错误。
- [ ] 在 Mac tvOS 模拟器构建并人工连续切换至少 30 条，观察首帧等待、内存曲线、旧视频声音和弹幕暂停；Windows 侧不声称完成此项。
