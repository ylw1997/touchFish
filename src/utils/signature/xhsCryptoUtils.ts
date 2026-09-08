import * as crypto from "crypto";

// 变体 CRC32 预计算表 (多项式 0xedb88320)
const _crcTable = (() => {
  const a = 0xedb88320;
  const s = new Array(256);
  for (let d = 0; d < 256; d++) {
    let r = d;
    for (let c = 8; c > 0; c--) r = 1 & r ? (r >>> 1) ^ a : r >>> 1;
    s[d] = r >>> 0;
  }
  return s;
})();

/**
 * XHS X-S-Common 变体 CRC32 计算 (gens9)
 */
export function gens9(str: string): number {
  const a = 0xedb88320;
  let c = -1;
  for (let r = 0; r < str.length; r++) {
    c = _crcTable[(255 & c) ^ str.charCodeAt(r)] ^ (c >>> 8);
  }
  return (-1 ^ c ^ a) | 0; // signed int32
}

/**
 * UTF-8 编码，对齐 JS 实现
 */
export function encodeUtf8(e: string): number[] {
  const r = encodeURIComponent(e);
  const a: number[] = [];
  for (let i = 0; i < r.length; i++) {
    const ch = r.charAt(i);
    if (ch === "%") {
      a.push(parseInt(r.charAt(i + 1) + r.charAt(i + 2), 16));
      i += 2;
    } else {
      a.push(ch.charCodeAt(0));
    }
  }
  return a;
}

/**
 * 自定义 Base64 编码
 */
export function b64Custom(bytes: number[] | Uint8Array, alphabet: string): string {
  const a = bytes.length;
  const c = a % 3;
  const d: string[] = [];
  const s = 16383;
  let u = 0;
  const l = a - c;
  for (u = 0; u < l; u += s) {
    const end = u + s > l ? l : u + s;
    for (let k = u; k < end; k += 3) {
      const t =
        (bytes[k] << 16) +
        ((k + 1 < end ? bytes[k + 1] : 0) << 8) +
        (k + 2 < end ? bytes[k + 2] : 0);
      d.push(
        alphabet[(t >> 18) & 63],
        alphabet[(t >> 12) & 63],
        alphabet[(t >> 6) & 63],
        alphabet[t & 63]
      );
    }
  }
  if (c === 1) {
    const t = bytes[a - 1];
    d.push(alphabet[t >> 2] + alphabet[(t << 4) & 63] + "==");
  } else if (c === 2) {
    const t = (bytes[a - 2] << 8) + bytes[a - 1];
    d.push(
      alphabet[t >> 10] +
        alphabet[(t >> 4) & 63] +
        alphabet[(t << 2) & 63] +
        "="
    );
  }
  return d.join("");
}

/**
 * xxHash32 纯算实现
 */
export function xxHash32(buf: Buffer | Uint8Array, seed = 0): number {
  const P1 = 0x9e3779b1 >>> 0,
    P2 = 0x85ebca77 >>> 0,
    P3 = 0xc2b2ae3d >>> 0;
  const P4 = 0x27d4eb2f >>> 0,
    P5 = 0x165667b1 >>> 0;
  const M = Math.imul;
  const rotl = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0;
  let h: number,
    p = 0;
  const len = buf.length;
  if (len >= 16) {
    let v1 = (seed + P1 + P2) >>> 0,
      v2 = (seed + P2) >>> 0,
      v3 = seed >>> 0,
      v4 = (seed - P1) >>> 0;
    while (p + 16 <= len) {
      const l1 = (buf[p] | (buf[p + 1] << 8) | (buf[p + 2] << 16) | (buf[p + 3] << 24)) >>> 0;
      const l2 =
        (buf[p + 4] | (buf[p + 5] << 8) | (buf[p + 6] << 16) | (buf[p + 7] << 24)) >>> 0;
      const l3 =
        (buf[p + 8] | (buf[p + 9] << 8) | (buf[p + 10] << 16) | (buf[p + 11] << 24)) >>> 0;
      const l4 =
        (buf[p + 12] | (buf[p + 13] << 8) | (buf[p + 14] << 16) | (buf[p + 15] << 24)) >>> 0;
      v1 = M(rotl((v1 + M(l1, P2)) >>> 0, 13), P1) >>> 0;
      v2 = M(rotl((v2 + M(l2, P2)) >>> 0, 13), P1) >>> 0;
      v3 = M(rotl((v3 + M(l3, P2)) >>> 0, 13), P1) >>> 0;
      v4 = M(rotl((v4 + M(l4, P2)) >>> 0, 13), P1) >>> 0;
      p += 16;
    }
    h = (rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18)) >>> 0;
  } else {
    h = (seed + P5) >>> 0;
  }
  h = (h + len) >>> 0;
  while (p + 4 <= len) {
    const l = (buf[p] | (buf[p + 1] << 8) | (buf[p + 2] << 16) | (buf[p + 3] << 24)) >>> 0;
    h = M(rotl((h + M(l, P3)) >>> 0, 17), P4) >>> 0;
    p += 4;
  }
  while (p < len) {
    h = M(rotl((h + M(buf[p], P5)) >>> 0, 11), P1) >>> 0;
    p++;
  }
  h ^= h >>> 15;
  h = M(h, P2) >>> 0;
  h ^= h >>> 13;
  h = M(h, P3) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * murmurHash3_32 (小红书 index.bundle 对齐版)
 */
