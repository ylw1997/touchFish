<div align="center">

<img src="https://oss.qmsznj.com/prod/2025/08/13/ab941352-929e-4e5b-92c8-90e76b547f4c_20250813171917A269.png" width="200" height="200" alt="TouchFish Logo">

# TouchFish

**一款专为打工人设计的 VS Code 摸鱼神器，让你在编码的同时，尽享冲浪的乐趣。**

[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ylw.touchfish?style=for-the-badge&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=ylw.touchfish)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/ylw.touchfish?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=ylw.touchfish)
[![Ratings](https://img.shields.io/visual-studio-marketplace/r/ylw.touchfish?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=ylw.touchfish)

</div>

> [!Important]
>  记住这个插件：`TouchFish` - 让工作时间不再枯燥，摸鱼摸得理直气壮！

## ✨ 核心功能

- **多平台聚合**: 无需离开 VS Code，即可沉浸式浏览来自 **IT之家、Chiphell、V2EX、虎扑、NGA** 等多个热门社区的资讯。
- **全功能微博**: 不仅仅是看！你可以 **刷微博、看评论、点赞、转发、发微博、关注/取关用户**，享受近乎完整的桌面端微博体验。
- **深度集成知乎**: 在代码的海洋里，随时潜入知乎探索答案。支持 **查看热榜、浏览推荐、查看问题和回答详情、展开/折叠评论、点赞/反对、关注问题** 等深度互动。
- **无缝主题切换**: 插件界面能够 **自动侦测并适配** 你当前的 VS Code 主题。无论你切换到任何亮色或暗色主题，视图都会即时响应，实现真正的沉浸式体验，摸鱼不留痕迹。
- **丰富交互体验**: 支持 **图片懒加载、视频播放、长文展开、加载动画、列表无限滚动** 等特性，提供流畅、现代的浏览体验。
- **高度可配置**: 从新闻源到栏目分类，再到内容展示方式，多种参数均可自定义，打造最适合你的摸鱼环境。

## 🚀 功能展示

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

## ⚙️ 配置与使用

### 快捷配置 Cookie / Token

为了获得完整的个人化体验（如刷微博、操作知乎），你需要设置相关平台的 Cookie 或 Token。本插件提供了便捷的命令来设置：

1.  在 `TouchFish` 视图中，找到对应的平台（如微博、知乎、NGA）。
2.  点击视图右上角的 **齿轮图标 (⚙️)**。
3.  在弹出的输入框中，粘贴你的 Cookie 或 Token。

### 手动配置

你也可以在 VS Code 的设置中 (`Ctrl+,`) 搜索 `touchfish` 来找到所有可配置的选项，例如：

- `touchfish.weiboCookie`: 你的微博 Cookie。
- `touchfish.zhihuCookie`: 你的知乎 Cookie。
- `touchfish.ngaCookie`: 你的 NGA Cookie。
- `touchfish.xhsCookie`: 你的小红书 Cookie (用于首页推荐加密接口)。
- `touchfish.showImg`: 是否显示图片（目前主要支持微博）。
- 以及各个新闻源的默认标签页配置。

## ⚠️ 注意事项

### 小红书使用说明

当前内置了首页推荐加密签名逻辑，视图在侧边活动栏 `TouchFish-Xhs` 中。首次打开会提示设置 `小红书 Cookie`：

1. 浏览器登录 https://www.xiaohongshu.com
2. 打开开发者工具 Network 任意请求复制完整 `Cookie`
3. 在 XHS 视图标题的齿轮菜单里执行 “设置小红书Cookie” 命令并粘贴

功能：
- 支持首页瀑布流推荐无限下拉
- 支持图片显示/隐藏切换（复用全局 `touchfish.showImg`）
- 自动记忆滚动位置

后续计划：搜索、笔记详情、点赞/收藏 等交互能力。

- **网络环境**: 浏览 **V2EX** 节点需要科学上网。
- **Cookie 配置**: **微博、知乎、NGA** 的大部分高级功能（如个人主页、发布、评论等）需要登录凭证 (Cookie)。你可以在浏览器中登录相应网站，然后按 `F12` 打开开发者工具，在“网络”(Network) 面板中找到请求的 `Cookie` 值并配置到插件中。
- **问题反馈**: 如果遇到任何 Bug 或有功能建议，欢迎在 [GitHub Issues](https://github.com/ylw1997/touchFish/issues) 中提出。
