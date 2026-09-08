import axios from "axios";
import { CryptoConfig } from "./xhsConfig";

const GETDSS_RE = /function\s+getdss\s*\(\s*\)\s*\{\s*return\s+'(\d+)'/;
const DS_URL = "https://as.xiaohongshu.com/api/sec/v1/ds?appId=xhs-pc-web";
const TTL_MS = 300 * 1000; // 5分钟
const DSLLT_INTERVAL_MS = 15 * 60 * 1000; // 15分钟

export class DsFetcher {
  private value: string | null = null;
  private fetchedAt = 0;
  private dsllt = 0;
  private fetchingPromise: Promise<string> | null = null;

  public async getDsl(force = false): Promise<string> {
    const now = Date.now();
    if (!force && this.value && now - this.fetchedAt < TTL_MS) {
      return this.value;
    }

    if (this.fetchingPromise) {
      return this.fetchingPromise;
    }

    this.fetchingPromise = (async () => {
      try {
        const resp = await axios.get<string>(DS_URL, {
          headers: {
            "User-Agent": CryptoConfig.PUBLIC_USERAGENT,
            Referer: "https://www.xiaohongshu.com/",
            Accept: "*/*",
          },
          timeout: 5000,
          responseType: "text",
        });
        const match = String(resp.data).match(GETDSS_RE);
        if (match && match[1]) {
          this.value = match[1];
          this.fetchedAt = Date.now();
          return this.value;
        }
      } catch {
        // 网络失败降级
      } finally {
        this.fetchingPromise = null;
      }

      if (this.value) {
        return this.value;
      }

      // 若初次获取失败，返回当前时间戳降级
      this.value = String(Date.now());
      this.fetchedAt = Date.now();
      return this.value;
    })();

    return this.fetchingPromise;
  }

  public ensureDsllt(timestampMs: number, force = false): number {
    const timestamp = Number(timestampMs);
    if (force || !this.dsllt || timestamp - this.dsllt >= DSLLT_INTERVAL_MS) {
      this.dsllt = timestamp;
    }
    return this.dsllt;
  }

  public async getDslPair(timestampMs?: number): Promise<string> {
    const now = timestampMs ?? Date.now();
    const dsl = await this.getDsl();
    const dsllt = this.ensureDsllt(now);
    return `${dsllt};${dsl}`;
  }

  public getDslPairSync(timestampMs?: number): string {
    const now = timestampMs ?? Date.now();
    const dsllt = this.ensureDsllt(now);
    const dsl = this.value || String(now);
    return `${dsllt};${dsl}`;
  }
}

export const defaultDsFetcher = new DsFetcher();
