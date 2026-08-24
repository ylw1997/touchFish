import { ChildProcess, spawn } from "child_process";
import { createHash } from "crypto";
import { existsSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { get as httpGet } from "http";
import * as WebSocket from "ws";

type JsonObject = Record<string, any>;

interface PendingCommand {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

class CdpClient {
  private nextId = 1;
  private readonly pending = new Map<number, PendingCommand>();
  private readonly listeners = new Map<string, Set<(params: any) => void>>();

  constructor(private readonly socket: WebSocket) {
    socket.on("message", (raw: WebSocket.RawData) => {
      const message = JSON.parse(raw.toString());
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) {
        listener(message.params);
      }
    });
    socket.on("close", () => {
      const error = new Error("抖音浏览器会话已关闭");
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    });
  }

  public send<T = any>(method: string, params: JsonObject = {}): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }), (error?: Error) => {
        if (!error) return;
        this.pending.delete(id);
        reject(error);
      });
    });
  }

  public on(method: string, listener: (params: any) => void) {
    const listeners = this.listeners.get(method) || new Set();
    listeners.add(listener);
    this.listeners.set(method, listeners);
  }

  public close() {
    this.socket.close();
  }
}

const findChrome = () => {
  const candidates = [
    process.env.PROGRAMFILES && join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe"),
    process.env["PROGRAMFILES(X86)"] && join(process.env["PROGRAMFILES(X86)"], "Google", "Chrome", "Application", "chrome.exe"),
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
    process.platform === "darwin" && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    process.platform === "linux" && "/usr/bin/google-chrome",
    process.platform === "linux" && "/usr/bin/chromium",
  ].filter((item): item is string => Boolean(item));
  return candidates.find(existsSync) || "";
};

const parseCookie = (cookie: string) =>
  cookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf("=");
      if (separator <= 0) return null;
      return {
        name: part.slice(0, separator).trim(),
        value: part.slice(separator + 1),
        url: "https://www.douyin.com/",
      };
    })
    .filter((item): item is { name: string; value: string; url: string } => Boolean(item));

const waitForSocket = (url: string) =>
  new Promise<WebSocket>((resolveSocket, reject) => {
    const socket = new WebSocket(url);
    socket.once("open", () => resolveSocket(socket));
    socket.once("error", reject);
  });

const getJson = <T>(url: string) =>
  new Promise<T>((resolveJson, reject) => {
    httpGet(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => {
        try {
          resolveJson(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }).once("error", reject);
  });

const startChrome = (executable: string, profileDir: string) =>
  new Promise<{ process: ChildProcess; debuggerUrl: string }>((resolveChrome, reject) => {
    const child = spawn(
      executable,
      [
        "--headless=new",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--no-first-run",
        "--no-default-browser-check",
        "--remote-debugging-port=0",
        `--user-data-dir=${profileDir}`,
        "about:blank",
      ],
      { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] },
    );
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      reject(new Error("启动 Chrome 获取抖音页面超时"));
    }, 15_000);
    child.stderr.on("data", (chunk) => {
      const match = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match || settled) return;
      settled = true;
      clearTimeout(timer);
      resolveChrome({ process: child, debuggerUrl: match[1] });
    });
    child.once("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Chrome 提前退出（${code ?? "unknown"}）`));
    });
  });

export class DouyinBrowserFavorites {
  private client?: CdpClient;
  private chromeProcess?: ChildProcess;
  private profileDir = "";
  private cookieHash = "";
  private starting?: Promise<void>;
  private readonly responses = new Map<number, JsonObject>();
  private readonly responseRequests = new Map<string, number>();
  private readonly waiters = new Map<number, Set<(value: JsonObject) => void>>();
  private idleTimer?: NodeJS.Timeout;

