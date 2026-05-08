# TouchFish Server 启动脚本 (PowerShell)
# 用法: .\start-server.ps1 [dev|docker]

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "docker", "")]
    [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host "[TouchFish] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[TouchFish] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[TouchFish] $Message" -ForegroundColor Red
}

if ($Mode -eq "dev" -or $Mode -eq "") {
    Write-Info "Starting TouchFish server in development mode..."
    Write-Info "Server will be available at http://127.0.0.1:3210"
    Write-Info "Press Ctrl+C to stop"
    Write-Host ""
    node src/main.js
}
elseif ($Mode -eq "docker") {
    Write-Info "Starting TouchFish server with Docker..."

    # 检查 Docker 是否安装
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed. Please install Docker first."
        exit 1
    }

    # 检查 docker-compose 是否可用
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "docker-compose is not installed. Please install Docker Compose first."
        exit 1
    }

    # 构建并启动
    docker-compose up --build -d

    if ($LASTEXITCODE -eq 0) {
        Write-Success "TouchFish server is running in Docker!"
        Write-Info "Server URL: http://localhost:3210"
        Write-Info "View logs: docker-compose logs -f"
        Write-Info "Stop server: docker-compose down"
    }
    else {
        Write-Error "Failed to start Docker container. Check logs with: docker-compose logs"
        exit 1
    }
}
