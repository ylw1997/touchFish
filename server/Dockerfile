FROM node:22-alpine

WORKDIR /app

# 安装依赖
COPY package.json ./
RUN npm install --production

# 复制应用代码
COPY src ./src
COPY web ./web

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 创建数据目录并设置权限
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# 切换用户
USER nodejs

ENV HOST=0.0.0.0
ENV PORT=3210
ENV CONFIG_PATH=/app/data/config.json

EXPOSE 3210

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3210/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "src/main.js"]