  public async get(maxCursor: number, cookie: string): Promise<JsonObject> {
    if (!cookie.trim()) throw new Error("请先设置抖音 Cookie");
    const hash = createHash("sha256").update(cookie).digest("hex");
    if (this.cookieHash && this.cookieHash !== hash) this.shutdown();
    await this.ensureStarted(cookie, hash);
    this.refreshIdleTimer();

    const cached = this.responses.get(maxCursor);
    if (cached) return cached;

    const response = this.waitForResponse(maxCursor, 18_000);
    if (maxCursor !== 0) {
      // 上一页响应刚交还给页面时，先让 React 完成列表渲染，再触底加载下一页。
      await new Promise((resolveWait) => setTimeout(resolveWait, 1_000));
      const scrollExpression = `
        window.scrollTo(0, Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
        for (const element of document.querySelectorAll('*')) {
          if (element.scrollHeight > element.clientHeight + 20) element.scrollTop = element.scrollHeight;
        }
      `;
      await this.client?.send("Runtime.evaluate", {
        expression: scrollExpression,
      });
      const scrollTimer = setInterval(() => {
        void this.client?.send("Runtime.evaluate", {
          expression: scrollExpression,
        }).catch(() => undefined);
      }, 1_200);
      try {
        return await response;
      } finally {
        clearInterval(scrollTimer);
      }
    }
    return response;
  }

  public dispose() {
    this.shutdown();
  }

  private async ensureStarted(cookie: string, hash: string) {
    if (this.client && this.cookieHash === hash) return;
    if (this.starting) return this.starting;
    this.starting = this.start(cookie, hash).finally(() => {
      this.starting = undefined;
    });
    return this.starting;
  }

  private async start(cookie: string, hash: string) {
    const executable = findChrome();
    if (!executable) throw new Error("未找到 Google Chrome，无法生成抖音页面动态签名");
    this.profileDir = mkdtempSync(join(tmpdir(), "touchfish-douyin-"));
    try {
      const launched = await startChrome(executable, this.profileDir);
      this.chromeProcess = launched.process;
      const browserSocket = await waitForSocket(launched.debuggerUrl);
      const browser = new CdpClient(browserSocket);
      const { targetId } = await browser.send<{ targetId: string }>("Target.createTarget", {
        url: "about:blank",
      });
      const { webSocketDebuggerUrl } = await this.waitForPageTarget(launched.debuggerUrl, targetId);
      browser.close();
      const pageSocket = await waitForSocket(webSocketDebuggerUrl);
      this.client = new CdpClient(pageSocket);
      this.cookieHash = hash;
      this.attachNetworkListeners();
      await this.client.send("Network.enable");
      await this.client.send("Fetch.enable", {
        patterns: [
          {
            urlPattern: "*://www.douyin.com/aweme/v1/web/aweme/favorite/*",
            requestStage: "Response",
          },
        ],
      });
      await this.client.send("Runtime.enable");
      await this.client.send("Page.enable");
      await this.client.send("Network.setCookies", { cookies: parseCookie(cookie) });
      await this.client.send("Page.navigate", {
        url: "https://www.douyin.com/user/self?showTab=like",
      });
    } catch (error) {
      this.shutdown();
      throw error;
    }
  }

  private async waitForPageTarget(debuggerUrl: string, targetId: string) {
    const endpoint = new URL(debuggerUrl);
    const listUrl = `http://${endpoint.host}/json/list`;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const targets = await getJson<any[]>(listUrl);
      const target = targets.find((item) => item.id === targetId);
      if (target?.webSocketDebuggerUrl) return target;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    throw new Error("无法连接抖音页面的 Chrome 调试会话");
  }

  private attachNetworkListeners() {
    this.client?.on("Fetch.requestPaused", (event) => {
      void this.capturePausedResponse(event);
    });
    this.client?.on("Network.responseReceived", ({ requestId, response, type }) => {
      if (type !== "XHR" && type !== "Fetch") return;
      try {
        const url = new URL(response.url);
        if (!url.pathname.includes("/aweme/v1/web/aweme/favorite/")) return;
        if (response.status !== 200) return;
        this.responseRequests.set(requestId, Number(url.searchParams.get("max_cursor") || 0));
      } catch {
        return;
      }
    });
    this.client?.on("Network.loadingFinished", ({ requestId }) => {
      const cursor = this.responseRequests.get(requestId);
      if (cursor === undefined) return;
      this.responseRequests.delete(requestId);
      void this.captureResponse(requestId, cursor);
    });
  }

