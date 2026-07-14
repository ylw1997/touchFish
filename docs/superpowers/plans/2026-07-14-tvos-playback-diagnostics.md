# tvOS Playback Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Apple TV 抖音播放链路增加可过滤、可持久保存且不会泄露凭证的有界诊断日志。

**Architecture:** 新增 `PlaybackDiagnostics` 作为唯一日志入口，在串行后台队列中格式化并写入最大 2 MB 的文件，同时输出到 Xcode 控制台。`PlaybackCoordinator` 负责播放状态和内存快照，原生播放器容器与弹幕控制器只报告生命周期事件。

**Tech Stack:** Swift 5、AVFoundation、AVKit、UIKit、Darwin Mach API、PowerShell 回归脚本。

---

## 文件结构

- Create: `ios/TouchFishTV/TouchFishTV/PlaybackDiagnostics.swift`：日志格式化、后台文件写入、容量限制、内存读取。
- Modify: `ios/TouchFishTV/TouchFishTV.xcodeproj/project.pbxproj`：把诊断器加入 tvOS target。
- Modify: `ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift`：播放、资源、状态、停滞和内存快照。
- Modify: `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift`：全局控制器和容器生命周期。
- Modify: `ios/TouchFishTV/TouchFishTV/DanmakuOverlayController.swift`：弹幕配置、停止、请求结果。
- Modify: `scripts/verify-tvos-douyin.ps1`：诊断能力和隐私约束回归检查。

### Task 1: 建立失败的诊断回归检查

**Files:**
- Modify: `scripts/verify-tvos-douyin.ps1`

- [ ] **Step 1: 写入诊断结构检查**

在 `$checks` 中增加：

```powershell
@{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackDiagnostics.swift'; Pattern = 'maximumFileSize\s*=\s*2\s*\*\s*1024\s*\*\s*1024'; Description = '2 MB diagnostics file limit' },
@{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackDiagnostics.swift'; Pattern = 'task_info\('; Description = 'resident memory sampling' },
@{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'PlaybackDiagnostics\.shared\.event'; Description = 'playback diagnostics events' },
@{ Path = 'ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift'; Pattern = 'category:\s*"controller"'; Description = 'native controller lifecycle diagnostics' },
@{ Path = 'ios/TouchFishTV/TouchFishTV/DanmakuOverlayController.swift'; Pattern = 'category:\s*"danmaku"'; Description = 'danmaku lifecycle diagnostics' }
```

并增加敏感信息检查：

```powershell
$diagnosticsCalls = rg 'PlaybackDiagnostics\.shared\.event' (Join-Path $root 'ios/TouchFishTV/TouchFishTV')
if ($diagnosticsCalls -match 'cookie|authentication_token|headers|absoluteString') {
    $failures += 'diagnostics call may expose credentials or full URLs'
}
```

- [ ] **Step 2: 运行检查并确认失败原因正确**

Run: `powershell -ExecutionPolicy Bypass -File scripts/verify-tvos-douyin.ps1`

Expected: FAIL，缺少 `PlaybackDiagnostics.swift`、2 MB 上限、内存采样和生命周期事件。

- [ ] **Step 3: 提交测试**

```powershell
git add scripts/verify-tvos-douyin.ps1
git commit -m "test(tvos): 增加播放诊断日志回归约束"
```

### Task 2: 实现有界诊断日志器

**Files:**
- Create: `ios/TouchFishTV/TouchFishTV/PlaybackDiagnostics.swift`
- Modify: `ios/TouchFishTV/TouchFishTV.xcodeproj/project.pbxproj`

- [ ] **Step 1: 创建唯一日志入口**

实现以下接口：

```swift
final class PlaybackDiagnostics: @unchecked Sendable {
    static let shared = PlaybackDiagnostics()
    static let maximumFileSize = 2 * 1024 * 1024

    let sessionID: String

    func event(_ name: String, category: String, fields: [String: CustomStringConvertible] = [:])
    func residentMemoryMegabytes() -> Double?
}
```

`event` 在串行 `DispatchQueue` 中生成一行：

```text
[PlaybackDiagnostics] time=2026-07-14T12:34:56.789Z session=ABC123 category=player event=snapshot generation=4 memoryMB=302.4
```

字段按 key 排序，换行替换为空格。文件路径固定为 `Documents/playback-diagnostics.log`。追加前若预计超过 `maximumFileSize`，读取旧文件末尾 1 MB，写入 `event=log-truncated` 标记、旧数据尾部和当前行。

`residentMemoryMegabytes()` 使用 `task_vm_info_data_t`、`mach_task_self_` 和 `task_info` 返回 `phys_footprint / 1_048_576`。

- [ ] **Step 2: 加入 Xcode target**

在 `project.pbxproj` 的 `PBXFileReference`、根 `PBXGroup` 和 `PBXSourcesBuildPhase` 各增加 `PlaybackDiagnostics.swift` 条目，使用未占用的 `A/B100...007` 标识。

- [ ] **Step 3: 运行回归检查**

