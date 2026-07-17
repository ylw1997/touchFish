# 抖音扫码登录服务

该服务只负责扫码登录。视频接口仍由 Apple TV 直接访问抖音。

## 本地运行

```bash
pnpm install
npx playwright install chromium
pnpm tv-auth
```

默认监听 `127.0.0.1:8787`，适用于同一台 Mac 上运行的 tvOS 模拟器。

真机调试时可以临时监听局域网：

```bash
DOUYIN_AUTH_HOST=0.0.0.0 pnpm tv-auth
```

局域网明文模式只用于开发。公开部署前必须增加 HTTPS、设备公钥加密、限流和访问审计（不得记录 Cookie）。

## API

- `POST /v1/login-sessions`：创建隔离浏览器会话并返回二维码。
- `GET /v1/login-sessions/{id}`：查询 `pending/scanned/confirmed` 状态。
- `POST /v1/login-sessions/{id}/consume`：一次性领取 Cookie。
- `DELETE /v1/login-sessions/{id}`：取消并销毁浏览器会话。

Cookie 只保存在内存中；领取、取消或两分钟超时后立即销毁对应的 BrowserContext。
