# tvOS 抖音单活动播放器设计

## 问题

原生 `TabView` 会保留或预创建多个标签页。推荐和关注页面各自持有一个
`PlaybackCoordinator` 与 `AVPlayer`，因此不可见标签也可能继续加载、缓冲或播放。
多个播放器并存会造成播放状态互相干扰，并使视频缓冲及解码内存持续累积。

## 目标

- 保留当前原生 `TabView` 顶栏和页面样式。
- 任意时刻只允许当前选中的标签拥有活动播放器。
- 标签失活时立即停止播放、取消加载，并释放 `AVPlayerItem`。
- 返回推荐或关注标签时，从该 Feed 当前视频重新开始播放。
- 不改变上下切换、左右进度、弹幕和“我的喜欢”列表交互。

## 方案

`ContentView` 使用带 `selection` 的 `TabView`，并为四个标签定义稳定标识。
顶层把 `isActive` 传入推荐和关注的 `DouyinFeedView`。

`DouyinFeedView` 只有在 `isActive` 为真时才挂载 `VideoPlayerView`；失活后播放器视图
从层级中移除，由现有 `onDisappear -> PlaybackCoordinator.stop()` 完成以下清理：

1. 取消异步资产加载和诊断任务。
2. 暂停 `AVPlayer` 并取消 preroll、seek 与 asset loading。
3. 将 `currentItem` 替换为 `nil`。
4. 拆除弹幕时间观察器、KVO、网络任务和动画视图。

“我的喜欢”仅在用户点开某个视频时创建播放器；离开详情时继续沿用现有销毁逻辑。

## 验证

- 静态回归检查确认 `TabView` 具有 selection，两个 Feed 都接收活动状态，播放器只在
  `isActive` 时挂载。
- 检查 `PlaybackCoordinator.stop()` 与播放器控制器 dismantle 的资源清理仍然存在。
- Mac 模拟器依次切换推荐、关注、喜欢、设置，日志中同一时刻只能有一个 generation
  序列持续输出；连续切换视频后内存应进入平台期，而不是随每条视频单调增长。

