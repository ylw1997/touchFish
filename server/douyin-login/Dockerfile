FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.cjs ./

ENV HOST=0.0.0.0
ENV PORT=8787
EXPOSE 8787

CMD ["node", "server.cjs"]
