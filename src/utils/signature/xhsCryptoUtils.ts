import { CryptoConfig } from "./xhsConfig";

export class Base64Encoder {
  private customEncodeTable: Record<string, string> = {};
  private customDecodeTable: Record<string, string> = {};
  private x3EncodeTable: Record<string, string> = {};
  private x3DecodeTable: Record<string, string> = {};

  constructor() {
    for (let i = 0; i < CryptoConfig.STANDARD_BASE64_ALPHABET.length; i++) {
      this.customEncodeTable[CryptoConfig.STANDARD_BASE64_ALPHABET[i]] = CryptoConfig.CUSTOM_BASE64_ALPHABET[i];
      this.customDecodeTable[CryptoConfig.CUSTOM_BASE64_ALPHABET[i]] = CryptoConfig.STANDARD_BASE64_ALPHABET[i];

      this.x3EncodeTable[CryptoConfig.STANDARD_BASE64_ALPHABET[i]] = CryptoConfig.X3_BASE64_ALPHABET[i];
      this.x3DecodeTable[CryptoConfig.X3_BASE64_ALPHABET[i]] = CryptoConfig.STANDARD_BASE64_ALPHABET[i];
    }
  }

  public encode(dataToEncode: Uint8Array | string): string {
    let dataBytes: Uint8Array;
    if (typeof dataToEncode === "string") {
      dataBytes = new TextEncoder().encode(dataToEncode);
    } else {
      dataBytes = dataToEncode;
    }
    const standardEncoded = Buffer.from(dataBytes).toString("base64");
    return standardEncoded.split("").map(c => this.customEncodeTable[c] || c).join("");
  }

  public decode(encodedString: string): string {
    const standardEncoded = encodedString.split("").map(c => this.customDecodeTable[c] || c).join("");
    return Buffer.from(standardEncoded, "base64").toString("utf8");
  }

  public encodeX3(inputBytes: Uint8Array): string {
    const standardEncoded = Buffer.from(inputBytes).toString("base64");
    return standardEncoded.split("").map(c => this.x3EncodeTable[c] || c).join("");
  }

  public decodeX3(encodedString: string): Uint8Array {
    const standardEncoded = encodedString.split("").map(c => this.x3DecodeTable[c] || c).join("");
    return new Uint8Array(Buffer.from(standardEncoded, "base64"));
  }
}

export class BitOperations {
  public normalizeTo32Bit(value: number): number {
    return (value & CryptoConfig.MAX_32BIT) >>> 0;
  }

  public toSigned32Bit(unsignedValue: number): number {
    return unsignedValue | 0; // Bitwise OR 0 in JS converts to signed 32-bit
  }

  public computeSeedValue(seed32Bit: number): number {
    const normalizedSeed = this.normalizeTo32Bit(seed32Bit);

    const shift15Bits = normalizedSeed >>> 15;
    const shift13Bits = normalizedSeed >>> 13;
    const shift12Bits = normalizedSeed >>> 12;
    const shift10Bits = normalizedSeed >>> 10;

    const xorMaskedResult = (shift15Bits & ~shift13Bits) | (shift13Bits & ~shift15Bits);
    const shiftedResult = ((xorMaskedResult ^ shift12Bits ^ shift10Bits) << 31) >>> 0;

    return this.toSigned32Bit(shiftedResult);
  }

  public xorTransformArray(sourceIntegers: number[] | Uint8Array): Uint8Array {
    const resultBytes = new Uint8Array(sourceIntegers.length);
    const keyBytes = Buffer.from(CryptoConfig.HEX_KEY, "hex");
    const keyLength = keyBytes.length;

    for (let index = 0; index < sourceIntegers.length; index++) {
      if (index < keyLength) {
        resultBytes[index] = (sourceIntegers[index] ^ keyBytes[index]) & 0xFF;
      } else {
        resultBytes[index] = sourceIntegers[index] & 0xFF;
      }
    }

    return resultBytes;
  }
}

export class HexProcessor {
  public hexStringToBytes(hexString: string): number[] {
    const byteValues: number[] = [];
    for (let i = 0; i < hexString.length; i += CryptoConfig.HEX_CHUNK_SIZE) {
      byteValues.push(parseInt(hexString.substring(i, i + CryptoConfig.HEX_CHUNK_SIZE), 16));
    }
    return byteValues;
  }

