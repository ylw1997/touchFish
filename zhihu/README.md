## TouchFish Zhihu Webview

专为 VS Code 插件 TouchFish 构建的 **知乎前端子应用**，使用 **React + TypeScript + Vite + Ant Design**。提供推荐流 / 关注流 / 热榜 / 热门问题 等多种信息浏览能力，支持回答详情、评论树、子评论分页、点赞 / 反对、关注问题、复制链接等互动功能。

### ✨ 功能特性

| 功能 | 说明 |
| ---- | ---- |
| 推荐 / 关注流 | 与官方网页类似的推荐更新体验 |
| 热榜 | 采用热榜接口 + 二次结构转换，支持序号展示 |
| 热门问题 | 获取热门问题并聚合为统一列表 |
| 回答详情 | 展示完整富文本（图片替换 data-src 自动补链） |
| 评论系统 | 根评论 + 子评论懒加载、分页加载更多 |
| 点赞 / 反对 | 答案态度操作（调用扩展后端命令） |
| 关注问题 | 直接在问题详情中关注/取消关注 |
| 复制链接 | 支持复制标题 + URL 到剪贴板 |

### 🧱 目录结构

```
src/
├── api/          # 轻量 API client（封装 request -> postMessage）
├── hooks/        # useRequest / useZhihuAction 等业务 Hook
├── components/   # UI 组件（问题抽屉 / 评论项 / 列表项等）
├── utils/        # 富文本解析、消息桥、格式化辅助
├── data/         # tabs 配置、常量
├── style/        # 样式（Less）
└── ThemeWrapper  # VS Code 主题适配（暗/亮）
```

### 🔌 与扩展通信

前端通过：
```ts
vscode.postMessage({ command, payload, uuid });
```
后端（extension host）处理后回传：
```ts
window.addEventListener('message', (event) => { /* handler */ });
```
`useRequest` 负责：生成 uuid -> 注册回调 -> 发送 -> 等待响应 -> Promise resolve/reject。

### 🛠 开发调试

```bash
pnpm install
pnpm dev
```
在主扩展中 F5 启动后，webview 会加载本地构建资源（若做了 dev server，可在 vscode 里替换为本地地址）。

### 🧪 关键 Hook：useZhihuAction

主要负责：
- 列表状态 / 分页 map 管理
- 问题详情抽屉开关
- 获取回答详情 + 评论
- 关注 / 取消关注
- 点赞 / 中立化回答

### 📌 未来计划（子模块）
- 支持回答内图片点击预览（Lightbox）
- 回答内代码块语法高亮
- 草稿缓存（问题详情返回后自动恢复滚动位置）

### 🤝 贡献
欢迎针对交互体验 / 性能优化 / 结构抽象提出 PR 或 Issue。

> 提示：此目录只关注 Webview 前端，不直接持久化或存储 Cookie，全部鉴权来自扩展侧。
```
