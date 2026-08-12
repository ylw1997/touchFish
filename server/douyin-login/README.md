# TouchFish 抖音扫码登录服务

该服务使用真实 Chromium 打开抖音登录页，将二维码提供给 TouchFish 客户端，并在用户扫码确认后收集、验证登录 Cookie。

当前阶段用于验证扫码链路，尚未接入 Apple TV。

## 已验证结果

2026-08-12 在 Mac mini 的可见 Chromium 环境完成真实扫码：

- 成功提取抖音登录二维码；
- 扫码确认后成功收集 58 个 Cookie 字段；
- 使用 `/aweme/v1/web/user/profile/self/` 验证登录态成功；
- Cookie 一次性领取成功，重复领取返回 `404`。

同一网络在 Windows 无头 Chromium 中会直接进入“验证码中间页”。因此普通云服务器的纯无头容器可能触发抖音风控；正式部署前必须在目标服务器重新扫码验证。遇到该情况时，使用 `HEADLESS=false` 配合桌面环境/VNC，或将服务运行在长期在线的 Mac mini 上。

## 本机运行

要求 Node.js 20 或更高版本：

```bash
npm install
npx playwright install chromium
npm start
```

打开 `http://127.0.0.1:8787`，点击“生成二维码”并使用抖音 App 扫码。页面仅显示 Cookie 字段数和总长度，不会显示完整 Cookie。

如需观察浏览器或手动处理安全验证：

```bash
HEADLESS=false npm start
```

## Docker 部署

```bash
docker build -t touchfish-douyin-login .
docker run --rm -p 127.0.0.1:8787:8787 touchfish-douyin-login
```

生产环境必须在服务前配置 HTTPS 反向代理，不要直接向公网暴露 HTTP 端口。

如果服务器没有桌面环境，先用默认无头模式验证；若生成二维码时报“未能从抖音登录页提取二维码”或页面标题为“验证码中间页”，需要给容器提供虚拟桌面并设置 `HEADLESS=false`，不能靠重复请求绕过验证。

## API

- `POST /api/sessions`：创建一次性扫码会话，返回 `id` 和 `claimToken`。
- `GET /api/sessions/:id/qr`：读取二维码 PNG。
- `GET /api/sessions/:id`：查询扫码与验证状态。
- `POST /api/sessions/:id/claim`：一次性领取完整 Cookie，领取后立即销毁会话。

除创建会话外，所有会话接口必须携带请求头：

```text
X-Claim-Token: <claimToken>
```

## 环境变量

| 名称 | 默认值 | 说明 |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | 监听地址，容器内设置为 `0.0.0.0` |
| `PORT` | `8787` | 监听端口 |
| `HEADLESS` | `true` | 设置为 `false` 可显示 Chromium |
| `SESSION_TTL_MS` | `300000` | 一次性会话有效期 |
| `MAX_SESSIONS` | `3` | 最大并发浏览器会话数 |
| `STANDBY_REFRESH_AGE_MS` | `30000` | 预热二维码后台换新时间 |
| `STANDBY_MAX_AGE_MS` | `90000` | 允许发给客户端的预热二维码最大年龄 |

## 安全边界

- 完整 Cookie 不写入磁盘、不打印到日志、不出现在 URL 中。
- 会话 ID 与领取密钥分别随机生成；二维码、状态及 Cookie 领取均需领取密钥。
- Cookie 只有验证成功后才能领取，并且只能领取一次。
- 当前内存会话适合单实例部署；多实例部署需要粘性会话或共享的加密状态存储。
- 公网反向代理应对 `POST /api/sessions` 配置按 IP 限流，避免恶意创建 Chromium 会话耗尽服务器资源。
