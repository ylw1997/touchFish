<div align="center">

<img src="https://oss.qmsznj.com/prod/2025/08/13/ab941352-929e-4e5b-92c8-90e76b547f4c_20250813171917A269.png" width="200" height="200" alt="TouchFish Logo">

# TouchFish

**一款专为打工人设计的 VS Code 摸鱼神器，让你在编码的同时，低调、高效、丝滑地获取资讯与社交动态。**

[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ylw.touchfish?style=for-the-badge&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=ylw.touchfish)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/ylw.touchfish?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=ylw.touchfish)
[![Ratings](https://img.shields.io/visual-studio-marketplace/r/ylw.touchfish?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=ylw.touchfish)

</div>

> [!Important]
>  记住这个插件：`TouchFish` - 让工作时间不再枯燥，摸鱼摸得理直气壮！

## ✨ 核心功能一览

| 模块 | 能力亮点 |
| ---- | -------- |
| 新闻聚合 | IT之家 / Chiphell / V2EX / 虎扑 / NGA 等多源统一，支持分类 Tab 与来源切换 |
| 微博中心 | 刷流、长文、评论树、图片/视频、点赞、转发、评论、关注、发微博、上传图片 |
| 知乎探索 | 推荐流 / 关注流 / 热榜 / 热门问题、回答详情、子评论、点赞/反对、关注问题 |
| UI 体验 | 跟随 VS Code 主题自动适配，暗色无缝；图片懒加载；长内容延迟展开 |
| 交互增强 | 无限滚动、加载状态提示、错误降级、复制链接、用户详情抽屉 |
| 安全与隔离 | 所有请求通过扩展后端代理，避免直接暴露敏感信息 |
| 可配置 | 自定义默认 Tab、是否显示图片、Cookie 管理|


## 🚀 功能展示（截图）

#### 📰 新闻阅读

![新闻](https://oss.qmsznj.com/prod/2025/08/13/382058b5-0aca-49ec-ad1c-72bf77a7c190_20250813172501A270.png)

#### 💬 刷知乎

![知乎](https://oss.qmsznj.com/prod/2025/08/13/b77683ce-b998-4a5e-85c9-561e99b37aa9_20250813172625A272.png)

#### 💬 刷微博

![刷微博](https://oss.qmsznj.com/prod/2025/08/13/14786899-ee21-46d9-925f-5395a009a505_20250813172610A271.png)


### 🎮 VSCODE暗色主题

![主题](https://oss.qmsznj.com/prod/2025/08/13/800c066c-bce9-4041-a6d0-fbb1bf459855_20250813173043A282.png)

#### 📝 互动功能 (发布、评论、查看详情)

**发布微博**

![发布微博](https://oss.qmsznj.com/prod/2025/07/01/9c79d33e-73d1-489a-bd88-ad0074245984_20250701164912A764.png)

**查看用户微博**

![查看用户微博](https://oss.qmsznj.com/prod/2025/07/01/b5140434-5590-49b4-98a5-1e1d8c1dec08_20250701164842A763.jpg)

## 🛠️ 安装

1.  打开 **VS Code**。
2.  进入 **扩展** 视图 (`Ctrl+Shift+X`)。
3.  搜索 `TouchFish`。
4.  点击 **安装**。

或者，[直接访问 VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ylw.touchfish)。

## ⚙️ 使用与配置

### 快捷配置 Cookie / Token

为了获得完整的个人化体验（如刷微博、操作知乎），你需要设置相关平台的 Cookie 或 Token。本插件提供了便捷的命令来设置：

1.  在 `TouchFish` 视图中，找到对应的平台（如微博、知乎、NGA）。
2.  点击视图右上角的 **齿轮图标 (⚙️)**。
3.  在弹出的输入框中，粘贴你的 Cookie 或 Token。

### 手动配置（设置界面）

你也可以在 VS Code 的设置中 (`Ctrl+,`) 搜索 `touchfish` 来找到所有可配置的选项，例如：

- `touchfish.weiboCookie`: 你的微博 Cookie。
- `touchfish.zhihuCookie`: 你的知乎 Cookie。
- `touchfish.ngaCookie`: 你的 NGA Cookie。
- `touchfish.showImg`: 是否显示图片。
- 以及各个新闻源的默认标签页配置。


## ⚠️ 注意事项 / 常见问题 (FAQ)

**网络要求**：访问部分社区可能需要代理（如 V2EX 个别节点）。

**Cookie 说明**：微博 / 知乎 / NGA 高级功能依赖有效 Cookie；若失效可重新在浏览器获取；插件不会上传到远端。

**常见问题**：
| 问题 | 说明 |
| ---- | ---- |
| 微博加载为空 | Cookie 失效或账号限制，重新配置 Cookie |
| Zhihu 热榜报签名错误 | 本地 cookie 过期，重新输入 | 
| NGA 中文乱码 | 使用 gbk 解码逻辑已内置，如仍异常请反馈 |
| 需要截断标题 | 现已取消统一截断，可自行在 issues 提需求 |

反馈或建议 → [GitHub Issues](https://github.com/ylw1997/touchFish/issues)

## 🤝 贡献

欢迎 PR / Issue / Star。你可以：
1. 修复 Bug（请附复现步骤）
2. 提交新来源适配（新增到 `news/sources.ts`）
3. 优化界面体验 / 增强无障碍支持

## 📄 License

MIT

---
如果这个项目对你有帮助，可以在 Marketplace 给个好评，让更多“同行”拥有更愉悦的摸鱼体验。
