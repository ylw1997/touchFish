@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: TouchFish Server 启动脚本 (Windows CMD)
:: 用法: start-server.cmd [dev|docker]

set "MODE=%~1"
if "%~1"=="" set "MODE=dev"

if /I "%MODE%"=="dev" goto :dev
if /I "%MODE%"=="docker" goto :docker
goto :usage

:dev
echo [TouchFish] Starting server in development mode...
echo [TouchFish] Server will be available at http://127.0.0.1:3210
echo [TouchFish] Press Ctrl+C to stop
echo.
node src/main.js
goto :end

:docker
echo [TouchFish] Starting server with Docker...

:: 检查 Docker
where docker >nul 2>nul
if errorlevel 1 (
    echo [TouchFish] Error: Docker is not installed
    exit /b 1
)

where docker-compose >nul 2>nul
if errorlevel 1 (
    echo [TouchFish] Error: docker-compose is not installed
    exit /b 1
)

docker-compose up --build -d
if errorlevel 1 (
    echo [TouchFish] Error: Failed to start Docker container
    echo [TouchFish] Check logs with: docker-compose logs
    exit /b 1
)

echo [TouchFish] Server is running in Docker!
echo [TouchFish] Server URL: http://localhost:3210
echo [TouchFish] View logs: docker-compose logs -f
echo [TouchFish] Stop server: docker-compose down
goto :end

:usage
echo Usage: start-server.cmd [dev^|docker]
echo   dev    - Run directly with Node.js (default)
echo   docker - Run with Docker Compose
goto :end

:end
