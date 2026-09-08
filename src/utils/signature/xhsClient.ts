import * as crypto from "crypto";
import { CryptoConfig } from "./xhsConfig";
import { signTier } from "./xhsMns";
import { xsCommon } from "./xhsXsCommon";
import { generateB1 } from "./xhsB1";
import { defaultDsFetcher } from "./xhsDsl";
import { generateRapParam, isRapApi } from "./xhsRap";
import {
  encodeUtf8,
  b64Custom,
  generateXB3TraceId,
  generateXrayTraceId,
  generateXyDirection,
} from "./xhsCryptoUtils";

export interface XhsSignature {
  xs: string;
  xt: string;
  xs_common: string;
  x_rap_param?: string;
  x_b3_traceid?: string;
  x_xray_traceid?: string;
  xy_direction?: string;
}

export class XhsClient {
  private seq = 1;
  private signCount = 0;
  private loadts = Date.now();

  private parseCookies(cookies: string | Record<string, string>): Record<string, string> {
    if (typeof cookies === "string") {
      const parsed: Record<string, string> = {};
      cookies.split(";").forEach((pair) => {
        const [k, ...v] = pair.trim().split("=");
        if (k) parsed[k] = v.join("=");
      });
      return parsed;
    }
    return cookies || {};
  }

  private buildContentString(method: "GET" | "POST", uri: string, payload: any): string {
    if (method === "POST") {
      return uri + (payload ? (typeof payload === "object" ? JSON.stringify(payload) : String(payload)) : "");
    } else {
      if (!payload) return uri;
      if (typeof payload === "string") return uri.includes("?") ? `${uri}&${payload}` : `${uri}?${payload}`;
      const params: string[] = [];
      for (const key in payload) {
        const val = payload[key];
        let valStr = "";
        if (Array.isArray(val)) {
          valStr = val.join(",");
        } else if (val !== null && val !== undefined) {
          valStr = String(val);
        }
        params.push(`${key}=${encodeURIComponent(valStr)}`);
      }
      return params.length > 0 ? (uri.includes("?") ? `${uri}&${params.join("&")}` : `${uri}?${params.join("&")}`) : uri;
    }
  }

  public signXs(
    apiPath: string,
    payload: any,
    a1Value: string,
    timestamp: number,
    seq: number
  ): { xs: string; x3: string; md5FullHex: string } {
    const dataStr = payload == null ? "" : typeof payload === "object" ? JSON.stringify(payload) : String(payload);
    const full = String(apiPath) + dataStr;
    const md5FullHex = crypto.createHash("md5").update(full, "utf8").digest("hex");

    const x3 = signTier({
      api: apiPath,
      data: payload,
      a1: a1Value,
      ts: timestamp,
      loadts: this.loadts,
      seq,
      version: Math.floor(Math.random() * 0x100000000) >>> 0,
      envConst: CryptoConfig.DEFAULT_ENV_CONST,
      envFpTail: CryptoConfig.DEFAULT_ENV_FP_TAIL,
      appId: CryptoConfig.APP_ID,
      deviceTag: "a3",
    });

    const x4Label =
      payload == null || payload === ""
        ? ""
        : typeof payload === "object"
        ? "object"
        : "string";

    const signObj = {
      x0: CryptoConfig.SIGN_VERSION,
      x1: CryptoConfig.APP_ID,
      x2: CryptoConfig.PLATFORM,
      x3,
      x4: x4Label,
      x5: md5FullHex,
    };

    const xs = "XYS_" + b64Custom(encodeUtf8(JSON.stringify(signObj)), CryptoConfig.XS_ALPHABET);
    return { xs, x3, md5FullHex };
  }

  public async signAsync(
    apiPath: string,
    payload: any,
    a1OrCookies: string | Record<string, string>,
    method: "GET" | "POST" = "POST",
    userId?: string
  ): Promise<XhsSignature> {
    const cookies = this.parseCookies(a1OrCookies);
    const a1Value = cookies["a1"] || (typeof a1OrCookies === "string" && a1OrCookies.includes("=") ? "" : String(a1OrCookies || ""));

    const timestamp = Date.now();
    const currentSeq = this.seq++;
    const currentSignCount = this.signCount++;

    const { xs } = this.signXs(apiPath, payload, a1Value, timestamp, currentSeq);
    const xt = String(timestamp);

    const b1 = generateB1({ now: timestamp });
    const dslPair = await defaultDsFetcher.getDslPair(timestamp);

    const xs_common = xsCommon(a1Value, xt, xs, dslPair, b1, {
      signCount: currentSignCount,
      signVersion: CryptoConfig.SIGN_VERSION,
      webBuild: cookies["webBuild"] || CryptoConfig.WEB_BUILD,
    });

    const signature: XhsSignature = {
      xs,
      xt,
      xs_common,
      x_b3_traceid: generateXB3TraceId(16),
      x_xray_traceid: generateXrayTraceId(),
    };

    if (isRapApi(apiPath)) {
      signature.x_rap_param = generateRapParam(apiPath, payload);
    }

    if (userId && (apiPath.includes("/homefeed") || apiPath.includes("/feed"))) {
      signature.xy_direction = generateXyDirection(userId);
    }

    return signature;
  }

  public sign(
    apiPath: string,
    payload: any,
    a1OrCookies: string | Record<string, string>,
    method: "GET" | "POST" = "POST",
    userId?: string
  ): XhsSignature {
    const cookies = this.parseCookies(a1OrCookies);
    const a1Value = cookies["a1"] || (typeof a1OrCookies === "string" && !a1OrCookies.includes("=") ? String(a1OrCookies) : "");

    const timestamp = Date.now();
    const currentSeq = this.seq++;
    const currentSignCount = this.signCount++;

    const { xs } = this.signXs(apiPath, payload, a1Value, timestamp, currentSeq);
    const xt = String(timestamp);

    const b1 = generateB1({ now: timestamp });
    const dslPair = defaultDsFetcher.getDslPairSync(timestamp);

    const xs_common = xsCommon(a1Value, xt, xs, dslPair, b1, {
      signCount: currentSignCount,
      signVersion: CryptoConfig.SIGN_VERSION,
      webBuild: cookies["webBuild"] || CryptoConfig.WEB_BUILD,
    });

    const signature: XhsSignature = {
      xs,
      xt,
      xs_common,
      x_b3_traceid: generateXB3TraceId(16),
      x_xray_traceid: generateXrayTraceId(),
    };

    if (isRapApi(apiPath)) {
      signature.x_rap_param = generateRapParam(apiPath, payload);
    }

    if (userId && (apiPath.includes("/homefeed") || apiPath.includes("/feed"))) {
      signature.xy_direction = generateXyDirection(userId);
    }

    return signature;
  }
}
