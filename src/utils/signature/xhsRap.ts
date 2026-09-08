import * as crypto from "crypto";
import * as zlib from "zlib";
import { CryptoConfig } from "./xhsConfig";
import { xxHash32, aesEncBlock } from "./xhsCryptoUtils";

const AES_KEY = Array.from(Buffer.from(CryptoConfig.RAP_AES_KEY, "utf8"));
const SBOX = CryptoConfig.RAP_SBOX;
const ALPHABET36 = CryptoConfig.ALPHABET36;

function randomAscii(n: number): string {
  const buf = crypto.randomBytes(n);
  let out = "";
  for (const b of buf) out += ALPHABET36[b % 36];
  return out;
}

function aesEcbEnc(data: Buffer | Uint8Array): Buffer {
  const o: number[] = [];
  for (let i = 0; i < data.length; i += 16) {
    o.push(...aesEncBlock(Array.from(data.slice(i, i + 16)), AES_KEY.slice(), SBOX));
  }
  return Buffer.from(o);
}

function alpha36Pad(buf: Buffer): Buffer {
  const n = 16 - (buf.length % 16);
  const padActual = n === 0 ? 16 : n;
  const rand = crypto.randomBytes(padActual);
  const padBytes = Buffer.from(Array.from(rand).map((b) => ALPHABET36.charCodeAt(b % 36)));
  return Buffer.concat([buf, padBytes]);
}

function buildPayload(params: {
  ts: number;
  url: string;
  body: string;
  fingerprint: Buffer;
  mask: number;
}): Uint8Array {
  const { ts, url, body, fingerprint, mask } = params;
  const p = new Uint8Array(fingerprint.length + 16);
  p[0] = 0x03;
  p[1] = 0xe8;
  const tsHi = Math.floor(ts / 0x100000000);
  const tsLo = ts >>> 0;
  p[2] = (tsHi >>> 24) & 0xff;
  p[3] = (tsHi >>> 16) & 0xff;
  p[4] = (tsHi >>> 8) & 0xff;
  p[5] = tsHi & 0xff;
  p[6] = (tsLo >>> 24) & 0xff;
  p[7] = (tsLo >>> 16) & 0xff;
  p[8] = (tsLo >>> 8) & 0xff;
  p[9] = tsLo & 0xff;
  p[10] = 0x03;
  p[11] = 0xe9;

  const verify = xxHash32(Buffer.from([mask]));
  p[12] = (verify >>> 24) & 0xff;
  p[13] = (verify >>> 16) & 0xff;
  p[14] = (verify >>> 8) & 0xff;
  p[15] = verify & 0xff;

  const bodyUnmasked = Buffer.from(fingerprint);
  let reqHashOff = -1;
  for (let i = 0; i < bodyUnmasked.length - 5; i++) {
    if (bodyUnmasked[i] === 0x03 && bodyUnmasked[i + 1] === 0xeb) {
      reqHashOff = i + 2;
      break;
    }
  }
  if (reqHashOff >= 0) {
    const reqHash = xxHash32(Buffer.from(url + body, "utf8"));
    bodyUnmasked[reqHashOff] = (reqHash >>> 24) & 0xff;
    bodyUnmasked[reqHashOff + 1] = (reqHash >>> 16) & 0xff;
    bodyUnmasked[reqHashOff + 2] = (reqHash >>> 8) & 0xff;
    bodyUnmasked[reqHashOff + 3] = reqHash & 0xff;
  }

  for (let i = 0; i < bodyUnmasked.length; i++) {
    p[16 + i] = bodyUnmasked[i] ^ mask;
  }
  return p;
}

function encryptPayload(
  payload: Buffer,
  xorKey: number[]
): { encR: Buffer; body: Buffer; gzipLen: number } {
  const deflated = zlib.deflateRawSync(payload, { level: 9 });
  const gz = Buffer.alloc(10 + deflated.length + 8);
  gz[0] = 0x1f;
  gz[1] = 0x8b;
  gz[2] = 0x08;
  gz[3] = 0x00;
  gz.writeUInt32LE(0, 4);
  gz[8] = 0x00;
  gz[9] = 0x03;
  deflated.copy(gz, 10);
  gz.writeUInt32LE(zlib.crc32(payload), 10 + deflated.length);
  gz.writeUInt32LE(payload.length & 0xffffffff, 14 + deflated.length);

  const gzipLen = gz.length;
  const padded = alpha36Pad(gz);
  const xored = Buffer.from(padded.map((b, i) => b ^ xorKey[i % 16]));
  const body = aesEcbEnc(xored);
  const encR = aesEcbEnc(Buffer.from(xorKey));
  return { encR, body, gzipLen };
}

export function generateRapParam(api: string, data: any = ""): string {
  const dataStr = data == null ? "" : typeof data === "object" ? JSON.stringify(data) : String(data);
  const ts = Date.now();
  let url: string;
  if (/^https?:\/\//.test(api) || api.startsWith("//")) {
    url = api;
  } else {
    url = "//edith.xiaohongshu.com" + (api.startsWith("/") ? api : "/" + api);
  }

  const mask = ALPHABET36.charCodeAt(crypto.randomBytes(1)[0] % 36);
  const xorKeyStr = randomAscii(16);
  const xorKey = Array.from(Buffer.from(xorKeyStr, "ascii"));
  const nonceLen = 4 + Math.floor(crypto.randomBytes(1)[0] / 86);
  const nonce = Buffer.from(randomAscii(nonceLen), "ascii");

  const fingerprint = Buffer.from(CryptoConfig.RAP_FINGERPRINT_HEX, "hex");
  const p2 = buildPayload({ ts, url, body: dataStr, fingerprint, mask });

  const encryptStart = Date.now();
  const { encR, body: bodyEnc, gzipLen } = encryptPayload(Buffer.from(p2), xorKey);
  const encryptTimeMs = Math.max(1, Date.now() - encryptStart);

  const B = bodyEnc.length;
  const env = Buffer.alloc(60 + nonceLen + B);
  env[0] = 0x07;
  env[1] = 0x24;
  env[2] = 0x01;
  env[3] = nonceLen;
  env.writeUInt32BE(1, 4);
  env.writeUInt32BE(20, 8);
  env.writeUInt32BE(B + 4, 12);
  env.writeUInt32BE(0x0000283d, 20);
  env.writeUInt32BE(encryptTimeMs, 24);

  nonce.copy(env, 36);
  encR.copy(env, 36 + nonceLen);
  env.writeUInt32BE(16, 52 + nonceLen);
  bodyEnc.copy(env, 56 + nonceLen);
  env.writeUInt32BE(gzipLen, 56 + nonceLen + B);

  const chk16 = xxHash32(env.subarray(36), 0);
  env.writeUInt32BE(chk16, 16);

  return env.toString("base64");
}

export function isRapApi(api: string): boolean {
  const path = (api || "").split("?", 1)[0].replace(/^\/+|\/+$/g, "");
  for (const m of CryptoConfig.RAP_PATH_MARKERS) {
    const target = m.replace(/^\/+|\/+$/g, "");
    if (path === target || path.includes(target)) {
      return true;
    }
  }
  return false;
}
