#!/bin/bash

# TouchFish Server 启动脚本 (Linux/macOS)
# 用法: ./start-server.sh [dev|docker]

set -e

MODE="${1:-dev}"

info() {
    echo "[TouchFish] $1"
}

success() {
    echo "[TouchFish] ✓ $1"
}

error() {
    echo "[TouchFish] ✗ $1" >&2
    exit 1
}

case "$MODE" in
    dev)
        info "Starting server in development mode..."
        info "Server will be available at http://127.0.0.1:3210"
        info "Press Ctrl+C to stop"
        echo
        node src/main.js
        ;;
    docker)
        info "Starting server with Docker..."

        # 检查 Docker
        if ! command -v docker &> /dev/null; then
            error "Docker is not installed. Please install Docker first."
        fi

        if ! command -v docker-compose &> /dev/null; then
            error "docker-compose is not installed. Please install Docker Compose first."
        fi

        # 构建并启动
        docker-compose up --build -d

        success "TouchFish server is running in Docker!"
        info "Server URL: http://localhost:3210"
        info "View logs: docker-compose logs -f"
        info "Stop server: docker-compose down"
        ;;
    *)
        echo "Usage: $0 [dev|docker]"
        echo "  dev    - Run directly with Node.js (default)"
        echo "  docker - Run with Docker Compose"
        exit 1
        ;;
esac
