# tvOS 播放诊断日志设计

## 目标

为抖音播放链路增加低开销、可复现、可导出的结构化日志。下次出现切换 Tab 后卡顿、异常暂停或内存持续增长时，日志应能判断问题发生在页面所有权、原生控制器生命周期、播放器状态、资源释放还是缓冲层。

## 输出方式

- Debug 构建同时输出到 Xcode 控制台和应用沙盒 `Documents/playback-diagnostics.log`。
- 每次启动生成独立 `sessionID`，每行包含时间、事件分类和关键字段。
- 文件最大约 2 MB；超过限制后保留较新的日志，防止诊断功能自身持续占用磁盘或内存。
- 文件写入使用串行后台队列；界面与播放主线程只负责提交短字符串。

## 日志范围

记录以下事件：

- `session`：启动、结束、系统版本与设备类型。
- `owner`：播放 owner 获取、替换、停止及过期请求。
- `asset`：候选数量、尝试的 URL 域名、可播放检查、取消与错误。
- `item`：PlayerItem 创建、替换、释放、失败和播放结束。
- `controller`：全局 AVPlayerViewController 身份、容器创建、挂载、迁移、卸载和销毁。
- `player`：timeControlStatus、rate、item status、进度、时长、缓冲末端、waiting reason 和错误。
- `memory`：应用常驻内存，结合 owner、generation 和当前视频 ID 输出。
- `danmaku`：配置与停止，不记录弹幕正文。

播放开始后的前 6 秒每 0.5 秒采样一次，之后在播放存续期间每 2 秒采样一次。状态变化、异常暂停、进度停滞、切换和释放时立即记录快照。

## 隐私与安全

- 不记录 Cookie、authentication token、签名参数或请求头。
- 不记录完整播放 URL，只记录 host 和候选序号。
- 视频只记录 aweme ID；标题、用户名和弹幕正文不写入诊断文件。

## 获取日志

Xcode 控制台可用 `[PlaybackDiagnostics]` 过滤。模拟器日志文件可通过应用 data container 下的 `Documents/playback-diagnostics.log` 取出；设置页不新增导出 UI，避免扩大本次范围。

## 验证

- 静态回归脚本确认诊断器、2 MB 上限、内存采样、控制器生命周期日志和隐私约束存在。
- 运行既有 tvOS Douyin 回归脚本，确保单播放器、单原生控制器约束不被破坏。
- 检查工程内诊断调用不包含 `cookie`、完整 URL 或请求头值。