  private async capturePausedResponse(event: any) {
    const { requestId, request, responseStatusCode } = event;
    let captured: { cursor: number; payload: JsonObject } | undefined;
    try {
      if (request?.method === "GET" && responseStatusCode === 200) {
        const url = new URL(request.url);
        const cursor = Number(url.searchParams.get("max_cursor") || 0);
        const result = await this.client?.send<{ body: string; base64Encoded: boolean }>(
          "Fetch.getResponseBody",
          { requestId },
        );
        if (result) {
          const body = result.base64Encoded
            ? Buffer.from(result.body, "base64").toString("utf8")
            : result.body;
          const payload = JSON.parse(body);
          if (Array.isArray(payload?.aweme_list)) {
            captured = { cursor, payload };
          }
        }
      }
    } catch {
      // 继续页面请求，Network 监听仍可作为备用抓取路径。
    } finally {
      try {
        await this.client?.send("Fetch.continueResponse", { requestId });
      } catch {
        await this.client?.send("Fetch.continueRequest", { requestId }).catch(() => undefined);
      }
    }
    if (captured) {
      this.responses.set(captured.cursor, captured.payload);
      for (const resolveWaiter of this.waiters.get(captured.cursor) || []) {
        resolveWaiter(captured.payload);
      }
      this.waiters.delete(captured.cursor);
    }
  }

  private async captureResponse(requestId: string, cursor: number) {
    try {
      const result = await this.client?.send<{ body: string; base64Encoded: boolean }>(
        "Network.getResponseBody",
        { requestId },
      );
      if (!result) return;
      const body = result.base64Encoded
        ? Buffer.from(result.body, "base64").toString("utf8")
        : result.body;
      const payload = JSON.parse(body);
      if (!Array.isArray(payload?.aweme_list)) return;
      this.responses.set(cursor, payload);
      for (const resolveWaiter of this.waiters.get(cursor) || []) resolveWaiter(payload);
      this.waiters.delete(cursor);
    } catch {
      // 页面可能被重载，调用方的超时会给出明确错误。
    }
  }

  private waitForResponse(cursor: number, timeoutMs: number) {
    const cached = this.responses.get(cursor);
    if (cached) return Promise.resolve(cached);
    return new Promise<JsonObject>((resolveResponse, reject) => {
      const listeners = this.waiters.get(cursor) || new Set();
      const timer = setTimeout(() => {
        listeners.delete(onResponse);
        reject(new Error("等待抖音页面返回喜欢列表超时，请更新 Cookie 后重试"));
      }, timeoutMs);
      const onResponse = (value: JsonObject) => {
        clearTimeout(timer);
        resolveResponse(value);
      };
      listeners.add(onResponse);
      this.waiters.set(cursor, listeners);
    });
  }

  private refreshIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.shutdown(), 90_000);
  }

  private shutdown() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = undefined;
    this.client?.close();
    this.client = undefined;
    this.chromeProcess?.kill();
    this.chromeProcess = undefined;
    this.cookieHash = "";
    this.responses.clear();
    this.responseRequests.clear();
    for (const listeners of this.waiters.values()) {
      for (const resolveWaiter of listeners) resolveWaiter({ status_code: -1, aweme_list: [], has_more: 0 });
    }
    this.waiters.clear();
    if (this.profileDir) {
      const profile = resolve(this.profileDir);
      const tempRoot = resolve(tmpdir());
      if (profile.startsWith(`${tempRoot}\\touchfish-douyin-`)) {
        try {
          rmSync(profile, { recursive: true, force: true });
        } catch {
          // Chrome 退出时偶尔仍占用缓存文件，系统临时目录会自行清理。
        }
      }
      this.profileDir = "";
    }
  }
}
