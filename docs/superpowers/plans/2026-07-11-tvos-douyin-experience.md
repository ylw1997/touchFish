# tvOS Douyin Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 收敛 Apple TV 抖音模块的原生播放器交互、Cookie 数据流、评论与作者主页，使遥控器操作清晰且功能与 Douyin Web 模块一致。

**Architecture:** 保留 `AVPlayerViewController` 作为唯一播放控制器，在 transport bar 只暴露作者和评论两项操作；SwiftUI 负责评论和作者主页的呈现。网络层改为显式抛出 HTTP、解析和抖音业务错误，Cookie 经过规范化与登录接口验证后再保存，并由各数据页监听变更后刷新。

**Tech Stack:** SwiftUI、AVKit、Foundation URLSession、JavaScriptCore、tvOS 16+

---

### Task 1: 网络错误与 Cookie 生效链路

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/DouyinAPI.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/SettingsView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/FavoritesView.swift`

- [ ] **Step 1: 写入 Cookie 规范化和状态码契约检查**

验证 `Cookie:` 前缀和多余换行被清理，请求响应 `status_code != 0` 时作为错误向 UI 传播。

- [ ] **Step 2: 运行静态契约检查确认旧实现不满足要求**

Run: `rg -n "Cookie 保存成功，数据已生效|return \[\]|return \(\[\]" ios/TouchFishTV/TouchFishTV`

Expected: 找到无条件成功提示和吞错返回空列表的旧代码。

- [ ] **Step 3: 实现 Cookie 验证与显式错误传播**

设置页使用受登录保护的喜欢列表接口验证候选 Cookie，成功后才持久化；推荐、关注、喜欢页监听 Cookie 变化并重新加载。

- [ ] **Step 4: 检查 UI 不再无条件宣称 Cookie 生效**

Run: `rg -n "数据已生效|Error fetching.*return" ios/TouchFishTV/TouchFishTV`

Expected: 无匹配。

### Task 2: 播放器工具栏、焦点和评论关闭

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/CommentsView.swift`

- [ ] **Step 1: 记录旧工具栏和评论重复实现**

Run: `rg -n "上一个视频|下一个视频|CommentsListSmallView" ios/TouchFishTV/TouchFishTV/Views`

Expected: 找到工具栏重复导航动作和播放器内重复评论列表。

- [ ] **Step 2: 精简原生工具栏并统一评论视图**

删除 transport bar 的上一个/下一个和喜欢动作，仅保留作者与评论；评论面板提供关闭按钮与 Menu/返回键关闭路径，并删除 `CommentsListSmallView`。

- [ ] **Step 3: 将初始焦点请求交给播放器**

`RemotePlayerViewController` 在首次显示时请求焦点，评论打开时不处理视频切换键，关闭后重新把焦点交回播放器。

- [ ] **Step 4: 检查工具栏与评论契约**

Run: `rg -n "上一个视频|下一个视频|CommentsListSmallView|onExitCommand|关闭评论" ios/TouchFishTV/TouchFishTV/Views`

Expected: 前三项旧实现无匹配，存在评论退出和关闭入口。

### Task 3: 视频列表策略

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift`

- [ ] **Step 1: 检查推荐流旧去重路径**

Run: `rg -n "contains\(where:.*aweme_id" ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift`

Expected: 找到对所有 feed 类型生效的去重代码。

- [ ] **Step 2: 删除所有视频列表去重**

推荐、关注、喜欢和作者作品接口每次返回的条目都按原顺序直接追加，允许相同视频重复出现。

### Task 4: 作者入口和作者作品播放

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/Views/AuthorWorksView.swift`

- [ ] **Step 1: 在 transport bar 添加当前作者动作**

使用当前视频作者头像作为图标，头像未加载时使用系统人物图标；点击后全屏进入 `AuthorWorksView`。

- [ ] **Step 2: 修正作者标识与作品加载错误态**

作者接口统一使用 `sec_uid`/`sec_user_id` 计算出的 `uid`，空 ID 时阻止请求并显示明确错误。

- [ ] **Step 3: 作者作品支持连续播放**

从网格进入作品播放器后，上下键仅在首次加载的作品集合内切换，不触发额外分页请求。

### Task 5: 整体清理与验证

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/Views/*.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/DouyinAPI.swift`

- [ ] **Step 1: 删除重复、不可达和误导性代码**

移除重复评论列表、无效注释、只改变本地状态的操作以及吞错分支。

- [ ] **Step 2: 运行完整静态校验**

Run: `git diff --check`

Expected: exit 0。

Run: `rg -n "上一个视频|下一个视频|CommentsListSmallView|数据已生效" ios/TouchFishTV/TouchFishTV`

Expected: 无匹配。

- [ ] **Step 3: 在 Mac 上运行 tvOS 构建与交互验收**

Run: `xcodebuild -project ios/TouchFishTV/TouchFishTV.xcodeproj -scheme TouchFishTV -sdk appletvsimulator build CODE_SIGNING_ALLOWED=NO`

Expected: `** BUILD SUCCEEDED **`。

手工验收：启动焦点在视频；播放时上下切换；暂停时进入原生控制；评论可按钮或 Menu 关闭；所有视频列表允许重复；Cookie 保存后刷新；作者头像进入主页；作者作品不自动加载更多。
