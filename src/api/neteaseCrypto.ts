import * as crypto from "crypto";

const presetKey = Buffer.from("0CoJUm6Qyw8W8jud");
const iv = Buffer.from("0102030405060708");
const pubKey =
  "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB\n-----END PUBLIC KEY-----";

/**
 * 生成 16 位随机字符密钥
 */
function generateRandomKey(length: number): string {
  const keys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < length; i++) {
    key += keys[Math.floor(Math.random() * keys.length)];
  }
  return key;
}

/**
 * AES-128-CBC 加密，接收 Buffer 并返回 Buffer
 */
function aesEncrypt(buffer: Buffer, key: Buffer, ivBuffer: Buffer): Buffer {
  const cipher = crypto.createCipheriv("aes-128-cbc", key, ivBuffer);
  return Buffer.concat([cipher.update(buffer), cipher.final()]);
}

/**
 * RSA 加密，使用 Node.js crypto 的 publicEncrypt 方法
 */
function rsaEncrypt(buffer: Buffer, key: string): string {
  const paddedBuffer = Buffer.concat([Buffer.alloc(128 - buffer.length), buffer]);
  return crypto.publicEncrypt(
    { key, padding: crypto.constants.RSA_NO_PADDING },
    paddedBuffer
  ).toString("hex");
}

/**
 * 官方网易云音乐 weapi 加密入口
 */
export function weapiEncrypt(payload: any): { params: string; encSecKey: string } {
  const text = JSON.stringify(payload);
  const secKey = generateRandomKey(16);

  // 1. 第一层 AES 加密：使用预设密钥 presetKey，将结果转换为 base64 字符串
  const aes1 = aesEncrypt(Buffer.from(text), presetKey, iv).toString("base64");
  // 2. 第二层 AES 加密：使用随机 secKey 加密 aes1 字符串，将结果转换为 base64 字符串
  const params = aesEncrypt(Buffer.from(aes1), Buffer.from(secKey), iv).toString("base64");
  // 3. RSA 加密：将反转后的 secKey 进行 RSA 加密得到 encSecKey
  const encSecKey = rsaEncrypt(Buffer.from(secKey).reverse(), pubKey);

  return {
    params,
    encSecKey,
  };
}

const LINUX_AES_KEY = "rFgB&h#%2?^eDg:Q";

/**
 * 官方网易云音乐 linuxapi 加密入口 (AES-128-ECB, hex 格式, 密钥为 rFgB&h#%2?^eDg:Q)
 */
export function linuxEncrypt(payload: any): string {
  const text = JSON.stringify(payload);
  const cipher = crypto.createCipheriv("aes-128-ecb", Buffer.from(LINUX_AES_KEY), "");
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted.toUpperCase();
}
