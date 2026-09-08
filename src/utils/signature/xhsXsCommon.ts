import { CryptoConfig } from "./xhsConfig";
import { gens9, encodeUtf8, b64Custom } from "./xhsCryptoUtils";

export interface XsCommonOptions {
  b1b1?: string;
  signVersion?: string;
  platform?: string;
  appId?: string;
  webBuild?: string;
  signCount?: number;
}

export function xsCommon(
  a1: string,
  xt: string,
  xs: string,
  dslPair: string,
  b1: string = "",
  options: XsCommonOptions = {}
): string {
  const b1Value = String(b1 || "");
  const webBuild = String(options.webBuild || CryptoConfig.WEB_BUILD);
  const coldB1 = b1Value === "";

  const d = {
    s0: 5,
    s1: "",
    x0: String(options.b1b1 || "1"),
    x1: String(options.signVersion || CryptoConfig.SIGN_VERSION),
    x2: String(options.platform || CryptoConfig.PLATFORM),
    x3: String(options.appId || CryptoConfig.APP_ID),
    x4: webBuild,
    x5: a1,
    x6: "",
    x7: "",
    x8: coldB1 ? null : b1Value,
    x9: gens9(coldB1 ? "null" : b1Value),
    x10: Number(options.signCount || 0),
    x11: "normal",
    x12: dslPair,
  };

  return b64Custom(encodeUtf8(JSON.stringify(d)), CryptoConfig.XS_ALPHABET);
}
