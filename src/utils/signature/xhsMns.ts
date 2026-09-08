import * as crypto from "crypto";
import { CryptoConfig } from "./xhsConfig";

const KEYSTREAM = Array.from(Buffer.from(CryptoConfig.MNS_KEYSTREAM_B64, "base64"));
const MNS0101_KEYSTREAM = Array.from(Buffer.from(CryptoConfig.MNS0101_KEYSTREAM_B64, "base64"));

function md5Bytes(s: string | Buffer): number[] {
  return Array.from(crypto.createHash("md5").update(s).digest());
}

function le32(n: number): number[] {
  n >>>= 0;
  return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
}

function le64(n: number | bigint): number[] {
  const out: number[] = [];
  let b = BigInt(n);
  for (let i = 0; i < 8; i++) {
    out.push(Number(b & 255n));
    b >>= 8n;
  }
  return out;
}

function strBytes(s: string): number[] {
  return Array.from(Buffer.from(String(s), "utf8"));
}

export function base64CustomMns(bytes: number[]): string {
  const alphabet = CryptoConfig.MNS_ALPHABET;
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += alphabet[b0 >> 2];
    out += alphabet[((b0 & 3) << 4) | ((b1 || 0) >> 4)];
    if (b1 === undefined) {
      out += "==";
      break;
    }
    out += alphabet[((b1 & 15) << 2) | ((b2 || 0) >> 6)];
    if (b2 === undefined) {
      out += "=";
      break;
    }
    out += alphabet[b2 & 63];
  }
  return out;
}

export function base58Custom(bytes: number[]): string {
  const alphabet = CryptoConfig.MNS0101_ALPHABET;
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  let body = "";
  while (value > 0n) {
    body = alphabet[Number(value % 58n)] + body;
    value /= 58n;
  }
  let zeros = 0;
  for (const byte of bytes) {
    if (byte !== 0) break;
    zeros++;
  }
  return "1".repeat(zeros) + body;
}

function rotl(x: number, r: number): number {
  return (((x << r) | 0) + (x >>> (32 - r))) | 0;
}

export function dsf(data: number[]): number[] {
  const len = data.length;
  const rd = (o: number) =>
    (data[o] | (data[o + 1] << 8) | (data[o + 2] << 16) | (data[o + 3] << 24)) | 0;
  let h1 = (0x6d2b79f5 ^ len) | 0;
  let h2 = (0x1b873593 ^ (len << 8)) | 0;
  let h3 = (0x85ebca6b ^ (len << 16)) | 0;
  let h4 = (0xc2b2ae35 ^ (len << 24)) | 0;
  for (let i = 0; i + 8 <= len; i += 8) {
    const w0 = rd(i);
    const w1 = rd(i + 4);
    h1 = rotl((((h1 + w0) | 0) ^ h3) | 0, 7);
    h2 = rotl((((h2 ^ w0) | 0) + h4) | 0, 11);
    h3 = rotl((((h3 + w1) | 0) ^ h1) | 0, 13);
    h4 = rotl((((h4 ^ w1) | 0) + h2) | 0, 17);
  }
  h1 = (h1 ^ len) | 0;
  h2 = (h2 ^ h1) | 0;
  h3 = (h3 + h2) | 0;
  h4 = (h4 ^ h3) | 0;
  h1 = rotl(h1, 9);
  h2 = rotl(h2, 13);
  h3 = rotl(h3, 17);
  h4 = rotl(h4, 19);
  h1 = (h1 + h3) | 0;
  h2 = (h2 ^ h4) | 0;
  h3 = (h3 + h1) | 0;
  h4 = (h4 ^ h2) | 0;
  const out: number[] = [];
  for (const h of [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0]) {
    out.push(h & 255, (h >>> 8) & 255, (h >>> 16) & 255, (h >>> 24) & 255);
  }
  return out;
}

export function envFp(versionKey: number, tail: number[]): number[] {
  return [1, versionKey ^ 115].concat(tail);
}

export interface MnsParams {
  api: string;
  data?: any;
  a1: string;
  ts: number;
  loadts: number;
  seq: number;
  version?: number;
  envConst?: number;
  envFpTail?: number[];
  appId?: string;
  deviceTag?: string;
  md5FullBytes?: number[];
  md5UrlBytes?: number[];
  fullLen?: number;
}

export function packPlaintext(p: MnsParams): number[] {
  const version = (p.version !== undefined ? p.version : Math.floor(Math.random() * 0x100000000)) >>> 0;
  const vKey = version & 255;
  const ts = p.ts;
  const loadts = p.loadts;
  const appId = String(p.appId || CryptoConfig.APP_ID);
  const deviceTag = String(p.deviceTag || "a3");
  const dataStr = p.data == null ? "" : typeof p.data === "object" ? JSON.stringify(p.data) : String(p.data);
  const full = String(p.api) + dataStr;
  const md5full = p.md5FullBytes ? [...p.md5FullBytes] : md5Bytes(full);
  const md5api = p.md5UrlBytes ? [...p.md5UrlBytes] : md5Bytes(p.api);

  let rawDsSig: number[];
  if (deviceTag === "nop") {
    rawDsSig = md5api;
  } else {
    rawDsSig = dsf(le64(ts).concat(md5api));
  }
  const dsSig = rawDsSig.map((b) => b ^ vKey);

  const envConst = p.envConst !== undefined ? p.envConst : CryptoConfig.DEFAULT_ENV_CONST;
  const envFpTail = p.envFpTail || CryptoConfig.DEFAULT_ENV_FP_TAIL;

  const out: number[] = [];
  const push = (a: number[]) => {
    for (const b of a) out.push(b);
  };

  push([121, 104, 96, 41]);
  push(le32(version));
  push(le64(ts));
  push(le64(loadts));
  push(le32(p.seq >>> 0));
  push(le32(envConst >>> 0));
  push(le32(p.fullLen !== undefined ? p.fullLen >>> 0 : Buffer.byteLength(full, "utf8")));
  push(md5full.slice(0, 8).map((b) => b ^ vKey));
  push([p.a1.length]);
  push(strBytes(p.a1));
  const appBytes = strBytes(appId);
  push([appBytes.length]);
  push(appBytes);
  push(envFp(vKey, envFpTail));
  const tagBytes = strBytes(deviceTag);
  push([tagBytes.length]);
  push(tagBytes);
  push([16]);
  push(dsSig);
  return out;
}

export function sign0301(p: MnsParams): string {
  const plain = packPlaintext(p);
  const cipher = plain.map((b, i) => b ^ KEYSTREAM[i]);
  return "mns0301_" + base64CustomMns(cipher);
}

export function sign0101(p: MnsParams): string {
  const plain = packPlaintext(p);
  const cipher = plain.map((b, i) => b ^ MNS0101_KEYSTREAM[i]);
  return "mns0101_" + base58Custom(cipher);
}

export function signTier(p: MnsParams, tier = "0301"): string {
  switch (tier) {
    case "0101":
      return sign0101(p);
    case "0301":
    default:
      return sign0301(p);
  }
}
