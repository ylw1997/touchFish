# 微信读书阅读笔记验证

接口、错误处理和回读测试随根项目 Mocha 测试运行：

```powershell
corepack pnpm test
```

浏览器回归使用项目已有 Playwright 和本机 Chrome。先启动前端，再运行：

```powershell
corepack pnpm --filter weread dev --host 127.0.0.1
node --test tools/weread/reader.test.mjs
```

可用 `WEREAD_TEST_URL` 覆盖开发服务器地址，`WEREAD_BROWSER` 覆盖 Playwright 浏览器 channel。
测试用模拟的 VS Code 消息桥验证坐标、划线、私密想法、重叠标记和未确认写入；不会调用微信读书账号接口。

真实账号验收需在 VS Code 微信读书视图登录后，分别保存划线、公开想法和私密想法，再在手机微信读书检查原文位置和可见性。

Web 协议依据：官方 `2.21e0ad32.js`、`utils.2f050835.js`、`9.625560b7.js`。
划线 `markText` 使用 UTF-8 Base64；选文想法使用 `type:1`，内容保持原文。
HTML 选区坐标为原始完整章节 HTML 的 UTF-16 源位置，实体须独立映射。
