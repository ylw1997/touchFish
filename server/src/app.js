const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { endpoints, platforms } = require("./catalog");
const { createConfigStore } = require("./configStore");
const { commonHeaders, fetchJson } = require("./upstream");
const { executeApiEndpoint } = require("./apiRegistry");
const { readCachedReport, runHealthReport } = require("./healthReport");

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

function sendJson(response, status, payload) {
  response.writeHead(status, jsonHeaders);
  response.end(JSON.stringify(payload, null, 2));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function staticContentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  return "application/octet-stream";
}

function sendStatic(response, pathname) {
  const webRoot = path.join(__dirname, "..", "web");
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(webRoot, safePath));
  if (!filePath.startsWith(webRoot) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }
  response.writeHead(200, { "content-type": staticContentType(filePath) });
  response.end(fs.readFileSync(filePath));
  return true;
}

function requireParam(url, name) {
  const value = url.searchParams.get(name);
  if (!value) {
    const error = new Error(`缺少参数: ${name}`);
    error.statusCode = 400;
    throw error;
  }
  return value;
}

function createApp(options = {}) {
  const fetchImpl = options.fetch || globalThis.fetch;
  const configStore = options.configStore || createConfigStore(options.configPath);

  return http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");

    try {
      if (request.method === "GET" && sendStatic(response, url.pathname)) return;

      if (request.method === "GET" && url.pathname === "/health") {
        sendJson(response, 200, {
          ok: true,
          service: "touchfish-server",
          mode: "local",
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/catalog") {
        sendJson(response, 200, { platforms, endpoints });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/config") {
        sendJson(response, 200, { ok: true, data: configStore.all() });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/health-report") {
        sendJson(response, 200, { ok: true, data: readCachedReport() });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/health-report/run") {
        const body = JSON.parse((await readBody(request)) || "{}");
        const report = await runHealthReport({
          endpointIds: body.endpointIds,
          fetchImpl,
          configStore,
        });
        sendJson(response, 200, { ok: true, data: report });
        return;
      }

      if (request.method === "POST" && url.pathname.startsWith("/api/config/")) {
        const key = decodeURIComponent(url.pathname.replace("/api/config/", ""));
        const body = JSON.parse((await readBody(request)) || "{}");
        configStore.set(key, body.value || "");
        sendJson(response, 200, { ok: true, key });
        return;
      }

      const requestBody =
        request.method === "GET" || request.method === "HEAD"
          ? ""
          : await readBody(request);
      const routed = await executeApiEndpoint({
        method: request.method,
        pathname: url.pathname,
        url,
        fetchImpl,
        configStore,
        body: requestBody,
      });
      if (routed) {
        sendJson(response, routed.status || 200, routed);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/ithome/news") {
        sendJson(response, 200, await fetchJson(fetchImpl, "https://api.ithome.com/json/newslist/news?r=0"));
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/ithome/detail") {
        const id = requireParam(url, "id");
        sendJson(response, 200, await fetchJson(fetchImpl, `https://api.ithome.com/json/newscontent/${id}`));
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/weibo/feed") {
        const feedPath = url.searchParams.get("path") || "/allGroups";
        const cookie = configStore.get("weiboCookie");
        sendJson(
          response,
          200,
          await fetchJson(fetchImpl, `https://weibo.com/ajax/feed${feedPath}`, {
            headers: commonHeaders(cookie, {
              referer: "https://weibo.com/",
              "x-xsrf-token": cookie?.match(/XSRF-TOKEN=(.*?);/)?.[1] || "",
            }),
          }),
        );
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/bilibili/nav") {
        const cookie = configStore.get("bilibiliCookie");
        sendJson(
          response,
          200,
          await fetchJson(fetchImpl, "https://api.bilibili.com/x/web-interface/nav", {
            headers: commonHeaders(cookie, {
              referer: "https://www.bilibili.com/",
              origin: "https://www.bilibili.com",
            }),
          }),
        );
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/qqmusic/search") {
        const keyword = requireParam(url, "keyword");
        const upstreamUrl = new URL("https://c.y.qq.com/soso/fcgi-bin/client_search_cp");
        upstreamUrl.searchParams.set("p", url.searchParams.get("page") || "1");
        upstreamUrl.searchParams.set("n", url.searchParams.get("num") || "20");
        upstreamUrl.searchParams.set("w", keyword);
        sendJson(
          response,
          200,
          await fetchJson(fetchImpl, upstreamUrl.toString(), {
            headers: commonHeaders("", { referer: "https://y.qq.com/" }),
          }),
        );
        return;
      }

      sendJson(response, 404, { ok: false, error: "Not Found" });
    } catch (error) {
      sendJson(response, error.statusCode || 500, {
        ok: false,
        error: error.message || "Internal Server Error",
      });
    }
  });
}

module.exports = { createApp };
