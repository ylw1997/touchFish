export const XIAOYUZHOU_DEVICE_ID =
  "81ADBFD6-6921-482B-9AB9-A29E7CC7BB55";

// 从 token 生成一致的 deviceId（同一用户始终使用相同 deviceId）
function generateDeviceIdFromToken(token: string): string {
  if (!token || token.length < 10) {
    return XIAOYUZHOU_DEVICE_ID;
  }

  // 使用 token 的前 32 个字符来构造 UUID
  // 如果 token 不够长，重复填充
  let normalized = token.toLowerCase().replace(/[^a-f0-9]/g, '');
  if (normalized.length < 32) {
    normalized = normalized.padEnd(32, '0');
  }
  normalized = normalized.slice(0, 32);

  // 生成 UUID 格式（8-4-4-4-12）
  const part1 = normalized.slice(0, 8);
  const part2 = normalized.slice(8, 12);
  // 第3段的第1个字符必须是 4 (UUID version)
  const part3 = "4" + normalized.slice(13, 16);
  // 第4段的第1个字符必须是 8, 9, a, 或 b (UUID variant)
  const part4 = "a" + normalized.slice(17, 20);
  const part5 = normalized.slice(20, 32);

  const uuid = `${part1}-${part2}-${part3}-${part4}-${part5}`.toUpperCase();
  return uuid;
}

// 获取 deviceId：优先使用基于 token 的，回退到默认值
export function getDeviceId(token?: string): string {
  if (token && token.length > 10) {
    return generateDeviceIdFromToken(token);
  }
  return XIAOYUZHOU_DEVICE_ID;
}

export interface XiaoyuzhouHeaderOptions {
  accessToken?: string;
  refreshToken?: string;
  contentType?: string;
  localTime?: string;
  timezone?: string;
  acceptLanguage?: string;
  abtestInfo?: string;
  deviceId?: string;
}

export interface XiaoyuzhouAuth {
  accessToken: string;
  refreshToken: string;
}

export function buildXiaoyuzhouHeaders(
  options: XiaoyuzhouHeaderOptions = {},
): Record<string, string> {
  const {
    accessToken,
    refreshToken,
    contentType,
    localTime,
    timezone = "Asia/Shanghai",
    acceptLanguage = "zh-Hant-HK;q=1.0, zh-Hans-CN;q=0.9",
    abtestInfo = '{"old_user_discovery_feed":"enable"}',
    deviceId = XIAOYUZHOU_DEVICE_ID,
                    } = options;

  const headers: Record<string, string> = {
    Host: "api.xiaoyuzhoufm.com",
    "User-Agent": "Xiaoyuzhou/2.57.1 (build:1576; iOS 17.4.1)",
    Market: "AppStore",
    "App-BuildNo": "1576",
    OS: "ios",
    "x-jike-device-id": deviceId,
    Manufacturer: "Apple",
    BundleID: "app.podcast.cosmos",
    Connection: "keep-alive",
    "Accept-Language": acceptLanguage,
    Model: "iPhone14,2",
    "app-permissions": "4",
    Accept: "*/*",
    "App-Version": "2.57.1",
    WifiConnected: "true",
    "OS-Version": "17.4.1",
    "x-custom-xiaoyuzhou-app-dev": "",
    "abtest-info": abtestInfo,
    Timezone: timezone,
  };

  if (accessToken) headers["x-jike-access-token"] = accessToken;
  if (refreshToken) headers["x-jike-refresh-token"] = refreshToken;
  if (contentType) headers["Content-Type"] = contentType;
  if (localTime) headers["Local-Time"] = localTime;

  return headers;
}

export function extractXiaoyuzhouAuth(
  headers: Record<string, string | string[] | undefined>,
): XiaoyuzhouAuth {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      normalized[key.toLowerCase()] = value[0] ?? "";
      continue;
    }
    normalized[key.toLowerCase()] = value ?? "";
  }

  return {
    accessToken: normalized["x-jike-access-token"] ?? "",
    refreshToken: normalized["x-jike-refresh-token"] ?? "",
  };
}
