import { CryptoConfig } from "./xhsConfig";
import { BitOperations, RandomGenerator } from "./xhsCryptoUtils";


export class CryptoProcessor {
  private bitOps = new BitOperations();
  private randomGen = new RandomGenerator();

  private intToLeBytes(val: number, length: number = 4): number[] {
    const arr: number[] = [];
    let currentVal = val >>> 0;
    for (let i = 0; i < length; i++) {
      arr.push(currentVal & 0xFF);
      currentVal >>>= 8;
    }
    return arr;
  }

  private rotateLeft(val: number, n: number): number {
    const v = val >>> 0;
    return ((v << n) | (v >>> (32 - n))) >>> 0;
  }

  private customHashV2(inputBytes: number[]): number[] {
    let [s0, s1, s2, s3] = CryptoConfig.HASH_IV;
    const length = inputBytes.length;

    s0 ^= length;
    s1 ^= (length << 8) >>> 0;
    s2 ^= (length << 16) >>> 0;
    s3 ^= (length << 24) >>> 0;

    for (let i = 0; i < Math.floor(length / 8); i++) {
      const v0 = (inputBytes[i * 8] | (inputBytes[i * 8 + 1] << 8) | (inputBytes[i * 8 + 2] << 16) | (inputBytes[i * 8 + 3] << 24)) >>> 0;
      const v1 = (inputBytes[i * 8 + 4] | (inputBytes[i * 8 + 5] << 8) | (inputBytes[i * 8 + 6] << 16) | (inputBytes[i * 8 + 7] << 24)) >>> 0;

      s0 = this.rotateLeft(((s0 + v0) >>> 0) ^ s2, 7);
      s1 = this.rotateLeft(((v0 ^ s1) + s3) >>> 0, 11);
      s2 = this.rotateLeft(((s2 + v1) >>> 0) ^ s0, 13);
      s3 = this.rotateLeft(((s3 ^ v1) + s1) >>> 0, 17);
    }

    const t0 = (s0 ^ length) >>> 0;
    const t1 = (s1 ^ t0) >>> 0;
    const t2 = (s2 + t1) >>> 0;
    const t3 = (s3 ^ t2) >>> 0;

    const rotT0 = this.rotateLeft(t0, 9);
    const rotT1 = this.rotateLeft(t1, 13);
    const rotT2 = this.rotateLeft(t2, 17);
    const rotT3 = this.rotateLeft(t3, 19);

    s0 = (rotT0 + rotT2) >>> 0;
    s1 = (rotT1 ^ rotT3) >>> 0;
    s2 = (rotT2 + s0) >>> 0;
    s3 = (rotT3 ^ s1) >>> 0;

    const result: number[] = [];
    for (const s of [s0, s1, s2, s3]) {
      result.push(...this.intToLeBytes(s, 4));
    }
    return result;
  }

  private extractApiPath(uri: string): string {
    try {
      if (uri.startsWith("http")) {
        const urlObj = new URL(uri);
        return urlObj.pathname;
      }
      return uri.split("?")[0];
    } catch {
      return uri.split("?")[0];
    }
  }

  public buildPayloadArray(
    hexParameter: string, // d_value
    hexMd5Path: string,   // m_value
    a1Value: string,
    appIdentifier: string = "xhs-pc-web",
    stringParam: string = "", // used for length
    timestamp?: number
  ): number[] {
    const ts = timestamp !== undefined ? timestamp : Date.now() / 1000;
    const seed = this.randomGen.generateRandomInt();
    const seedByte = seed & 0xFF;

    const payload: number[] = [...CryptoConfig.VERSION_BYTES];
    payload.push(...this.intToLeBytes(seed, 4));

    const tsMs = Math.floor(ts * 1000);
    // Number represents maximum 2^53 integers, but intToLeBytes up to 8 bytes.
    // In JS we can just split standard TS.
    const tsBytes = [];
    let currentTs = BigInt(tsMs);
    for (let i = 0; i < CryptoConfig.TIMESTAMP_LE_LENGTH; i++) {
      tsBytes.push(Number(currentTs & BigInt(0xFF)));
      currentTs >>= BigInt(8);
    }
    payload.push(...tsBytes);

    const timeOffset = this.randomGen.generateRandomByteInRange(
      CryptoConfig.ENV_FINGERPRINT_TIME_OFFSET_MIN,
      CryptoConfig.ENV_FINGERPRINT_TIME_OFFSET_MAX
    );
    const effectiveTsMs = Math.floor((ts - timeOffset) * 1000);
    const effectiveTsBytes = [];
    let curEffTs = BigInt(effectiveTsMs);
    for (let i = 0; i < CryptoConfig.TIMESTAMP_LE_LENGTH; i++) {
      effectiveTsBytes.push(Number(curEffTs & BigInt(0xFF)));
      curEffTs >>= BigInt(8);
    }
    payload.push(...effectiveTsBytes);

    const sequenceValue = this.randomGen.generateRandomByteInRange(
      CryptoConfig.SEQUENCE_VALUE_MIN,
      CryptoConfig.SEQUENCE_VALUE_MAX
    );
    payload.push(...this.intToLeBytes(sequenceValue, 4));

    const windowPropsLength = this.randomGen.generateRandomByteInRange(
      CryptoConfig.WINDOW_PROPS_LENGTH_MIN,
      CryptoConfig.WINDOW_PROPS_LENGTH_MAX
    );
    payload.push(...this.intToLeBytes(windowPropsLength, 4));

    const uriLength = Buffer.from(stringParam, "utf-8").length;
    payload.push(...this.intToLeBytes(uriLength, 4));

    const md5Bytes = Buffer.from(hexParameter, "hex");
    for (let i = 0; i < CryptoConfig.MD5_XOR_LENGTH; i++) {
      payload.push(md5Bytes[i] ^ seedByte);
    }

    const a1Buf = Buffer.alloc(CryptoConfig.A1_LENGTH, 0);
    Buffer.from(a1Value, "utf-8").copy(a1Buf, 0, 0, CryptoConfig.A1_LENGTH);
    payload.push(a1Buf.length);
    for (let i = 0; i < a1Buf.length; i++) payload.push(a1Buf[i]);

    const appBuf = Buffer.alloc(CryptoConfig.APP_ID_LENGTH, 0);
    Buffer.from(appIdentifier, "utf-8").copy(appBuf, 0, 0, CryptoConfig.APP_ID_LENGTH);
    payload.push(appBuf.length);
    for (let i = 0; i < appBuf.length; i++) payload.push(appBuf[i]);

    const part11: number[] = [1, seedByte ^ CryptoConfig.ENV_TABLE[0]];
    for (let i = 1; i < 15; i++) {
      part11.push(CryptoConfig.ENV_TABLE[i] ^ CryptoConfig.ENV_CHECKS_DEFAULT[i]);
    }
    payload.push(...part11);

    const md5PathBytes = Array.from(Buffer.from(hexMd5Path, "hex"));

    const toHash = [...tsBytes, ...md5PathBytes];
    const hashed = this.customHashV2(toHash);

    payload.push(...CryptoConfig.A3_PREFIX);
    for (let i = 0; i < hashed.length; i++) {
      payload.push(hashed[i] ^ seedByte);
    }

    return payload;
  }
}
