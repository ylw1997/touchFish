# 更新历史 


## [9.4.0](https://github.com/ylw1997/touchFish/compare/v9.3.0...v9.4.0) (2025-11-03)


### 🐛 Bug Fixes | Bug 修复

* 强制要求 getXhsUserPosted 接口的 cursor 参数为必填项 ([acda9cb](https://github.com/acda9cb9105062c6c570d2a512f1df62ccfd25cf))


### ✨ Features | 新功能

* 更新用户相关接口，支持可选 xsec_source 参数；优化用户主页和笔记详情组件的用户点击处理 ([d88a940](https://github.com/d88a940c244f8a3f6fe1a104d691f8dd05e1240d))
* 使用 react-masonry-css 组件替换 List 组件以优化瀑布流布局 ([3f9fbf6](https://github.com/3f9fbf6354fac3874e575910b1e4bfa8c7ad3a27))
* 添加关注和取消关注用户功能；更新用户主页组件以支持关注状态的显示和处理 ([ce6d0c1](https://github.com/ce6d0c1958c7b9fdbf996ac498440b2c42248a8f))
* 添加获取用户 hover card 信息接口；更新用户主页组件以展示用户详细信息 ([bc11478](https://github.com/bc1147800324a33bf39b4604808149a175293c6d))
* 添加获取用户已发布笔记功能；更新相关组件以支持用户主页展示 ([ba094a7](https://github.com/ba094a7d56c39a131c7a554ac2d415e63418687e))
* 添加获取用户已发布笔记列表接口；更新签名生成逻辑以支持 GET 方法；调整 XhsFeedCard 组件的用户点击处理 ([a0fd730](https://github.com/a0fd7304643d5295e1cb76b6da7e4726b0dbc9be))
* 添加内置用户主页 Drawer 功能；支持在父组件未传递 onUserClick 时展示用户信息 ([0e4c668](https://github.com/0e4c668251a850c83c47854836044d9b99c819e3))
* 添加生成 x_b3_traceid 函数并更新请求头参数；调整 CommonItem 组件昵称样式 ([54c4fda](https://github.com/54c4fda7a1022e5d4a7f0ca5898df5563b08ef63))

## [9.3.0](https://github.com/ylw1997/touchFish/compare/v9.2.0...v9.3.0) (2025-10-31)


### ✨ Features | 新功能

* 添加 react-masonry-css 组件以优化瀑布流布局；更新样式以改善用户体验 ([c28377f](https://github.com/c28377fe08c0ce3ae031fc51e17388753488f454))


### 🐛 Bug Fixes | Bug 修复

* 更新 ThemeWrapper 组件的最后编辑时间；调整 Carousel 组件的箭头大小 ([a740cfe](https://github.com/a740cfebdb313e7c16cd84ebd24cccf8a7b94c2c))

## [9.2.0](https://github.com/ylw1997/touchFish/compare/v9.1.0...v9.2.0) (2025-10-31)


### ✨ Features | 新功能

* 更新 .vscodeignore 文件，添加 xhs webview 相关路径以排除源代码和依赖项 ([e2955f5](https://github.com/e2955f5f39dc5f1aa0186e36b1adc2623ce7c23e))

## [9.1.0](https://github.com/ylw1997/touchFish/compare/v8.47.0...v9.1.0) (2025-10-31)


### 📦 Chores | 其他更新

* 删除 xhsSignature 测试文件，清理不再使用的代码 ([30e7ba3](https://github.com/30e7ba3369d91c378cd939a2bcd1a5113c5c8152))


### ✨ Features | 新功能

* 更新 package.json 版本和描述，新增 xhsFeedCard 组件样式，优化 XhsFeedCard 组件结构和功能 ([3dba981](https://github.com/3dba981294b91342cbb9bacc3dc09e0f0173c830))
* 更新 XhsFeedCard 组件，使用 HeartOutlined 图标替代点赞文本，优化用户体验；调整 ant-card-hoverable 样式，增强视觉效果 ([fa5338f](https://github.com/fa5338f92d704928854e9f1b76c891adf7803c93))
* 更新主题包装器和小红书笔记详情组件，增强样式和功能，优化布局 ([d251bd7](https://github.com/d251bd730b59db18a28d5bdd8c2924fb50625e13))
* 添加获取小红书评论功能，更新相关接口和组件，优化评论展示 ([c20f46b](https://github.com/c20f46b3a7708ac214bf1b0c86d95e367a65e7c5))
* 添加搜索功能，整合搜索笔记接口，优化搜索结果展示；新增搜索抽屉组件，增强用户体验 ([f052a30](https://github.com/f052a30179e2175be316e17a87d57c1940484a99))
* 添加小红书 API 支持，重构数据请求和组件，优化主题和样式 ([c64c1f7](https://github.com/c64c1f79a50f8dd50506e8d98188af8a69d236a0))
* 添加小红书笔记详情抽屉组件，优化 Feed 组件以支持详情展示 ([0802581](https://github.com/08025813a24b032044e7fcfef678e5201258e914))
* 添加小红书笔记详情支持，重构 API 调用，优化数据加载逻辑 ([85ad3d1](https://github.com/85ad3d1e55a43d4977c5f0c8c7d9435b02308b48))
* 添加小红书原始 Feed 类型定义以支持数据结构描述 ([0f64a0e](https://github.com/0f64a0ea20d3b0c3521d092c22aa739e667e47ca))
* 添加小红书支持，包含 API、组件和构建配置 ([696b90e](https://github.com/696b90ea46e938d85a4002f275bb45d1fa6dd8db))
* 完善小红书笔记详情类型定义，增强视频和图片支持，优化样式 ([d666fba](https://github.com/d666fba5a4ab4f9c5410b9fe3c3ec4e180e03cbd))
* 移除 XhsSearchDrawer 组件中的 getContainer 属性，优化组件渲染 ([b686069](https://github.com/b686069a2f899375bffa579bb266369628a90dd2))
* 移除 XhsSearchDrawer 组件中的调试日志，优化代码整洁性；更新 useXhsFeed Hook，增强清空和刷新功能 ([4fc7f9a](https://github.com/4fc7f9ab0388a40854598d024c18a44ed8de7816))
* 移除滚动位置保存与恢复中的调试日志，优化代码整洁性 ([c95da0b](https://github.com/c95da0bb575c60007f59d70e03215cac29284b15))
* 优化 Feed 组件和样式，调整瀑布流布局，增强响应式设计 ([84bfc4f](https://github.com/84bfc4ff436713352e7e25a709c4e5ccd5f75894))
* 优化 useXhsFeed Hook，简化数据加载逻辑，移除去重功能 ([a5385a6](https://github.com/a5385a628e328b24647facbd260d24bfea9ff985))
* 优化 XhsFeedCard 组件，增强用户交互体验；更新样式以改善悬停效果 ([2b24868](https://github.com/2b2486883f72d8fd73937bb34c5393807b7bed70))
* 增强小红书支持，添加滚动位置保存与恢复功能，优化请求处理逻辑 ([7ecb286](https://github.com/7ecb2867a7b1769038e34824182cbfd809630394))
* 重构小红书 API 请求，使用 xhsHttp 封装，优化错误处理与加载组件 ([30814a6](https://github.com/30814a6dd0e0120ed01506d1afcf2ffc7e632dc3))
* add XhsWebProvider and API integration for 小红书 ([415c9d1](https://github.com/415c9d19c0a6c442da04f90eaa7826fb96f295be))


### 🐛 Bug Fixes | Bug 修复

* 更新 XHS API 请求头以简化签名字段处理 ([8dca990](https://github.com/8dca99026e105978bba6e3e5219b492a2ed5cf1e))
* 更新 xhs.svg 文件以修复图标显示问题 ([b11dc03](https://github.com/b11dc030d30ae99969a7e6b9ed0b6316c1f40ff0))
* 更新 XhsFeedCard 组件的最后编辑时间；注释掉用户点击日志输出 ([4d2d06c](https://github.com/4d2d06c94e3857519341efea14d40116044d5258))
* 回退使用 axios 并优化请求头生成函数，确保签名生成稳定性 ([e98db3b](https://github.com/e98db3b2ed0f6c67fd01d74478602b89468d8d89))

## [8.47.0](https://github.com/ylw1997/touchFish/compare/v8.46.2...v8.47.0) (2025-10-14)


### ✨ Features | 新功能

* 添加问题详情排序功能，支持按时间和默认排序 ([bc9be8d](https://github.com/bc9be8d68f195dbc2aca09407867133313908b39))

### [8.46.2](https://github.com/ylw1997/touchFish/compare/v8.46.1...v8.46.2) (2025-10-13)


### 🐛 Bug Fixes | Bug 修复

* 替换 Avatar 为自定义排名徽章，优化多位数字显示 ([5ba0e43](https://github.com/5ba0e4366cd137bc37f105f811c802e8a5e5bed0))
* 优化 V2EX 新闻列表获取，清理链接地址，去除哈希和查询参数 ([adea5fa](https://github.com/adea5fa10676fe0bf8d410ff5cd4343606614913))

### [8.46.1](https://github.com/ylw1997/touchFish/compare/v8.46.0...v8.46.1) (2025-10-10)


### 🐛 Bug Fixes | Bug 修复

* 调整 QuestionDetailDrawer 和 SearchDrawer 组件的内边距，优化布局 ([e4ecd2b](https://github.com/e4ecd2b980687afd1ac471cd2d72c582989e84b3))
* 优化搜索功能，确保处理搜索关键词的空格并添加 onSearch 事件 ([93e7300](https://github.com/93e7300aaab5c621bf65a7fc388d006cb7428c6d))

## [8.46.0](https://github.com/ylw1997/touchFish/compare/v8.45.2...v8.46.0) (2025-10-10)


### ✨ Features | 新功能

* 添加 TouchFish 协作速记文档，详细说明扩展功能与使用流程 ([6bc2b49](https://github.com/6bc2b49fd28a218f9e07f2be705363b97d1c69c3))


### 🐛 Bug Fixes | Bug 修复

* 更新 buildTreeItems 方法，修正 tooltip 显示为标题而非 URL ([1466d24](https://github.com/1466d24cd44ac8d8a2c8f8364dd3b326bff7f160))
* 更新 formatData 函数，确保使用传入的准确 id，提升一致性 ([63e8764](https://github.com/63e8764887982b165fee6c81b48c3f00905d0873))

### [8.45.2](https://github.com/ylw1997/touchFish/compare/v8.45.1...v8.45.2) (2025-10-09)


### 🐛 Bug Fixes | Bug 修复

* 更新 compareNews 函数逻辑，确保新出现的新闻在未读状态下标记为新图标 ([49863b2](https://github.com/49863b27ae239835c8f84b01dd9768eb246094dd))

### [8.45.1](https://github.com/ylw1997/touchFish/compare/v8.45.0...v8.45.1) (2025-10-09)


### 🐛 Bug Fixes | Bug 修复

* 修正 build-publish 脚本中的命令，确保正确执行发布流程 ([0a76b1f](https://github.com/0a76b1ffc1b41662e27ae81cd93d61db9787497a))

## [8.45.0](https://github.com/ylw1997/touchFish/compare/v8.44.1...v8.45.0) (2025-10-09)


### ✨ Features | 新功能

* 优化已读标记逻辑，支持局部更新，减少不必要的全量刷新 ([380c899](https://github.com/380c899d2e0d4046a31bf2a9a293c8c5fe3339ae))

### [8.44.1](https://github.com/ylw1997/touchFish/compare/v8.44.0...v8.44.1) (2025-10-09)

## [8.44.0](https://github.com/ylw1997/touchFish/compare/v8.43.0...v8.44.0) (2025-09-30)


### 📦 Chores | 其他更新

* 注释掉fetchNewsList中的调试日志 ([0ecce19](https://github.com/0ecce19d4d66bc24d26b79793572cf66eeea1373))


### ✨ Features | 新功能

* 调整YImg组件，更新SVG背景位置，优化加载占位符逻辑 ([b434096](https://github.com/b434096fa7a7aeacb4ad3985fccf2cdea54c1d2e))

## [8.43.0](https://github.com/ylw1997/touchFish/compare/v8.42.0...v8.43.0) (2025-09-30)


### ✨ Features | 新功能

* 更新样式，限制图片最大高度以优化显示效果 ([dd5db46](https://github.com/dd5db46a2440e7137fcbadaed2f979bbbc79eefc))
* 修改数据获取逻辑，保留旧列表以优化新闻比较功能 ([9e309af](https://github.com/9e309afeae11232de7275b62a7e55db6bca49265))
* 重构新闻源管理与缓存机制，新增内存缓存功能，优化数据获取逻辑 ([34146d9](https://github.com/34146d9e4c929899ef3c462136343875efe04368))
* 重构openUrl命令，抽取重复逻辑并优化HTML清洗，增强可读性和安全性 ([b3f3ff8](https://github.com/b3f3ff892197e16259ca6fa539086694895a76dd))
* **hupu:** 更新Hupu数据获取逻辑，新增fetchNewsList函数，优化新闻源支持 ([e5278af](https://github.com/e5278afe8f43dcf3e4b5aec307772852eeec6606))

## [8.42.0](https://github.com/ylw1997/touchFish/compare/v8.41.0...v8.42.0) (2025-09-30)


### 🐛 Bug Fixes | Bug 修复

* **zhihu:** 修改收起按钮文本及图片最大高度样式 ([281caaa](https://github.com/281caaab7d5f59cc071359115fcd120df99cdfb3))


### ✨ Features | 新功能

* **zhihu:** 添加收起评论功能并优化评论区域标题栏 ([a41c03a](https://github.com/a41c03a134fe97dafc4d7466a25a08b78b7daf9c))

## [8.41.0](https://github.com/ylw1997/touchFish/compare/v8.40.0...v8.41.0) (2025-09-29)


### ✨ Features | 新功能

* **zhihu:** 优化评论组件代码结构与样式细节 ([ec43082](https://github.com/ec43082ae056a2653288e561b54d636bc537a39d))
* **zhihu:** 支持加载知乎子评论并分页展示 ([4905c25](https://github.com/4905c2510f2f7f4dc17e43e0c6be9e2079c8ab8d))
* **zhihu:** 支持显示评论回复对象名称 ([74cdfe2](https://github.com/74cdfe299bbdab9e99d6b896129716b420de9750))

## [8.40.0](https://github.com/ylw1997/touchFish/compare/v8.39.0...v8.40.0) (2025-09-29)


### ✨ Features | 新功能

* **zhihu:** 实现分页加载与无限滚动功能 ([1736c2c](https://github.com/1736c2c6dd49638336c84863aa1a669c8f1c5eca))
* **zhihu:** 实现问题详情分页加载与滚动优化 ([dc842ec](https://github.com/dc842ec74c598cdffd82cb3e8dd612faa64d8197))


### ♻ Code Refactoring | 代码重构

* **useZhihuAction:** 移除调试日志和未使用的依赖 ([d5fb427](https://github.com/d5fb427529763e9c0bcbbbe48e108175abfed383))
* **zhihuWebProvider:** 优化知乎数据获取逻辑并移除冗余参数校验 ([50a55d7](https://github.com/50a55d705f5d235faae54275c8b59c4848351c2f))

## [8.39.0](https://github.com/ylw1997/touchFish/compare/v8.38.0...v8.39.0) (2025-09-26)


### 📝 Documentation | 文档

* **readme:** 更新 README 文档内容与功能说明 ([1705f92](https://github.com/1705f92932c3e8fb8e9cda4287b86d885eb75961))


### 🐛 Bug Fixes | Bug 修复

* **weibo:** 修复长文本判断逻辑不准确的问题 ([99591c5](https://github.com/99591c50474a24e99388776b9d4d0e117211b2cc))


### ✨ Features | 新功能

* **provider:** 实现图片显示切换功能并更新相关配置描述 ([000f04a](https://github.com/000f04a148bc9ac817b45a6092cd1654962ee26c))
* **style:** 优化隐藏图片功能的样式处理 ([9396d5d](https://github.com/9396d5d806389cd2642fdda2f3fe36e5f6bb715d))
* **zhihu:** 添加图片显示/隐藏功能 ([3a88079](https://github.com/3a88079f9b8165fb031995e311b76eeda320f4d2))
* **zhihu:** 优化图片显示控制逻辑并支持手动切换 ([9525620](https://github.com/952562074e3bc9d97cf747233d21ddc543b05230))
* **zhihuWebProvider:** 添加图片显示配置项支持 ([92f7cee](https://github.com/92f7cee0f9d409d3ca88dd9800f9b163fb880330))

## [8.38.0](https://github.com/ylw1997/touchFish/compare/v8.37.0...v8.38.0) (2025-09-26)


### 🐛 Bug Fixes | Bug 修复

* **weibo:** 调整加载状态间距以优化视觉效果 ([98f69eb](https://github.com/98f69eb0e4aeeb2a5fac710ae991adeab97b8519))


### ✨ Features | 新功能

* **zhihu:** 添加评论加载状态并优化加载动画显示逻辑 ([1ea7bb0](https://github.com/1ea7bb024f3a7da47371cd932706f73c2e3a23ab))

## [8.37.0](https://github.com/ylw1997/touchFish/compare/v8.36.0...v8.37.0) (2025-09-26)


### ✨ Features | 新功能

* **nga:** 添加 NGA 论坛支持与 Token 设置功能 ([964f809](https://github.com/964f80972afc571c6f15dfe378756cc926f37365))

## [8.36.0](https://github.com/ylw1997/touchFish/compare/v8.35.0...v8.36.0) (2025-09-26)


### 🐛 Bug Fixes | Bug 修复

* **weibo:** 更新微博列表请求参数以支持分页加载 ([10f4b8f](https://github.com/10f4b8fefae6ef20e8ac4992c555d05798008c8c))


### ✨ Features | 新功能

* **weibo:** 优化评论加载状态显示与类型定义 ([3557939](https://github.com/35579397e0a4e798ca9cc315d5d5aaf80e4a56d2))
* **YImg:** 优化图片懒加载观察器配置 ([8091770](https://github.com/809177082138ef7e83aff6e6e7af5be099ccdc5e))

## [8.35.0](https://github.com/ylw1997/touchFish/compare/v8.34.2...v8.35.0) (2025-09-25)


### ✨ Features | 新功能

* **weiboProvider:** 重构消息处理逻辑并增强错误捕获 ([4efa42c](https://github.com/4efa42cc0df50e36bf105de1bc3f4d0bd47009be))

### [8.34.2](https://github.com/ylw1997/touchFish/compare/v8.34.1...v8.34.2) (2025-09-25)


### 🐛 Bug Fixes | Bug 修复

* **ZhihuItem:** 修正知乎链接构造逻辑 ([6993941](https://github.com/699394187a94c0fcd31aa1f13f8b8c1c54adb37d))

### [8.34.1](https://github.com/ylw1997/touchFish/compare/v8.34.0...v8.34.1) (2025-09-25)


### 🐛 Bug Fixes | Bug 修复

* **package:** 更新插件描述，移除 ithome 文字 ([11c800c](https://github.com/11c800ca663c25cbf5a8930d91264ccc646fc9ba))

## [8.34.0](https://github.com/ylw1997/touchFish/compare/v8.33.0...v8.34.0) (2025-09-25)


### ✨ Features | 新功能

* **zhihu:** 添加分享功能并完善数据结构 ([a27ac68](https://github.com/a27ac68ab630337b2b61892b6b5c23adca54f3f1))

## [8.33.0](https://github.com/ylw1997/touchFish/compare/v8.32.0...v8.33.0) (2025-09-25)


### ✨ Features | 新功能

* **weibo:** 优化列表加载状态显示逻辑 ([a82c26e](https://github.com/a82c26ec0686e9e20f16ca0c992f47aedf12af79))
* **zhihu:** 优化列表加载状态显示逻辑 ([ffbae0a](https://github.com/ffbae0ad6e69b99e22560103915489b417740cce))

## [8.32.0](https://github.com/ylw1997/touchFish/compare/v8.31.0...v8.32.0) (2025-09-25)


### 🐛 Bug Fixes | Bug 修复

* **useWeiboAction:** 清空列表时不再重置总数 ([bdb03f1](https://github.com/bdb03f1adc38c45006fbcaf18999c65d54a826d5))


### ✨ Features | 新功能

* **weibo:** 修改请求方法实现并更新文件注释 ([d65b4a6](https://github.com/d65b4a6ceba41b39b27ad400f67c3d93ee1fc927))

## [8.31.0](https://github.com/ylw1997/touchFish/compare/v8.30.0...v8.31.0) (2025-09-25)


### 🐛 Bug Fixes | Bug 修复

* **weibo:** 增加 axios 请求超时时间 ([a63281c](https://github.com/a63281ce36458694e9fb1b824e9a4c8a9860c6a3))


### ✨ Features | 新功能

* **weibo:** 优化搜索功能与文本解析逻辑 ([8db2412](https://github.com/8db24120daa3f6097039dc347f47576180cd4ce8))

## [8.30.0](https://github.com/ylw1997/touchFish/compare/v8.28.0...v8.30.0) (2025-09-25)


### 📦 Chores | 其他更新

* **release:** 8.29.0 ([002483a](https://github.com/002483ab01b35b2e1aeaf77585c57c7e17231ec3))


### 🐛 Bug Fixes | Bug 修复

* **weibo/public/back.svg:** 调整 SVG 图标缩放和位置 ([0f0e8bf](https://github.com/0f0e8bffb4ef1f507cf6af5dc08ab1ce39c6d04c))


### ✨ Features | 新功能

* **weibo:** 添加视频下载请求的超时配置 ([55ca210](https://github.com/55ca2109e5100ce4f6c434bca14f2c14866928f5))
* **weibo:** 为多个组件添加图标支持并优化文本解析功能 ([25a3c52](https://github.com/25a3c52a7d37f37de6065f4691408713feec0c88))
* **weibo:** 移除评论图片固定宽高并优化样式 ([65a4907](https://github.com/65a49071d32820d91429408ecee044369144a98d))
* **weibo:** 优化微博请求头逻辑并统一超时设置 ([204cffb](https://github.com/204cffb4d171c11304489fdd3287c9aedc1cf07f))
* **YImg:** 添加加载状态并优化图片和视频渲染逻辑 ([95f8837](https://github.com/95f8837d1c3e1d6d9e42d633256c8258f285a7ca))

## [8.29.0](https://github.com/ylw1997/touchFish/compare/v8.28.0...v8.29.0) (2025-09-24)


### ✨ Features | 新功能

* **YImg:** 添加加载状态并优化图片和视频渲染逻辑 ([95f8837](https://github.com/95f8837d1c3e1d6d9e42d633256c8258f285a7ca))

## [8.28.0](https://github.com/ylw1997/touchFish/compare/v8.27.3...v8.28.0) (2025-09-24)


### 🐛 Bug Fixes | Bug 修复

* **weibo:** 调整 SearchDrawer 和 UserDetailDrawer 高度逻辑为 auto ([ce56ab5](https://github.com/ce56ab5a1f55d85311b0182e96c3f9d983801a3d))


### ✨ Features | 新功能

* **weibo:** 添加返回图标并更新图片组件的 fallback 配置 ([e28f33d](https://github.com/e28f33dc06716a83ebb4bfc02a29aec2586df196))

### [8.27.3](https://github.com/ylw1997/touchFish/compare/v8.27.2...v8.27.3) (2025-09-24)


### 🐛 Bug Fixes | Bug 修复

* **loader:** 更新文件编辑时间并调整样式 ([e55a579](https://github.com/e55a579644894413fae91821b61b2f9e73cd299d))

### [8.27.2](https://github.com/ylw1997/touchFish/compare/v8.27.1...v8.27.2) (2025-09-24)

### [8.27.1](https://github.com/ylw1997/touchFish/compare/v8.27.0...v8.27.1) (2025-09-24)


### 🐛 Bug Fixes | Bug 修复

* **weibo:** 更新评论组件动画标签并优化样式 ([a08f92c](https://github.com/a08f92cace9147725577c3a0e968ebd680a2f98a))

## [8.27.0](https://github.com/ylw1997/touchFish/compare/v8.26.0...v8.27.0) (2025-09-24)


### ✨ Features | 新功能

* **animations:** 为列表项添加进入动画效果 ([88d012c](https://github.com/88d012c88fe10edbd908268f2af6961e69fde6e1))
* **weibo:** 实现长微博展开与收起功能 ([4fc87c4](https://github.com/4fc87c4c435e024ce790eef28da0b412cf055f77))
* **weibo:** 引入 framer-motion 实现动画效果 ([be20553](https://github.com/be20553eca00990011c1e2d754949d37f10cef85))
* **weibo:** 优化微博卡片图片和视频显示 ([47acfd5](https://github.com/47acfd523dd6517180368668b61510f24b380822))


### ♻ Code Refactoring | 代码重构

* **weibo:** 重构 WeiboCard 组件结构 ([aa48d62](https://github.com/aa48d626a9a5946db32a4bb21a366e67fc5f8562))

## [8.26.0](https://github.com/ylw1997/touchFish/compare/v8.25.1...v8.26.0) (2025-09-24)


### ✨ Features | 新功能

* **weibo:** 优化微博列表数据加载逻辑与评论获取逻辑 ([4d4a9c1](https://github.com/4d4a9c15b112dec1f75c13d496875ba7316168dc))


### 🐛 Bug Fixes | Bug 修复

* **weibo:** 移除 max_id 参数逻辑并优化列表加载机制 ([327dec3](https://github.com/327dec30f27aa43fdb3812141d831e27f56589d9))

### [8.25.1](https://github.com/ylw1997/touchFish/compare/v8.25.0...v8.25.1) (2025-09-23)


### 👷‍ Build System | 构建

* **vscodeignore:** 添加 temp 目录到忽略文件 ([e54a38e](https://github.com/e54a38ef2d46277d1432380355b72384b4ac41c4))

## [8.25.0](https://github.com/ylw1997/touchFish/compare/v8.24.0...v8.25.0) (2025-09-23)


### 🐛 Bug Fixes | Bug 修复

* **request:** 优化请求处理逻辑中的错误处理和资源清理 ([0ba5c95](https://github.com/0ba5c95d5c0c9ced7055e2412bfa5a2b374e88e3))


### ✨ Features | 新功能

* **weibo:** 优化图片加载逻辑并移除预览功能 ([1a59b8a](https://github.com/1a59b8a0b84e0e625bf9f5d6fe378bc83ec4383d))

## [8.24.0](https://github.com/ylw1997/touchFish/compare/v8.23.0...v8.24.0) (2025-09-23)


### ✨ Features | 新功能

* **UserDetailDrawer:** 实现关注和取关功能的封装与调用 ([c993eaf](https://github.com/c993eaf7623c498b8540cfefa56102e74f630692))
* **weibo:** 移除全局视频播放控制逻辑，优化媒体展示组件 ([b84583b](https://github.com/b84583b570adc7b8fc516dc1f82eaa7cc7ec3844))
* **weibo:** 支持混合媒体微博的展示与播放 ([78b74fc](https://github.com/78b74fcceced3a55b8f3b7c2149364f68ccde897))


### 🐛 Bug Fixes | Bug 修复

* **request:** 调整 request 方法参数及逻辑处理 ([6261e51](https://github.com/6261e5159a8d58e533df3bd4511668d5a11ddd84))

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
