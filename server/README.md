# TouchFish Local Server

## 启动

```powershell
node src/main.js
```

打开 `http://127.0.0.1:3210`。

## 本地凭据

把 Cookie/Token 放到 `server/data/config.json`。该目录已加入 `.gitignore`，不会进入 git。

支持两种 key：

```json
{
  "touchfish.weiboCookie": "...",
  "touchfish.bilibiliCookie": "..."
}
```

或：

```json
{
  "weiboCookie": "...",
  "bilibiliCookie": "..."
}
```

## 验证

```powershell
node test/signers.test.js
node test/router.test.js
node scripts/validate-apis.js
```
