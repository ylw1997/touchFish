# XHS Signer Tools

这个目录专门用来维护和验证小红书签名。

## 目录说明

- `test-xhs.js`
  - 直接在 Node 环境里加载 `src/utils/xhs.raw.js`
  - 检查导出函数是否存在
  - 生成本地签名样例
  - 可选地发起真实接口验证

## 什么时候用

- 更新了 `src/utils/xhs.raw.js` 之后
- 怀疑 `X-S` / `xs_common` 逻辑失效时
- 想快速判断问题是“签名跑不起来”还是“接口参数不匹配”时

## 推荐流程

1. 替换 `src/utils/xhs.raw.js`
2. 运行本地签名测试
3. 如需真实验证，再带 Cookie 跑评论 / 用户发帖接口
4. 运行 `pnpm compile`
5. 在 VS Code 执行 `Developer: Reload Window`

## 命令

本地签名样例：

```bash
pnpm xhs:test
```

带真实 Cookie 跑线上接口：

```bash
$env:XHS_COOKIE='你的cookie'
pnpm xhs:test:live
```

## 可选环境变量

- `XHS_COOKIE`
  - 真实 Cookie，跑线上接口时必填
- `XHS_NOTE_ID`
  - 指定评论测试的 note id
- `XHS_XSEC_TOKEN`
  - 指定评论 / 用户发帖测试用的 xsec_token
- `XHS_USER_ID`
  - 指定用户发帖测试的 user_id
- `XHS_CURSOR`
  - 用户发帖的 cursor，默认空串
如果没有显式传 `XHS_NOTE_ID / XHS_XSEC_TOKEN / XHS_USER_ID`，脚本会先请求首页推荐，自动抽一条样例数据继续验证。

## 结果怎么判断

- 只跑本地签名成功
  - 说明 `xhs.raw.js` 至少能在 Node 里执行
- 真实接口返回 `code = 0`
  - 说明 Cookie、签名、请求参数链路都通
- 真实接口返回 `406`
  - 优先检查该 GET 接口是不是签了错误的 query 字符串
- 运行时报 `Cannot find module`
  - 先检查新的 `xhs.raw.js` 有没有引入额外依赖
