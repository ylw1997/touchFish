import * as crypto from "crypto";
import { Base64Encoder, ARC4 } from "./xhsCryptoUtils";
import { CryptoConfig } from "./xhsConfig";
import * as FPData from "./xhsFingerprintData";

export class FingerprintGenerator {
  private encoder = new Base64Encoder();

  private weightedRandomChoice<T>(options: T[], weights: number[]): T {
    const totalWeight = weights.reduce((acc, val) => acc + val, 0);
    const random = Math.random() * totalWeight;
    let sum = 0;
    for (let i = 0; i < options.length; i++) {
      sum += weights[i];
      if (random < sum) {
        return options[i];
      }
    }
    return options[options.length - 1];
  }

  private getRendererInfo(): { vendor: string; renderer: string } {
    const rendererStr = FPData.GPU_VENDORS[Math.floor(Math.random() * FPData.GPU_VENDORS.length)];
    const parts = rendererStr.split("|");
    return { vendor: parts[0], renderer: parts[1] };
  }

  private getScreenConfig(): { width: number; height: number; availWidth: number; availHeight: number } {
    const resStr = this.weightedRandomChoice(FPData.SCREEN_RESOLUTIONS.resolutions, FPData.SCREEN_RESOLUTIONS.weights);
    const [widthStr, heightStr] = resStr.split(";");
    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);

    let availWidth = width;
    let availHeight = height;

    if (Math.random() < 0.5) {
      availWidth = width - parseInt(this.weightedRandomChoice(["0", "30", "60", "80"], [0.1, 0.4, 0.3, 0.2]), 10);
    } else {
      availHeight = height - parseInt(this.weightedRandomChoice(["30", "60", "80", "100"], [0.2, 0.5, 0.2, 0.1]), 10);
    }