export function murmurHash3_32(key: string, seed = 0): number {
  const data = Buffer.from(key, "utf-8");
  const length = data.length;
  let h = seed & 0xffffffff;
  const nblocks = Math.floor(length / 4);

  for (let i = 0; i < nblocks; i++) {
    let k =
      (data[4 * i] |
        (data[4 * i + 1] << 8) |
        (data[4 * i + 2] << 16) |
        (data[4 * i + 3] << 24)) &
      0xffffffff;
    k = Math.imul(k, 0xcc9e2d51) & 0xffffffff;
    k = ((k << 15) | (k >>> 17)) & 0xffffffff;
    k = Math.imul(k, 0x1b873593) & 0xffffffff;
    h ^= k;
    h = ((h << 13) | (h >>> 19)) & 0xffffffff;
    h = (Math.imul(h, 5) + 0xe6546b64) & 0xffffffff;
  }

  const tailIndex = 4 * nblocks;
  let k = 0;
  const rem = length % 4;
  if (rem === 3) k ^= data[tailIndex + 2] << 16;
  if (rem >= 2) k ^= data[tailIndex + 1] << 8;
  if (rem >= 1) {
    k ^= data[tailIndex];
    k = Math.imul(k, 0xcc9e2d51) & 0xffffffff;
    k = ((k << 15) | (k >>> 17)) & 0xffffffff;
    k = Math.imul(k, 0x1b873593) & 0xffffffff;
    h ^= k;
  }

  h ^= length;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) & 0xffffffff;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) & 0xffffffff;
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * RC4 流密码加密/解密
 */
export function rc4BinaryString(plainText: string, key: string): string {
  const state = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + state[i] + key.charCodeAt(i % key.length)) & 0xff;
    [state[i], state[j]] = [state[j], state[i]];
  }

  let i = 0;
  j = 0;
  let encrypted = "";
  for (let offset = 0; offset < plainText.length; offset++) {
    i = (i + 1) & 0xff;
    j = (j + state[i]) & 0xff;
    [state[i], state[j]] = [state[j], state[i]];
    const keyByte = state[(state[i] + state[j]) & 0xff];
    encrypted += String.fromCharCode(plainText.charCodeAt(offset) ^ keyByte);
  }
  return encrypted;
}

// AES 辅助
function mul(a: number, b: number): number {
  let r = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) r ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return r;
}

function keyExpand(key: number[], sbox: number[]): number[][] {
  const Nk = 4,
    Nr = 10;
  const w: number[][] = [];
  for (let i = 0; i < Nk; i++) {
    w[i] = [key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]];
  }
  const rcon = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
  for (let i = Nk; i < 4 * (Nr + 1); i++) {
    let t = w[i - 1].slice();
    if (i % Nk === 0) {
      t = [t[1], t[2], t[3], t[0]].map((x) => sbox[x]);
      t[0] ^= rcon[i / Nk - 1];
    }
    w[i] = w[i - Nk].map((x, j) => x ^ t[j]);
  }
  return w;
}

export function aesEncBlock(pt: number[], key: number[], sbox: number[]): number[] {
  const Nr = 10;
  const w = keyExpand(key, sbox);
  const s = new Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) s[r * 4 + c] = pt[c * 4 + r];
  }
  function addRK(round: number) {
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) s[r * 4 + c] ^= w[round * 4 + c][r];
    }
  }
  addRK(0);
  for (let round = 1; round <= Nr; round++) {
    for (let i = 0; i < 16; i++) s[i] = sbox[s[i]];
    const t = s.slice();
    for (let r = 1; r < 4; r++) {
      for (let c = 0; c < 4; c++) s[r * 4 + c] = t[r * 4 + ((c + r) % 4)];
    }
    if (round < Nr) {
      const o = s.slice();
      for (let c = 0; c < 4; c++) {
        const a0 = o[c],
          a1 = o[4 + c],
          a2 = o[8 + c],
          a3 = o[12 + c];
        s[c] = mul(a0, 2) ^ mul(a1, 3) ^ a2 ^ a3;
        s[4 + c] = a0 ^ mul(a1, 2) ^ mul(a2, 3) ^ a3;
        s[8 + c] = a0 ^ a1 ^ mul(a2, 2) ^ mul(a3, 3);
        s[12 + c] = mul(a0, 3) ^ a1 ^ a2 ^ mul(a3, 2);
      }
    }
    addRK(round);
  }
  const out = new Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) out[c * 4 + r] = s[r * 4 + c];
  }
  return out;
}

let _xraySeq = Math.floor(Math.random() * 0x7fffff);

export function generateXrayTraceId(): string {
  const nowMs = Date.now();
  _xraySeq = (_xraySeq + 1) & 0x7fffff;
  const part1Big = ((BigInt(nowMs) << 23n) | BigInt(_xraySeq)) & 0xffffffffffffffffn;
  const part1 = part1Big.toString(16).padStart(16, "0");
  const rand1 = crypto.randomBytes(4).readUInt32BE(0);
  const rand2 = crypto.randomBytes(4).readUInt32BE(0);
  const part2Big = ((BigInt(rand1) << 32n) | BigInt(rand2)) & 0xffffffffffffffffn;
  const part2 = part2Big.toString(16).padStart(16, "0");
  return part1 + part2;
}

export function generateXB3TraceId(len = 16): string {
  const chars = "abcdef0123456789";
  let id = "";
  for (let i = 0; i < len; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function generateXyDirection(userId: string): string {
  if (!userId) return "0";
  return String((murmurHash3_32(userId, 151488) % 100) + 1);
}