  public processHexParameter(hexString: string, xorKey: number): number[] {
    if (hexString.length !== CryptoConfig.EXPECTED_HEX_LENGTH) {
      throw new Error(`hex parameter must be ${CryptoConfig.EXPECTED_HEX_LENGTH} characters`);
    }

    const byteValues = this.hexStringToBytes(hexString);
    return byteValues.map(byteVal => byteVal ^ xorKey).slice(0, CryptoConfig.OUTPUT_BYTE_COUNT);
  }
}

export class CRC32 {
  private static MASK32 = 0xFFFFFFFF;
  private static POLY = 0xEDB88320;
  private static _TABLE: number[] | null = null;

  private static ensureTable() {
    if (this._TABLE !== null) return;
    const tbl = new Array(256);
    for (let d = 0; d < 256; d++) {
      let r = d;
      for (let i = 0; i < 8; i++) {
        r = (r & 1) ? ((r >>> 1) ^ this.POLY) : (r >>> 1);
        r = (r & this.MASK32) >>> 0;
      }
      tbl[d] = r;
    }
    this._TABLE = tbl;
  }

  public static crc32JsInt(data: string | Uint8Array, signed: boolean = true): number {
    this.ensureTable();
    let c = this.MASK32;

    let it: Uint8Array;
    if (typeof data === "string") {
      it = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        it[i] = data.charCodeAt(i) & 0xFF;
      }
    } else {
      it = data;
    }

    for (let i = 0; i < it.length; i++) {
      const b = it[i];
      c = (this._TABLE![((c & 0xFF) ^ b) & 0xFF] ^ (c >>> 8)) >>> 0;
    }

    const u = ((this.MASK32 ^ c) ^ this.POLY) >>> 0;
    return signed ? (u | 0) : u;
  }
}

export class ARC4 {
  private S: number[] = new Array(256);
  private i: number = 0;
  private j: number = 0;

  constructor(key: string | Uint8Array) {
    const keyBytes = typeof key === "string" ? new TextEncoder().encode(key) : key;
    for (let i = 0; i < 256; i++) {
      this.S[i] = i;
    }
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + this.S[i] + keyBytes[i % keyBytes.length]) % 256;
      const temp = this.S[i];
      this.S[i] = this.S[j];
      this.S[j] = temp;
    }
  }

  public encrypt(data: Uint8Array | string): Uint8Array {
    const dataBytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const out = new Uint8Array(dataBytes.length);
    for (let k = 0; k < dataBytes.length; k++) {
      this.i = (this.i + 1) % 256;
      this.j = (this.j + this.S[this.i]) % 256;
      const temp = this.S[this.i];
      this.S[this.i] = this.S[this.j];
      this.S[this.j] = temp;
      const K = this.S[(this.S[this.i] + this.S[this.j]) % 256];
      out[k] = dataBytes[k] ^ K;
    }
    return out;
  }
}

export class RandomGenerator {
  public generateRandomInt(): number {
    return Math.floor(Math.random() * (CryptoConfig.MAX_32BIT + 1));
  }

  public generateRandomByteInRange(minVal: number, maxVal: number): number {
    return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
  }

  public generateB3TraceId(): string {
    let traceId = "";
    for (let i = 0; i < CryptoConfig.B3_TRACE_ID_LENGTH; i++) {
      traceId += CryptoConfig.HEX_CHARS[Math.floor(Math.random() * 16)];
    }
    return traceId;
  }

  public generateXrayTraceId(timestamp: number = Date.now(), seq?: number): string {
    const actualSeq = seq !== undefined ? seq : Math.floor(Math.random() * (CryptoConfig.XRAY_TRACE_ID_SEQ_MAX + 1));
    const part1Num = (BigInt(timestamp) << BigInt(CryptoConfig.XRAY_TRACE_ID_TIMESTAMP_SHIFT)) | BigInt(actualSeq);
    const part1 = part1Num.toString(16).padStart(CryptoConfig.XRAY_TRACE_ID_PART1_LENGTH, "0");

    let part2 = "";
    for (let i = 0; i < CryptoConfig.XRAY_TRACE_ID_PART2_LENGTH; i++) {
      part2 += CryptoConfig.HEX_CHARS[Math.floor(Math.random() * 16)];
    }
    return part1 + part2;
  }
}
