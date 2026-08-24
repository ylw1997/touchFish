import axios from "axios";
import { randomBytes, randomUUID } from "crypto";
import * as http from "http";

interface MediaSource {
  url: string;
  lastUsed: number;
}

type HeaderProvider = () => Promise<Record<string, string>>;

const FORWARDED_HEADERS = [
  "accept-ranges",
  "cache-control",
  "content-length",
  "content-range",
  "content-type",
] as const;

export class DouyinMediaProxy {
  private readonly token = randomBytes(24).toString("hex");
  private readonly sources = new Map<string, MediaSource>();
  private readonly server: http.Server;
  private startPromise?: Promise<number>;

  constructor(private readonly getHeaders: HeaderProvider) {
    this.server = http.createServer((request, response) => {
      void this.handleRequest(request, response);
    });
  }

  public async createUrl(upstreamUrl: string) {
    const parsed = new URL(upstreamUrl);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "www.douyin.com" ||
      !parsed.pathname.includes("/aweme/v1/play/")
    ) {
      throw new Error("不允许代理非抖音官方播放入口");
    }

    const now = Date.now();
    for (const [id, source] of this.sources) {
      if (now - source.lastUsed > 30 * 60 * 1000) this.sources.delete(id);
    }
    while (this.sources.size >= 100) {
      const oldest = this.sources.keys().next().value;
      if (!oldest) break;
      this.sources.delete(oldest);
    }

    const id = randomUUID();
    this.sources.set(id, { url: upstreamUrl, lastUsed: now });
    const port = await this.ensureStarted();
    return `http://127.0.0.1:${port}/${this.token}/${id}`;
  }

  public dispose() {
    this.sources.clear();
    if (this.server.listening) this.server.close();
  }

  private ensureStarted() {
    if (!this.startPromise) {
      this.startPromise = new Promise<number>((resolve, reject) => {
        const handleError = (error: Error) => {
          this.startPromise = undefined;
          reject(error);
        };
        this.server.once("error", handleError);
        this.server.listen(0, "127.0.0.1", () => {
          this.server.off("error", handleError);
          this.server.unref();
          const address = this.server.address();
          if (!address || typeof address === "string") {
            this.startPromise = undefined;
            reject(new Error("无法启动抖音媒体代理"));
            return;
          }
          resolve(address.port);
        });
      });
    }
    return this.startPromise;
  }

  private async handleRequest(
    request: http.IncomingMessage,
    response: http.ServerResponse,
  ) {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Range");
    response.setHeader(
      "Access-Control-Expose-Headers",
      "Accept-Ranges, Content-Length, Content-Range, Content-Type",
    );
    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      response.end();
      return;
    }

    const parts = (request.url || "").split("?")[0].split("/").filter(Boolean);
    if (parts.length !== 2 || parts[0] !== this.token) {
      response.statusCode = 404;
      response.end();
      return;
    }
    const source = this.sources.get(parts[1]);
    if (!source) {
      response.statusCode = 404;
      response.end();
      return;
    }
    source.lastUsed = Date.now();

    try {
      const headers = await this.getHeaders();
      const upstream = await axios.request({
        url: source.url,
        method: request.method === "HEAD" ? "HEAD" : "GET",
        headers: {
          ...headers,
          Referer: "https://www.douyin.com/",
          ...(request.headers.range ? { Range: request.headers.range } : {}),
        },
        responseType: "stream",
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });
      response.statusCode = upstream.status;
      for (const name of FORWARDED_HEADERS) {
        const value = upstream.headers[name];
        if (value != null) response.setHeader(name, value);
      }
      if (request.method === "HEAD") {
        response.end();
        upstream.data?.destroy?.();
        return;
      }
      response.on("close", () => upstream.data?.destroy?.());
      upstream.data.on("error", () => response.destroy());
      upstream.data.pipe(response);
    } catch (error: any) {
      if (response.headersSent) {
        response.destroy();
        return;
      }
      response.statusCode = error?.response?.status || 502;
      response.end();
    }
  }
}
