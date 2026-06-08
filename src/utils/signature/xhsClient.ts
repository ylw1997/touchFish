import { CryptoConfig } from "./xhsConfig";
import { CryptoProcessor } from "./xhsCryptoProcessor";
import { Base64Encoder, CRC32, BitOperations } from "./xhsCryptoUtils";
import { FingerprintGenerator } from "./xhsFingerprint";
import * as crypto from "crypto";

export interface XhsSignature {
  xs: string;
  xt: number;
  xs_common: string;
}

export class XhsClient {
  private cryptoProcessor = new CryptoProcessor();
  private b64Encoder = new Base64Encoder();
  private fpGenerator = new FingerprintGenerator();

  private buildContentString(method: "GET" | "POST", uri: string, payload: any): string {
    if (method === "POST") {
      return uri + (payload ? JSON.stringify(payload) : "{}");
    } else {
      if (!payload) return uri;
      
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
      return params.length > 0 ? `${uri}?${params.join("&")}` : uri;
    }
  }


  private generateDValue(content: string): string {
    return crypto.createHash("md5").update(content, "utf-8").digest("hex");
  }

  private parseCookies(cookies: string | Record<string, string>): Record<string, string> {
    if (typeof cookies === "string") {
      const parsed: Record<string, string> = {};
      cookies.split(";").forEach((pair) => {
        const [k, ...v] = pair.trim().split("=");
        if (k) parsed[k] = v.join("=");
      });
      return parsed;
    }
    return cookies;
  }

  public signXs(
    method: "GET" | "POST",
    uri: string,
    a1Value: string,
    payload: any = null,
    timestamp?: number
  ): string {
    const contentString = this.buildContentString(method, uri, payload);
    const dValue = this.generateDValue(contentString);
    
    const mValue = method === "GET" 
      ? dValue 
      : crypto.createHash("md5").update(uri, "utf-8").digest("hex");

    const payloadArray = this.cryptoProcessor.buildPayloadArray(
      dValue,
      mValue,
      a1Value,
      "xhs-pc-web",
      contentString,
      timestamp
    );


    const bitOps = new BitOperations();
    const xorResult = bitOps.xorTransformArray(payloadArray);
    const x3Signature = this.b64Encoder.encodeX3(new Uint8Array(xorResult.slice(0, CryptoConfig.PAYLOAD_LENGTH)));

    const signatureData = { ...CryptoConfig.SIGNATURE_DATA_TEMPLATE };
    signatureData.x3 = CryptoConfig.X3_PREFIX + x3Signature;

    const signatureJson = JSON.stringify(signatureData).replace(/:/g, ":").replace(/,/g, ",");
    return CryptoConfig.XYS_PREFIX + this.b64Encoder.encode(signatureJson);
  }

  public signXsCommon(cookieDict: Record<string, string>, timestamp: number, xs: string): string {
    const a1Value = cookieDict["a1"] || "";
    
    // As per user choice and to match xhs.raw.js completely seamlessly, 
    // we use the fixed "fff" string for b1. Wait! The user said: 
    // "动态指纹算法也要迁移,全部迁移到nodejs算法上来"
    // So I MUST use the dynamic fingerprint generation.
    const fp = this.fpGenerator.generate(cookieDict, CryptoConfig.PUBLIC_USERAGENT);
    const b1 = this.fpGenerator.generateB1(fp);

    const x9 = CRC32.crc32JsInt(b1);

    const signStruct = { ...CryptoConfig.SIGNATURE_XSCOMMON_TEMPLATE };
    signStruct.x5 = a1Value;
    signStruct.x6 = String(timestamp);
    signStruct.x7 = xs;
    signStruct.x8 = b1;
    signStruct.x9 = x9;

    const signJson = JSON.stringify(signStruct);
    return this.b64Encoder.encode(signJson);
  }

  public sign(
    apiPath: string,
    payload: any,
    a1OrCookies: string | Record<string, string>,
    method: "GET" | "POST" = "POST"
  ): XhsSignature {
    const cookies = this.parseCookies(a1OrCookies);
    const a1Value = cookies["a1"] || (typeof a1OrCookies === "string" ? a1OrCookies : "");

    const timestamp = Date.now();
    
    const xs = this.signXs(method, apiPath, a1Value, payload, timestamp / 1000);
    const xs_common = this.signXsCommon(cookies, timestamp, xs);

    return {
      xs,
      xt: timestamp,
      xs_common,
    };
  }
}