Run: `powershell -ExecutionPolicy Bypass -File scripts/verify-tvos-douyin.ps1`

Expected: 仍 FAIL，但日志文件上限与内存采样相关项目不再失败。

- [ ] **Step 4: 提交日志器**

```powershell
git add ios/TouchFishTV/TouchFishTV/PlaybackDiagnostics.swift ios/TouchFishTV/TouchFishTV.xcodeproj/project.pbxproj
git commit -m "feat(tvos): 增加有界播放诊断日志器"
```

### Task 3: 接入播放状态与资源生命周期

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift`

- [ ] **Step 1: 记录关键边界事件**

在初始化、播放请求、候选 URL 尝试、asset 加载结果、item 替换、失败、停止和释放位置调用：

```swift
PlaybackDiagnostics.shared.event(
    "play-request",
    category: "owner",
    fields: [
        "instance": instanceID,
        "owner": owner.debugLabel,
        "generation": requestedGeneration,
        "token": playbackToken,
        "aweme": aweme.aweme_id
    ]
)
```

URL 事件只传 `url.host ?? "unknown"` 和候选序号；错误只传错误类型与 `localizedDescription`。

- [ ] **Step 2: 扩展状态采样任务**

保留前 6 秒每 0.5 秒采样，并在同一 Task 中继续每 2 秒采样，直到 generation 改变或 Task 取消。每次快照加入 `owner`、`generation`、`aweme`、`memoryMB`。连续两次处于 `.playing` 且进度增量小于 0.05 秒时输出 `event=stalled-progress`；非用户停止路径出现 `.paused` 时输出 `event=unexpected-paused`。

- [ ] **Step 3: 确保释放事件在清理前后各有快照**

`releaseCurrentItem()` 在 `replaceCurrentItem(with: nil)` 前记录 item 状态、进度和内存，之后记录 `currentItem=false`，从而判断 AVPlayerItem 是否实际脱离。

- [ ] **Step 4: 运行回归检查**

Run: `powershell -ExecutionPolicy Bypass -File scripts/verify-tvos-douyin.ps1`

Expected: 播放诊断事件检查通过；控制器和弹幕检查仍失败。

- [ ] **Step 5: 提交播放诊断**

```powershell
git add ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift
git commit -m "feat(tvos): 记录播放状态与资源释放日志"
```

### Task 4: 接入原生控制器与弹幕生命周期

**Files:**
- Modify: `ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift`
- Modify: `ios/TouchFishTV/TouchFishTV/DanmakuOverlayController.swift`

- [ ] **Step 1: 为控制器和容器提供稳定身份**

为 `DouyinPlayerViewController` 和 `PlayerContainerViewController` 各增加六位 UUID，并在 `init`、`deinit`、`viewDidLoad`、`embed`、迁移、`detach` 和过期 detach 处记录：

```swift
PlaybackDiagnostics.shared.event(
    "embed",
    category: "controller",
    fields: ["controller": controller.diagnosticsID, "container": diagnosticsID]
)
```

不得记录闭包内容、Cookie 或完整 URL。

- [ ] **Step 2: 记录弹幕资源变化**

在 `configure`、`stop`、`loadWindow` 成功、失败和取消处记录 aweme ID、playback token、窗口起点、返回数量、进行中的任务数和 overlay 子视图数。不要记录 Cookie 或 `DanmakuItem.text`。

- [ ] **Step 3: 运行全部静态回归**

Run: `powershell -ExecutionPolicy Bypass -File scripts/verify-tvos-douyin.ps1`

Expected: `tvOS Douyin regression checks passed.`

- [ ] **Step 4: 检查差异和隐私**

Run: `git diff --check`

Expected: exit 0。

Run: `rg -n "PlaybackDiagnostics.*(cookie|authentication_token|headers|absoluteString)" ios/TouchFishTV/TouchFishTV`

Expected: 无输出。

- [ ] **Step 5: 提交并推送**

```powershell
git add ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift ios/TouchFishTV/TouchFishTV/DanmakuOverlayController.swift scripts/verify-tvos-douyin.ps1
git commit -m "feat(tvos): 补全播放器生命周期诊断日志"
git push touchFish atv
```

### Task 5: Mac 模拟器验证与日志取回说明

**Files:**
- No code changes

- [ ] **Step 1: 构建验证**

在 Mac 拉取后运行 Xcode Debug 构建。Expected: 编译成功，无新增警告。

- [ ] **Step 2: 执行复现路径**

依次执行“推荐播放 → 我的喜欢列表 → 推荐 → 我的喜欢中播放 → 推荐”，重复三轮。控制台用 `[PlaybackDiagnostics]` 过滤。

- [ ] **Step 3: 取回文件日志**

```zsh
APP_DATA="$(xcrun simctl get_app_container booted com.touchfish.tv.app data)"
cp "$APP_DATA/Documents/playback-diagnostics.log" ~/Desktop/playback-diagnostics.log
```

Expected: 桌面生成日志文件，内容以同一个 `session` 串联完整复现链路，且不包含 Cookie 或完整 URL。
