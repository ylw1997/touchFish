FROM node:22-alpine

WORKDIR /app
COPY package.json ./
COPY src ./src
COPY web ./web

ENV HOST=0.0.0.0
ENV PORT=3210
EXPOSE 3210

CMD ["node", "src/main.js"]
