FROM node:22-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && npx playwright install --with-deps chromium \
    && npm cache clean --force \
    && rm -rf /var/lib/apt/lists/*
COPY server.cjs ./

ENV HOST=0.0.0.0
ENV PORT=8787
EXPOSE 8787

CMD ["node", "server.cjs"]
