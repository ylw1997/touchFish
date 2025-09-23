# 更新历史 


## [8.23.0](https://github.com/ylw1997/touchFish/compare/v8.22.0...v8.23.0) (2025-09-23)


### 🐛 Bug Fixes | Bug 修复

* **weibo:** 更新微博来源字段为必填并优化样式 ([1cf4ad2](https://github.com/1cf4ad2461f5298820da7dc8049b7dc8b11cec4e))


### ✨ Features | 新功能

* **weibo:** 优化微博卡片操作按钮样式与功能 ([56e7daa](https://github.com/56e7daa37b23f70a7145af7304602b8a8d276d66))


### ♻ Code Refactoring | 代码重构

* **weibo:** 优化 WeiboCard 组件代码结构 ([7944cf5](https://github.com/7944cf54ad1a62fca17bdaddfca5ff964810b55e))

## [8.22.0](https://github.com/ylw1997/touchFish/compare/v8.21.0...v8.22.0) (2025-09-22)


### ✨ Features | 新功能

* **weibo:** 优化转发微博样式与图片列表布局 ([679e6ca](https://github.com/679e6ca3b18575dc7d2911d283022ecfb98a39fe))

## [8.21.0](https://github.com/ylw1997/touchFish/compare/v8.20.0...v8.21.0) (2025-09-22)


### ✨ Features | 新功能

* **weibo:** 更新用户查询参数支持ID和用户名 ([7b650d6](https://github.com/7b650d67eac5d062d3091e5db69fbbcc4e789d0b))

## [8.20.0](https://github.com/ylw1997/touchFish/compare/v8.19.1...v8.20.0) (2025-09-22)


### ♻ Code Refactoring | 代码重构

* **weibo:** 重构消息处理与数据获取逻辑 ([cea7256](https://github.com/cea725641cb912b5e5ff1dd3f6d6463b083b2190))


### ✨ Features | 新功能

* **weibo:** 引入 WeiboApi 类封装请求逻辑 ([3fa54e5](https://github.com/3fa54e5c3a68eee17f8221d19ba184c447d75797))
* **zhihu:** 引入 ZhihuApi 类封装请求逻辑 ([1c1c3dc](https://github.com/1c1c3dc1287ef4f980af3896b860b90e8ea8a843))
* **zhihu:** 重构消息通信机制并优化组件逻辑 ([658410f](https://github.com/658410f16aea457fd108ca5c019917eaf3898ceb))

### [8.19.1](https://github.com/ylw1997/touchFish/compare/v8.19.0...v8.19.1) (2025-09-18)


### ♻ Code Refactoring | 代码重构

* **UserDetailDrawer, useVscodeMessage:** 更新字体加粗样式和注释掉日志打印 ([3bdfe1f](https://github.com/3bdfe1f13a099f410bda258d9ed32d58a6e05005))

## [8.19.0](https://github.com/ylw1997/touchFish/compare/v8.18.0...v8.19.0) (2025-09-18)


### ✨ Features | 新功能

* **weibo:** 添加用户是否为账号所有者的标识 ([5a1fe4f](https://github.com/5a1fe4f237a52eddb785f2bef84239e965a3a341))

## [8.18.0](https://github.com/ylw1997/touchFish/compare/v8.17.2...v8.18.0) (2025-09-18)


### ✨ Features | 新功能

* **user:** 在用户详情页面添加用户描述信息 ([9354d6a](https://github.com/9354d6a90a1f37badac227d43b051977a2a1cd11))
* **weibo:** 用户详情页面增加关注和粉丝数量展示 ([da5eb1a](https://github.com/da5eb1a88e26c966fc90da5bc274d213999fc393))


### ♻ Code Refactoring | 代码重构

* **components:** 优化用户详情抽屉中的描述文本渲染逻辑 ([1e00b05](https://github.com/1e00b05dc164721db4c0746b71561d8523fa58d9))
* **SearchDrawer, SendWeiboDrawer, YImg, useMessageHandler, useWeiboAction:** 优化消息处理逻辑和错误处理 ([34188d0](https://github.com/34188d0ba9a9b15758e9e177daf17d11bd18603f))
* **SearchDrawer:** 更新最后编辑时间和条件判断逻辑 ([221620e](https://github.com/221620e4276cf719f4885756839a6c826ca8328e))
* **SearchDrawer:** 更新最后编辑时间和优化消息发送参数 ([44d6212](https://github.com/44d621245e472d30cab8c4bb19fd5c850a405c97))
* **type.d.ts, UserDetailDrawer:** 更新最后编辑时间和添加特别关注字段 ([385bd05](https://github.com/385bd05aa565f9b28e7e17e1b8d3ad76ef74baed))
* **UserDetailDrawer:** 优化用户详情抽屉组件的代码结构 ([78c68cd](https://github.com/78c68cd57f7731dc0b0d8dff1abd6db6594feb51))
* **weibo/src/hooks/useMessageHandler.ts:** 更新最后编辑时间和注释掉日志打印 ([e9fe0e1](https://github.com/e9fe0e110355b93fc2f1126fe7b5ff79e36faced))
* **weibo:** 优化getUserByName函数并简化useWeiboAction中的回调函数 ([5b480b2](https://github.com/5b480b2f9ea9ed64878e29cdc46bb7b22dc7856b))

### [8.17.2](https://github.com/ylw1997/touchFish/compare/v8.17.1...v8.17.2) (2025-09-17)


### ♻ Code Refactoring | 代码重构

* **weibo:** 优化搜索功能和微博卡片展示 ([2fdae7a](https://github.com/2fdae7a3f66925bb5d7fe02e6935b6209af49872))

### [8.17.1](https://github.com/ylw1997/touchFish/compare/v8.17.0...v8.17.1) (2025-09-17)


### ♻ Code Refactoring | 代码重构

* **weibo:** 优化微博搜索接口调用 ([6f9850a](https://github.com/6f9850ab4a345f6c23b52ced686153b9c58b2cb8))

## [8.17.0](https://github.com/ylw1997/touchFish/compare/v8.16.8...v8.17.0) (2025-09-15)


### ✨ Features | 新功能

* **weibo:** 优化微博热搜功能 ([d692b42](https://github.com/d692b42f94336ccbad65966cbfc77602157a0ba3))

### [8.16.8](https://github.com/ylw1997/touchFish/compare/v8.16.7...v8.16.8) (2025-09-15)


### 🐛 Bug Fixes | Bug 修复

* **zhihu:** 过滤 noscript 标签以优化内容解析 ([7cdff28](https://github.com/7cdff284f55bedb60da5d737220de08d367ded44))

### [8.16.7](https://github.com/ylw1997/touchFish/compare/v8.16.6...v8.16.7) (2025-09-12)


### ♻ Code Refactoring | 代码重构

* **zhihu:** 优化今日知乎组件的图片显示逻辑 ([5ae3194](https://github.com/5ae3194e0ba2cf34ccc6f726184dc2604e5d3c51))

### [8.16.6](https://github.com/ylw1997/touchFish/compare/v8.16.5...v8.16.6) (2025-09-12)


### ♻ Code Refactoring | 代码重构

* **component:** 重构搜索和用户详情组件的加载逻辑 ([99f4d2f](https://github.com/99f4d2fffa5168675f478bada052d99fe5155f23))
* **zhihu:** 优化加载状态展示效果 ([d662f6e](https://github.com/d662f6e73b00ebf81385fecdd84c103363c3cf69))

### [8.16.5](https://github.com/ylw1997/touchFish/compare/v8.16.4...v8.16.5) (2025-09-10)

### [8.16.4](https://github.com/ylw1997/touchFish/compare/v8.16.3...v8.16.4) (2025-09-10)


### ♻ Code Refactoring | 代码重构

* **weibo:** 优化图片显示逻辑和按钮布局 ([b9e2b6b](https://github.com/b9e2b6b61894d6c9657a215d0d8c0392530e5754))


### 📦 Chores | 其他更新

* **eslint:** 忽略特定文件的 ESLint 检查 ([0a4aab4](https://github.com/0a4aab4ac3e7ce99e6d466814d551c5a2ae56547))

### [8.16.3](https://github.com/ylw1997/touchFish/compare/v8.16.2...v8.16.3) (2025-09-10)


### 🐛 Bug Fixes | Bug 修复

* **weibo:** 修复表情包显示问题 ([4cbd27e](https://github.com/4cbd27e5b47e98dcbfe03451b6e8c35f943014ca))

### [8.16.2](https://github.com/ylw1997/touchFish/compare/v8.16.1...v8.16.2) (2025-09-10)


### 📦 Chores | 其他更新

* 删除刷新图标 ([517ca91](https://github.com/517ca9139f5237939fd0055c892f58f920ff44bd))


### ♻ Code Refactoring | 代码重构

* **textParser:** 重构文本解析器并添加自动调整大小的文本区域 ([7d9aabf](https://github.com/7d9aabf0efc2edf5d4d3aa24433b0b34a34eac1f))

### [8.16.1](https://github.com/ylw1997/touchFish/compare/v8.16.0...v8.16.1) (2025-09-10)

## [8.16.0](https://github.com/ylw1997/touchFish/compare/v8.15.0...v8.16.0) (2025-09-10)


### ✨ Features | 新功能

* **theme:** 更新主题获取逻辑并优化主题配置 ([f5289eb](https://github.com/f5289eb54e14cdc8fae913054b2b9a076c9ef068))
* **theme:** 更新主题配置，调整字体大小和边框样式 ([7a59684](https://github.com/7a59684a9627ce517b071fe9d6ccea5b34fa42b2))

## [8.15.0](https://github.com/ylw1997/touchFish/compare/v8.14.2...v8.15.0) (2025-09-05)


### ✨ Features | 新功能

* **components:** 在 SearchDrawer 组件中添加话题点击事件处理 ([679760a](https://github.com/679760a90624ed2adc17f4666b2f9263a5b21178))
* **weibo:** 优化微博搜索功能并添加重试机制 ([5db2e59](https://github.com/5db2e599444ee285ea6eeae30301ff1cb15d1fbe))


### ♻ Code Refactoring | 代码重构

* **weibo:** 重构微博卡片和动作处理 ([01dd674](https://github.com/01dd6746d1616c02fd8f0202e1196adc983e3a85))

### [8.14.2](https://github.com/ylw1997/touchFish/compare/v8.14.1...v8.14.2) (2025-09-05)

### [8.14.1](https://github.com/ylw1997/touchFish/compare/v8.14.0...v8.14.1) (2025-09-05)


### ♻ Code Refactoring | 代码重构

* **components:** 优化评论和微博卡片的样式 ([9162575](https://github.com/916257555483828e8d77ece90b881734069d1867))


### 📝 Documentation | 文档

* **README:** 更新功能描述并移除快速启动指南 ([204bb55](https://github.com/204bb55edf06dd542b7a8daf2958e5ad140b50af))

## [8.14.0](https://github.com/ylw1997/touchFish/compare/v8.13.0...v8.14.0) (2025-09-05)


### ✨ Features | 新功能

* **theme:** 实现主题自动适配功能并优化样式 ([eeb11bb](https://github.com/eeb11bbc97d85e365a2fbbd38b5ad990365046df))

## [8.13.0](https://github.com/ylw1997/touchFish/compare/v8.12.1...v8.13.0) (2025-09-04)


### 👷‍ Build System | 构建

* **dependencies:** 添加 antd 依赖并移除部分主题配置 ([3bbf579](https://github.com/3bbf579132b7d9c87453b00551539a0b94e612ab))


### ✨ Features | 新功能

* **zhihu:** 优化主题和样式以适配 VS Code ([4a3baf2](https://github.com/4a3baf2a6ff5ea0e99e863481b71a572a8720392))

### [8.12.1](https://github.com/ylw1997/touchFish/compare/v8.12.0...v8.12.1) (2025-09-01)


### ♻ Code Refactoring | 代码重构

* **openUrl:** 为 HTML 内容中的 img 和 video 标签添加 referrerpolicy 属性 ([d365f08](https://github.com/d365f08c4afbc5b9fade7fb67d73d1c9b2d26771))

## [8.12.0](https://github.com/ylw1997/touchFish/compare/v8.11.4...v8.12.0) (2025-09-01)


### ✨ Features | 新功能

* **activate:** 添加插件启动时会自动加载所有新闻源 ([623a420](https://github.com/623a420976f5f4493cd71cb4ac01d647c3bb602b))

### [8.11.4](https://github.com/ylw1997/touchFish/compare/v8.11.3...v8.11.4) (2025-09-01)


### ♻ Code Refactoring | 代码重构

* **extension:** 移除自动刷新功能 ([792870b](https://github.com/792870b3549381888280263acf4af022dd4d9089))

### [8.11.3](https://github.com/ylw1997/touchFish/compare/v8.11.2...v8.11.3) (2025-09-01)


### 👷‍ Build System | 构建

* **publish:** 更新发布脚本并调整默认配置 ([3e12243](https://github.com/3e1224393555970dfda85f4ac39908a83debb4c3))

### [8.11.2](https://github.com/ylw1997/touchFish/compare/v8.11.1...v8.11.2) (2025-08-26)

### [8.11.1](https://github.com/ylw1997/touchFish/compare/v8.11.0...v8.11.1) (2025-08-26)


### 👷‍ Build System | 构建

* 升级 vscode API 依赖版本 ([022abad](https://github.com/022abad856f65e8d0f9de22a2877097db0839402))

## [8.11.0](https://github.com/ylw1997/touchFish/compare/v8.10.3...v8.11.0) (2025-08-21)


### ✨ Features | 新功能

* **utils:** 新增数组去重函数并应用于 API 模块 ([130513f](https://github.com/130513fa79067ac77f8df68028830351d9d8e3fb))

### [8.10.3](https://github.com/ylw1997/touchFish/compare/v8.10.2...v8.10.3) (2025-08-21)

### [8.10.2](https://github.com/ylw1997/touchFish/compare/v8.10.1...v8.10.2) (2025-08-20)


### 🐛 Bug Fixes | Bug 修复

* **zhihu:** 修复回到顶部按钮滚动目标 ([9c9f5d9](https://github.com/9c9f5d958751aba5f3132100e863acc7c970e486))

### [8.10.1](https://github.com/ylw1997/touchFish/compare/v8.10.0...v8.10.1) (2025-08-20)


### ♻ Code Refactoring | 代码重构

* **zhihu:** 优化知乎内容解析和样式 ([c3d3a52](https://github.com/c3d3a52bf8c5767439a9fedea8ecbd9f91b8f870))

## [8.10.0](https://github.com/ylw1997/touchFish/compare/v8.9.3...v8.10.0) (2025-08-20)


### ♻ Code Refactoring | 代码重构

* **zhihu:** 优化界面样式和组件属性 ([4a6a1e3](https://github.com/4a6a1e3056174b6e24b361c4495e06172203acc2))


### ✨ Features | 新功能

* **weibo:** 优化微博页面样式和功能 ([4aafd6e](https://github.com/4aafd6ec659baa1c279c4dfb0bade909fd697889)), closes [#3a3a3](https://github.com/ylw1997/touchFish/issues/3a3a3) [#3c3c3](https://github.com/ylw1997/touchFish/issues/3c3c3)

### [8.9.3](https://github.com/ylw1997/touchFish/compare/v8.9.2...v8.9.3) (2025-08-19)

### [8.9.2](https://github.com/ylw1997/touchFish/compare/v8.9.1...v8.9.2) (2025-08-19)


### ♻ Code Refactoring | 代码重构

* **layout:** 调整页面布局和滚动逻辑 ([731ea42](https://github.com/731ea424bfcfd93f3d6bdcd23814ecb2e8f36950))


### 👷‍ Build System | 构建

* 更新版本号至 8.9.2 ([4e09ec6](https://github.com/4e09ec6017f0a8c923e2d0639955723cb5efc703))

### [8.9.1](https://github.com/ylw1997/touchFish/compare/v8.9.0...v8.9.1) (2025-08-19)


### ♻ Code Refactoring | 代码重构

* **zhihu:** 移除回到顶部按钮的 target 属性 ([899ef0d](https://github.com/899ef0d080a89cceb2eae83ad771b3b11bbc9f61))

## [8.9.0](https://github.com/ylw1997/touchFish/compare/v8.8.2...v8.9.0) (2025-08-19)


### ✨ Features | 新功能

* **zhihu:** 整合 HerouI 组件并优化依赖 ([0d2e5dc](https://github.com/0d2e5dc4f25e4dbd0bf58bb0831273e32d38ade4))

### [8.8.2](https://github.com/ylw1997/touchFish/compare/v8.8.1...v8.8.2) (2025-08-19)

### [8.8.1](https://github.com/ylw1997/touchFish/compare/v8.8.0...v8.8.1) (2025-08-18)


### ♻ Code Refactoring | 代码重构

* **openUrl:** 重构打开详情页功能 ([537ac59](https://github.com/537ac590c15a7ac1dffc1314d582ae6071faa285))


### 👷‍ Build System | 构建

* 更新版本号至 8.8.1 ([8c9b72b](https://github.com/8c9b72b2ba7ba107428962ea5c87dfdc430a20df))

## [8.8.0](https://github.com/ylw1997/touchFish/compare/v8.7.3...v8.8.0) (2025-08-18)


### ✨ Features | 新功能

* **commands:** 优化打开网页命令并添加返回原始文章按钮 ([84576df](https://github.com/84576df761966f8725bd327dc4758551d8acb3f9))


### ♻ Code Refactoring | 代码重构

* **touchfish:** 重构打开新闻详情页面的代码 ([4e72424](https://github.com/4e724244c364d53a3d065af0eda31666313cad47))

### [8.7.3](https://github.com/ylw1997/touchFish/compare/v8.7.2...v8.7.3) (2025-08-18)


### 👷‍ Build System | 构建

* **touchfish:** 优化构建发布流程 ([6ec5671](https://github.com/6ec5671c01ac2ba826e6e1ccb607e4c15e3fc4c4))

### [8.7.2](https://github.com/ylw1997/touchFish/compare/v8.7.1...v8.7.2) (2025-08-18)


### ♻ Code Refactoring | 代码重构

* **utils:** 重构签名工具以提高安全性 ([355b6d4](https://github.com/355b6d45742d3a60cad4c510e38881719b8d9dd7))

### [8.7.1](https://github.com/ylw1997/touchFish/compare/v8.7.0...v8.7.1) (2025-08-18)


### 🐛 Bug Fixes | Bug 修复

* **chipHell:** 优化ChipHell新闻获取功能 ([698f52d](https://github.com/698f52d5e82cd2b1256b2fcb491af93a8dbd0f5e))

## [8.7.0](https://github.com/ylw1997/touchFish/compare/v8.6.0...v8.7.0) (2025-08-18)


### ✨ Features | 新功能

* **zhihu/weibo:** 添加设置知乎和微博 Token 的功能 ([f2b8580](https://github.com/f2b8580191b0d33a4dea2d58ddd3090423fde1f1))

## [8.6.0](https://github.com/ylw1997/touchFish/compare/v8.5.1...v8.6.0) (2025-08-15)


### ✨ Features | 新功能

* **zhihu:** 添加关注和取消关注问题功能 ([3784e63](https://github.com/3784e63afa67a664ef652fe95f835fdbf5b53217))

### [8.5.1](https://github.com/ylw1997/touchFish/compare/v8.5.0...v8.5.1) (2025-08-14)


### ♻ Code Refactoring | 代码重构

* **zhihu:** 简化人气问题标签文本 ([7a50323](https://github.com/7a50323f1273edb37e224a4539491da259d4b6de))

## [8.5.0](https://github.com/ylw1997/touchFish/compare/v8.4.0...v8.5.0) (2025-08-14)


### ✨ Features | 新功能

* **zhihu:** 添加知乎人气问题功能 ([50511a8](https://github.com/50511a8248f2de8afe52f0574b7ec523111c18ef))

## [8.4.0](https://github.com/ylw1997/touchFish/compare/v8.3.0...v8.4.0) (2025-08-14)


### 👷‍ Build System | 构建

* 更新版本号至 8.4.0 ([6520f7a](https://github.com/6520f7aefac33fd4c8532b17b78c37a8f7acb1b3))

## [8.3.0](https://github.com/ylw1997/touchFish/compare/v8.2.3...v8.3.0) (2025-08-13)


### ✨ Features | 新功能

* **touchfish:** 添加沉浸式主题并更新版本号 ([a8f90d0](https://github.com/a8f90d04401a42e5aa53ffa36143f3de58f58f52))

### [8.2.3](https://github.com/ylw1997/touchFish/compare/v8.2.2...v8.2.3) (2025-08-13)


### 📝 Documentation | 文档

* **README:** 更新项目文档和图片 ([439369a](https://github.com/439369a21379e135501bfc61e9ab701578b11a3d))


### 👷‍ Build System | 构建

* 更新版本号至 8.2.3 ([1e5e716](https://github.com/1e5e71668bfb81c52a467f104605287c907c683f))

### [8.2.2](https://yangliwei.top///compare/v8.2.1...v8.2.2) (2025-08-13)


### 📝 Documentation | 文档

* **README:** 更新产品介绍和功能展示 ([46ca22b](https://yangliwei.top/46ca22b4e157896cf274ebbf740155878e205644))

### [8.2.1](https://yangliwei.top///compare/v8.2.0...v8.2.1) (2025-08-12)


### ✨ Features | 新功能

* **zhihu:** 调整滚动加载阈值 ([d464a25](https://yangliwei.top/d464a2504d63e82efe14f73bba0ffcd14a7c03ae))


### 👷‍ Build System | 构建

* 更新版本号至 8.2.1 ([8a215bf](https://yangliwei.top/8a215bfcb0b6b0631ef58d7dc4ef01ee5c9ba548))

## [8.2.0](https://yangliwei.top///compare/v8.1.2...v8.2.0) (2025-08-12)


### ✨ Features | 新功能

* **zhihu:** 添加知乎问题详情展示功能 ([f06316e](https://yangliwei.top/f06316edf09903d0c6c172a055a02556d287046e))


### 👷‍ Build System | 构建

* 调整 build-publish 脚本执行顺序 ([4d7ec39](https://yangliwei.top/4d7ec395a124c6fb8d31ef0bb94cacf178d62726))
* 更新版本号至 8.2.0 ([c51e44e](https://yangliwei.top/c51e44e5c3e2264b73416d6a6aeba9be88dda3fd))

### [8.1.2](https://yangliwei.top///compare/v8.1.1...v8.1.2) (2025-08-12)


### 🐛 Bug Fixes | Bug 修复

* **zhihu:** 修复搜索结果类型筛选和时间线刷新问题 ([ad33006](https://yangliwei.top/ad3300648840a34eb55f0c1f4f34f12c4394b126))


### ♻ Code Refactoring | 代码重构

* **zhihu:** 优化搜索结果界面并调整投票功能 ([520c236](https://yangliwei.top/520c236ef085fc7a20f8d867af0b5a83c27dd79b))
* **zhihu:** 重构点赞功能并优化搜索结果处理 ([e0d66b9](https://yangliwei.top/e0d66b97029142b46e4a8e63da5922dae5d90017))


### 👷‍ Build System | 构建

* 更新版本号至 8.1.2 ([8a3f948](https://yangliwei.top/8a3f94839b0fee44bcf61d518fa8c349b0144ed6))


### ✨ Features | 新功能

* **tabs:** 调整标签页顺序并设置新的默认标签页 ([68d93de](https://yangliwei.top/68d93debe6407e03c70926aeef0fde32a78137b2))
* **zhihu:** 为 convertZhihuHotItemToZhihuItemData 函数添加 type 字段 ([e5b6589](https://yangliwei.top/e5b6589d5b1a0b5c1b7f23df6653bd7e746641cc))

### [8.1.1](https://yangliwei.top///compare/v8.1.0...v8.1.1) (2025-08-11)


### ✨ Features | 新功能

* **components:** 为 QuestionDetailDrawer 组件添加投票功能 ([700d215](https://yangliwei.top/700d2158a01b3cb4d222ac13451e983523d5886e))


### 👷‍ Build System | 构建

* 更新版本号至 8.1.1 ([558c2db](https://yangliwei.top/558c2dbe5eae83a8c43fa715923830577c672e4c))

## [8.1.0](https://yangliwei.top///compare/v8.0.7...v8.1.0) (2025-08-11)


### 👷‍ Build System | 构建

* 更新版本号至 8.0.7 ([7afb75f](https://yangliwei.top/7afb75f9949a1dad0db5a37592c87b2938860ffa))


### ⚡ Performance Improvements | 性能优化

* **zhihu:** 对 QuestionDetailDrawer 组件进行代码分割 ([07079cc](https://yangliwei.top/07079cc56297f4907726dec7d5c15b16f06f1384))


### ✨ Features | 新功能

* **zhihu:** 添加点赞功能 ([7b4c603](https://yangliwei.top/7b4c603aeaa830437807d638f27acc0968162c24))
* **zhihu:** 添加搜索功能并优化知乎项 ([27c0fbb](https://yangliwei.top/27c0fbb12e588d3e608587c6166c0039bfa5177d))

### [8.0.7](https://yangliwei.top///compare/v8.0.6...v8.0.7) (2025-08-11)

### [8.0.6](https://yangliwei.top///compare/v8.0.5...v8.0.6) (2025-08-08)


### ♻ Code Refactoring | 代码重构

* **zhihu:** 重构评论组件布局和样式 ([81dc49b](https://yangliwei.top/81dc49bcc56f4539689591f2466dc1853695efc4))


### 👷‍ Build System | 构建

* 更新版本号至 8.0.6 ([ae4e8df](https://yangliwei.top/ae4e8dfe7d6cebee1a78483233e0d85ff012c4b3))

### [8.0.5](https://yangliwei.top///compare/v8.0.4...v8.0.5) (2025-08-08)


### ♻ Code Refactoring | 代码重构

* **zhihu:** 优化知乎组件样式和功能 ([99b7c53](https://yangliwei.top/99b7c53ab7195223ae473b966ef8ef9ce11acbc1))

### [8.0.4](https://yangliwei.top///compare/v8.0.3...v8.0.4) (2025-08-08)


### ♻ Code Refactoring | 代码重构

* **zhihu:** 重构知乎插件消息发送方式 ([f97750f](https://yangliwei.top/f97750f51df1124155871c10602e14dcd094a0bf))


### 👷‍ Build System | 构建

* 更新版本号至 8.0.4 ([0070c9b](https://yangliwei.top/0070c9bd490df2d5304735b96c44e8d6acd6bce1))

### [8.0.3](https://yangliwei.top///compare/v8.0.2...v8.0.3) (2025-08-08)


### 🔧 Continuous Integration | CI 配置

* 修改版本控制配置 ([0695d7d](https://yangliwei.top/0695d7deee7449d81c7b49783f73fef9b3af2fce))


### 👷‍ Build System | 构建

* **zhihu:** 更新 build-publish 脚本并添加版本控制 ([8686236](https://yangliwei.top/868623622c8c8634c390d76c791ca245c8415fb8))


### 📝 Documentation | 文档

* **README:** 更新 README 文档 ([5e2c8be](https://yangliwei.top/5e2c8bef58bde6c10e44fd53539c92a4c3f1f196))

### [8.0.2](https://yangliwei.top///compare/v1.0.0...v8.0.2) (2025-08-08)


### 📦 Chores | 其他更新

* **release:** 8.0.0 ([a6bfb44](https://yangliwei.top/a6bfb449b40e6d549890afd01c896000fbbd193e))


### ✨ Features | 新功能

* **zhihu:** 添加滚动位置保存和恢复功能 ([d928452](https://yangliwei.top/d928452229c06622af8722775b8df26f7401026f))


### 👷‍ Build System | 构建

* 更新版本至 8.0.2 并优化构建配置 ([0995343](https://yangliwei.top/09953438acc5491182bdb53beb857dcacf7963dd))
* **touchfish:** 更新版本至 8.0.1 ([50b23ae](https://yangliwei.top/50b23ae7d5c3f7308b6e2002aa88c86594911d4d))

### [8.0.2](https://yangliwei.top///compare/v1.0.0...v8.0.2) (2025-08-08)


### 📦 Chores | 其他更新

* **release:** 8.0.0 ([a6bfb44](https://yangliwei.top/a6bfb449b40e6d549890afd01c896000fbbd193e))


### 👷‍ Build System | 构建

* **touchfish:** 更新版本至 8.0.1 ([50b23ae](https://yangliwei.top/50b23ae7d5c3f7308b6e2002aa88c86594911d4d))


### ✨ Features | 新功能

* **zhihu:** 添加滚动位置保存和恢复功能 ([d928452](https://yangliwei.top/d928452229c06622af8722775b8df26f7401026f))
