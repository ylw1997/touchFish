/*
 * @Description: Cookie 工具函数（纯 JS/TS 函数，不依赖 vscode 宿主环境，便于复用与单测）
 */

/**
 * 从 Cookie 字符串中提取指定字段的值
 * @param cookie - Cookie 字符串
 * @param field - 要提取的字段名
 * @returns 字段值，如果不存在则返回 undefined
 */
export function getCookieField(
  cookie: string,
  field: string
): string | undefined {
  if (!cookie) return undefined;

  const cookieParts = cookie.split(";");
  for (const part of cookieParts) {
    const [key, ...value] = part.split("=");
    if (key.trim() === field) {
      return value.join("=");
    }
  }

  return undefined;
}

/**
 * 将 Cookie 字符串解析为键值对 Map
 * @param cookieStr - 形如 "k1=v1; k2=v2" 的 Cookie 字符串
 */
export function parseCookieString(cookieStr: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieStr || typeof cookieStr !== "string") return map;

  const parts = cookieStr.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key) {
        map.set(key, val);
      }
    }
  }
  return map;
}

/**
 * 将 Map 序列化回标准 Cookie 字符串
 * @param map - Cookie 键值对 Map
 */
export function serializeCookieMap(map: Map<string, string>): string {
  const pairs: string[] = [];
  for (const [k, v] of map.entries()) {
    pairs.push(`${k}=${v}`);
  }
  return pairs.join("; ");
}

/**
 * 合并新返回的 Set-Cookie 列表到当前 Cookie 字符串中
 * @param currentCookie - 当前已有的 Cookie 字符串
 * @param setCookies - 响应头中的 set-cookie（单个字符串或字符串数组）
 * @returns { updatedCookie, hasChanged, updatedKeys }
 */
export function mergeCookies(
  currentCookie: string,
  setCookies: string[] | string | undefined | null
): {
  updatedCookie: string;
  hasChanged: boolean;
  updatedKeys: string[];
} {
  if (!setCookies) {
    return { updatedCookie: currentCookie, hasChanged: false, updatedKeys: [] };
  }

  const list = Array.isArray(setCookies) ? setCookies : [setCookies];
  const cookieMap = parseCookieString(currentCookie);
  const updatedKeys: string[] = [];

  for (const item of list) {
    if (!item || typeof item !== "string") continue;
    // Set-Cookie 的首项为 "Key=Value"，分号后为 attributes (Expires, Path 等)
    const firstPart = item.split(";")[0]?.trim();
    if (!firstPart) continue;

    const eqIdx = firstPart.indexOf("=");
    if (eqIdx <= 0) continue;

    const key = firstPart.slice(0, eqIdx).trim();
    const val = firstPart.slice(eqIdx + 1).trim();

    // 过滤掉无效值/清空值
    if (!key || !val || val === '""' || val === "deleted" || val === "null") {
      continue;
    }

    if (cookieMap.get(key) !== val) {
      cookieMap.set(key, val);
      updatedKeys.push(key);
    }
  }

  return {
    updatedCookie: serializeCookieMap(cookieMap),
    hasChanged: updatedKeys.length > 0,
    updatedKeys,
  };
}