    return { width, height, availWidth, availHeight };
  }

  private generateWebglHash(): string {
    return crypto.createHash("md5").update(crypto.randomBytes(32)).digest("hex");
  }

  public generateB1(fp: Record<string, any>): string {
    const b1Fp = {
      x33: fp["x33"],
      x34: fp["x34"],
      x35: fp["x35"],
      x36: fp["x36"],
      x37: fp["x37"],
      x38: fp["x38"],
      x39: fp["x39"],
      x42: fp["x42"],
      x43: fp["x43"],
      x44: fp["x44"],
      x45: fp["x45"],
      x46: fp["x46"],
      x48: fp["x48"],
      x49: fp["x49"],
      x50: fp["x50"],
      x51: fp["x51"],
      x52: fp["x52"],
      x82: fp["x82"],
    };
    const b1Json = JSON.stringify(b1Fp).replace(/:/g, ":").replace(/,/g, ",");
    
    const arc4 = new ARC4(CryptoConfig.B1_SECRET_KEY);
    const ciphertextBytes = arc4.encrypt(b1Json);
    
    // Equivalent to encodeURIComponent and custom mapping in Python
    // Python code:
    // ciphertext = cipher.encrypt(b1_json.encode("utf-8")).decode("latin1")
    // encoded_url = urllib.parse.quote(ciphertext, safe="!*'()~_-")
    // Note: Python's urllib.parse.quote escapes non-ASCII characters and certain symbols.
    

    
    // In JavaScript, encodeURIComponent encodes more chars than Python's quote by default.
    // However, the python code says: b = []; for c in encoded_url.split("%")[1:]: ...
    // This is basically mapping the `%XX` hex encoding to bytes. 
    // We can just construct it directly from the ciphertextBytes, skipping the URL encode/decode.
    // Wait, the Python logic is:
    // encoded_url = urllib.parse.quote(ciphertext, safe="!*'()~_-")
    // for c in encoded_url.split("%")[1:]:
    //     chars = list(c)
    //     b.append(int("".join(chars[:2]), 16))
    //     [b.append(ord(j)) for j in chars[2:]]
    // This logic takes the URL encoded string, splits by '%', the first two characters after '%' are hex parsed to a byte, and the remaining are ascii converted.
    // Actually, this is exactly identical to just URL-encoding and then mapping each URL-encoded char back to a byte sequence, except the first part before the first '%' is discarded! 
    // Wait, if ciphertext starts with a non-escaped character, `encoded_url.split("%")[0]` will contain it, and `[1:]` skips it!
    // To be absolutely safe and match python exactly, we implement it exactly.

    const safeChars = new Set("!*'()~_-".split(""));
    let encodedUrl = "";
    for (let i = 0; i < ciphertextBytes.length; i++) {
      const byte = ciphertextBytes[i];
      const char = String.fromCharCode(byte);
      if ((byte >= 0x41 && byte <= 0x5a) || (byte >= 0x61 && byte <= 0x7a) || (byte >= 0x30 && byte <= 0x39) || safeChars.has(char)) {
        encodedUrl += char;
      } else {
        encodedUrl += "%" + byte.toString(16).toUpperCase().padStart(2, "0");
      }
    }

    const b: number[] = [];
    const parts = encodedUrl.split("%");
    for (let i = 1; i < parts.length; i++) {
      const c = parts[i];
      const hex = c.substring(0, 2);
      b.push(parseInt(hex, 16));
      for (let j = 2; j < c.length; j++) {
        b.push(c.charCodeAt(j));
      }
    }

    return this.encoder.encode(new Uint8Array(b));
  }

  public generate(cookies: Record<string, string>, userAgent: string): Record<string, any> {
    const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
    const screenConfig = this.getScreenConfig();
    const isIncognitoMode = this.weightedRandomChoice(["true", "false"], [0.95, 0.05]);
    const rendererInfo = this.getRendererInfo();

    const x78_y = Math.floor(Math.random() * (2450 - 2350 + 1)) + 2350;

    const fp: Record<string, any> = {
      x1: userAgent,
      x2: "false",
      x3: "zh-CN",
      x4: this.weightedRandomChoice(FPData.COLOR_DEPTH_OPTIONS.values.map(String), FPData.COLOR_DEPTH_OPTIONS.weights),
      x5: this.weightedRandomChoice(FPData.DEVICE_MEMORY_OPTIONS.values.map(String), FPData.DEVICE_MEMORY_OPTIONS.weights),
      x6: "24",
      x7: `${rendererInfo.vendor},${rendererInfo.renderer}`,
      x8: this.weightedRandomChoice(FPData.CORE_OPTIONS.values.map(String), FPData.CORE_OPTIONS.weights),
      x9: `${screenConfig.width};${screenConfig.height}`,
      x10: `${screenConfig.availWidth};${screenConfig.availHeight}`,
      x11: "-480",
      x12: "Asia/Shanghai",
      x13: isIncognitoMode,
      x14: isIncognitoMode,
      x15: isIncognitoMode,
      x16: "false",
      x17: "false",
      x18: "un",
      x19: "Win32",
      x20: "",
      x21: FPData.BROWSER_PLUGINS,
      x22: this.generateWebglHash(),
      x23: "false",
      x24: "false",
      x25: "false",
      x26: "false",
      x27: "false",
      x28: "0,false,false",
      x29: "4,7,8",
      x30: "swf object not loaded",
      x33: "0",
      x34: "0",
      x35: "0",
      x36: `${Math.floor(Math.random() * 20) + 1}`,
      x37: "0|0|0|0|0|0|0|0|0|1|0|0|0|0|0|0|0|0|1|0|0|0|0|0",
      x38: "0|0|1|0|1|0|0|0|0|0|1|0|1|0|1|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0",
      x39: 0,
      x40: "0",
      x41: "0",
      x42: "3.4.4",
      x43: FPData.CANVAS_HASH,
      x44: `${Date.now()}`,
      x45: "__SEC_CAV__1-1-1-1-1|__SEC_WSA__|",
      x46: "false",
      x47: "1|0|0|0|0|0",
      x48: "",
      x49: "{list:[],type:}",
      x50: "",
      x51: "",
      x52: "",
      x55: "380,380,360,400,380,400,420,380,400,400,360,360,440,420",
      x56: `${rendererInfo.vendor}|${rendererInfo.renderer}|${this.generateWebglHash()}|35`,
      x57: cookieString,
      x58: "180",
      x59: "2",
      x60: "63",
      x61: "1291",
      x62: "2047",
      x63: "0",
      x64: "0",
      x65: "0",
      x66: {
        referer: "",
        location: "https://www.xiaohongshu.com/explore",
        frame: 0,
      },
      x67: "1|0",
      x68: "0",
      x69: "326|1292|30",
      x70: ["location"],
      x71: "true",
      x72: "complete",
      x73: "1191",
      x74: "0|0|0",
      x75: "Google Inc.",
      x76: "true",
      x77: "1|1|1|1|1|1|1|1|1|1",
      x78: {
        x: 0,
        y: x78_y,
        left: 0,
        right: 290.828125,
        bottom: x78_y + 18,
        height: 18,
        top: x78_y,
        width: 290.828125,
        font: FPData.FONTS,
      },
      x82: "_0x17a2|_0x1954",
      x31: "124.04347527516074",
      x79: "144|599565058866",
      x53: crypto.createHash("md5").update(crypto.randomBytes(32)).digest("hex"),
      x54: FPData.VOICE_HASH_OPTIONS,
      x80: "1|[object FileSystemDirectoryHandle]",
    };

    return fp;
  }
}
