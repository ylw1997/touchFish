import http from "node:http";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";

const host = process.env.DOUYIN_AUTH_HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.DOUYIN_AUTH_PORT ?? "8787", 10);
const sessionLifetimeMs = 2 * 60 * 1000;
const sessions = new Map();

let browserPromise;

function browserInstance() {
  browserPromise ??= chromium.launch({ headless: true });
  return browserPromise;
}

function sendJSON(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function publicSession(session) {
  return {
    id: session.id,
    state: session.state,
    message: session.message,
    expiresAt: new Date(session.expiresAt).toISOString(),
  };
}

async function closeSession(session) {
  if (session.closed) return;
  session.closed = true;
  clearTimeout(session.expirationTimer);
  try {
    await session.context.close();
  } catch {
    // 浏览器进程退出时上下文可能已经关闭。
  }
}

async function expireSession(session) {
  if (session.state !== "confirmed" && session.state !== "consumed") {
    session.state = "expired";
    session.message = "二维码已过期，请重新生成";
  }
  await closeSession(session);
  setTimeout(() => sessions.delete(session.id), 30_000).unref();
}

async function collectLoginCookie(session) {
  if (session.finalizing || session.state === "confirmed") return;
  session.finalizing = true;
  session.state = "finalizing";
  session.message = "正在完成登录";

  try {
    let cookies = [];
    for (let attempt = 0; attempt < 10; attempt += 1) {
      // 只导出访问主站时浏览器真正会携带的 Cookie，避免把登录子域
      // 的同名 Cookie 拼进请求头，造成服务端读取到错误值。
      cookies = await session.context.cookies("https://www.douyin.com/");
      if (
        cookies.some((cookie) => cookie.name === "sessionid") &&
        cookies.some((cookie) => cookie.name === "sessionid_ss")
      ) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const now = Date.now() / 1000;
    const applicableCookies = cookies.filter(
      (cookie) =>
        cookie.domain.endsWith("douyin.com") &&
        (cookie.expires === -1 || cookie.expires > now),
    );

    if (
      !applicableCookies.some((cookie) => cookie.name === "sessionid") ||
      !applicableCookies.some((cookie) => cookie.name === "sessionid_ss")
    ) {
      throw new Error("扫码已确认，但没有收到完整登录 Cookie");
    }

    session.cookie = applicableCookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    session.state = "confirmed";
    session.message = "登录成功";
  } catch (error) {
    session.state = "failed";
    session.message = error instanceof Error ? error.message : "登录失败";
    await closeSession(session);
  } finally {
    session.finalizing = false;
  }
}

async function createLoginSession() {
  const browser = await browserInstance();
  const context = await browser.newContext({
    locale: "zh-CN",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const id = randomUUID();
  const session = {
    id,
    context,
    page,
    state: "starting",
    message: "正在生成二维码",
    cookie: null,
    finalizing: false,
    closed: false,
    expiresAt: Date.now() + sessionLifetimeMs,
    expirationTimer: null,
  };

  sessions.set(id, session);
  session.expirationTimer = setTimeout(
    () => void expireSession(session),
    sessionLifetimeMs,
  );
  session.expirationTimer.unref();

  page.on("response", (response) => {
    if (!response.url().includes("/passport/web/check_qrconnect/")) return;

    void response
      .json()
      .then((payload) => {
        const status = payload?.data?.status;
        if (status === "scanned") {
          session.state = "scanned";
          session.message = "已扫码，请在手机上确认";
        } else if (status === "confirmed") {
          void collectLoginCookie(session);
        } else if (status === "expired") {
          void expireSession(session);
        }
      })
      .catch(() => {
        // 非 JSON 或页面取消请求时等待下一次轮询。
      });
  });

  try {
    // “关注”页面属于登录后功能，未登录时会立即显示扫码弹窗。
    await page.goto("https://www.douyin.com/follow", {
      // 关注页会持续加载推荐资源，不等待 DOMContentLoaded。
      waitUntil: "commit",
      timeout: 20_000,
    });

    const qrContainer = page.locator("#animate_qrcode_container");
    const qrCode = qrContainer.locator('img[aria-label="二维码"]').first();
    try {
      await qrCode.waitFor({ state: "visible", timeout: 20_000 });
    } catch {
      const loginButton = page.getByRole("button", { name: "登录" }).last();
      await loginButton.click({ timeout: 5_000 });
      await qrCode.waitFor({ state: "visible", timeout: 15_000 });
    }

    const source = await qrCode.getAttribute("src");
    let qrImageBase64;
    if (source?.startsWith("data:image/png;base64,")) {
      qrImageBase64 = source.slice("data:image/png;base64,".length);
    } else {
      // 页面结构变化时仍可通过元素截图返回二维码。
      const qrImage = await qrCode.screenshot({ type: "png" });
      qrImageBase64 = qrImage.toString("base64");
    }
    session.state = "pending";
    session.message = "请使用抖音 App 扫码登录";

    return {
      ...publicSession(session),
      qrImageBase64,
    };
  } catch (error) {
    session.state = "failed";
    session.message = error instanceof Error ? error.message : "二维码生成失败";
    await closeSession(session);
    throw error;
  }
}

async function consumeSession(session) {
  if (session.state !== "confirmed" || !session.cookie) {
    return null;
  }

  const cookie = session.cookie;
  session.cookie = null;
  session.state = "consumed";
  session.message = "登录凭证已领取";
  await closeSession(session);
  sessions.delete(session.id);
  return cookie;
}

function route(request, response) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJSON(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && url.pathname === "/v1/login-sessions") {
    void createLoginSession()
      .then((session) => sendJSON(response, 201, session))
      .catch((error) =>
        sendJSON(response, 502, {
          error: error instanceof Error ? error.message : "二维码生成失败",
        }),
      );
    return;
  }

  const match = url.pathname.match(
    /^\/v1\/login-sessions\/([0-9a-f-]+)(?:\/(consume))?$/i,
  );
  if (!match) {
    sendJSON(response, 404, { error: "Not Found" });
    return;
  }

  const session = sessions.get(match[1]);
  if (!session) {
    sendJSON(response, 404, { error: "登录会话不存在或已过期" });
    return;
  }

  if (request.method === "GET" && !match[2]) {
    sendJSON(response, 200, publicSession(session));
    return;
  }

  if (request.method === "POST" && match[2] === "consume") {
    void consumeSession(session).then((cookie) => {
      if (!cookie) {
        sendJSON(response, 409, {
          error: "登录尚未完成",
          ...publicSession(session),
        });
        return;
      }
      sendJSON(response, 200, { cookie });
    });
    return;
  }

  if (request.method === "DELETE" && !match[2]) {
    session.state = "cancelled";
    session.message = "登录已取消";
    void closeSession(session).then(() => {
      sessions.delete(session.id);
      sendJSON(response, 200, { ok: true });
    });
    return;
  }

  sendJSON(response, 405, { error: "Method Not Allowed" });
}

const server = http.createServer(route);
server.requestTimeout = 45_000;

server.listen(port, host, () => {
  console.log(`[DouyinAuth] listening on http://${host}:${port}`);
});

async function shutdown() {
  server.close();
  await Promise.all([...sessions.values()].map(closeSession));
  sessions.clear();
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
  }
}

process.once("SIGINT", () => void shutdown().finally(() => process.exit(0)));
process.once("SIGTERM", () => void shutdown().finally(() => process.exit(0)));
