export const XIAOYUZHOU_DEVICE_ID =
  "81ADBFD6-6921-482B-9AB9-A29E7CC7BB55";

export interface XiaoyuzhouHeaderOptions {
  accessToken?: string;
  refreshToken?: string;
  contentType?: string;
  localTime?: string;
  timezone?: string;
  acceptLanguage?: string;
  abtestInfo?: string;
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
  } = options;

  const headers: Record<string, string> = {
    Host: "api.xiaoyuzhoufm.com",
    "User-Agent": "Xiaoyuzhou/2.57.1 (build:1576; iOS 17.4.1)",
    Market: "AppStore",
    "App-BuildNo": "1576",
    OS: "ios",
    "x-jike-device-id": XIAOYUZHOU_DEVICE_ID,
    Manufacturer: "Apple",
    BundleID: "app.podcast.cosmos",
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
