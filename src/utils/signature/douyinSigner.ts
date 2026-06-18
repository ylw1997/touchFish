import * as xbogusModule from "xbogus";

/**
 * 根据 URL 和 User-Agent 生成抖音 X-Bogus 签名值
 * @param url 请求的原始 URL (包含 query 参数)
 * @param userAgent 请求时使用的 User-Agent
 * @returns 签名字符串，如果失败则返回空字符串
 */
export function getDouyinSignature(url: string, userAgent: string): string {
  try {
    const signFunc = (xbogusModule as any).default || xbogusModule;
    if (typeof signFunc === "function") {
      return signFunc(url, userAgent);
    }
    if (signFunc && typeof (signFunc as any).sign === "function") {
      return (signFunc as any).sign(url, userAgent);
    }
    throw new TypeError("xbogus is not a function");
  } catch (e) {
    console.error("[douyin signer error]", e);
    return "";
  }
}

/**
 * 为给定的抖音 API URL 附加 X-Bogus 签名参数
 * @param url 原始 URL
 * @param userAgent User-Agent
 * @returns 附加了 X-Bogus 参数的 URL
 */
export function signDouyinUrl(url: string, userAgent: string): string {
  const sign = getDouyinSignature(url, userAgent);
  if (sign) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}X-Bogus=${sign}`;
  }
  return url;
}
