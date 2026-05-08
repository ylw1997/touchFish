# TouchFish Local Server

TouchFish 本地 API 服务，支持 Docker 部署。

## 快速启动

### 方式一：直接运行（开发模式）

```powershell
# Windows PowerShell
.\start-server.ps1 dev
# 或简写
.\start-server.ps1

# 或直接用 Node
node src/main.js
```

```bash
# Linux/macOS
./start-server.sh dev
# 或简写
./start-server.sh
```

打开 http://127.0.0.1:3210 访问验证台。

### 方式二：Docker 部署（推荐）

```powershell
# Windows
.\start-server.ps1 docker

# 或手动操作
docker-compose up --build -d
```

```bash
# Linux/macOS
./start-server.sh docker

# 或手动操作
docker-compose up --build -d
```

Docker 启动后：
- 服务地址：http://localhost:3210
- 查看日志：`docker-compose logs -f`
- 停止服务：`docker-compose down`
- 查看健康状态：`docker-compose ps`

## 配置说明

### 环境变量

复制 `.env.example` 为 `.env` 并修改：

```bash
# 运行环境
NODE_ENV=production

# 服务端口（宿主机映射端口）
PORT=3210
```

### 本地凭据

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

Docker 模式下，数据会持久化到 `touchfish-data` 卷中。

## 验证

```powershell
# 运行所有测试
npm test

# 或单独运行
node test/signers.test.js
node test/router.test.js
node test/health.test.js

# 接口连通性验证（需要配置 Cookie）
node scripts/validate-apis.js
```

## 项目结构

```
server/
├── src/              # 服务端代码
│   ├── main.js       # 入口
│   ├── app.js        # HTTP 服务
│   ├── apiRegistry.js # API 注册表
│   ├── signers.js    # 签名工具
│   └── ...
├── web/              # 验证台前端
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── test/             # 测试文件
├── scripts/          # 工具脚本
├── data/             # 数据目录（gitignore）
├── Dockerfile        # Docker 镜像定义
├── docker-compose.yml # Docker Compose 配置
├── .env.example      # 环境变量模板
└── start-server.*    # 启动脚本
```

## Docker 健康检查

容器内置健康检查，每 30 秒检测一次 `/health` 端点：

```bash
# 查看健康状态
docker-compose ps
docker inspect --format='{{.State.Health.Status}}' touchfish-server
```
