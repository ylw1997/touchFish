const DEFAULT_DEVICE_ID = "81ADBFD6-6921-482B-9AB9-A29E7CC7BB55";

function getDeviceId(token) {
  if (!token || token.length < 10) return DEFAULT_DEVICE_ID;
  let normalized = token.toLowerCase().replace(/[^a-f0-9]/g, "");
  if (normalized.length < 32) normalized = normalized.padEnd(32, "0");
  normalized = normalized.slice(0, 32);
  return [
    normalized.slice(0, 8),
    normalized.slice(8, 12),
    "4" + normalized.slice(13, 16),
    "a" + normalized.slice(17, 20),
    normalized.slice(20, 32),
  ].join("-").toUpperCase();
}

function buildXiaoyuzhouHeaders(options = {}) {
  const headers = {
    host: "api.xiaoyuzhoufm.com",
    "user-agent": "Xiaoyuzhou/2.57.1 (build:1576; iOS 17.4.1)",
    market: "AppStore",
    "app-buildno": "1576",
    os: "ios",
    "x-jike-device-id": options.deviceId || DEFAULT_DEVICE_ID,
    manufacturer: "Apple",
    bundleid: "app.podcast.cosmos",
    connection: "keep-alive",
    "accept-language": options.acceptLanguage || "zh-Hant-HK;q=1.0, zh-Hans-CN;q=0.9",
    model: "iPhone14,2",
    "app-permissions": "4",
    accept: "*/*",
    "app-version": "2.57.1",
    wificonnected: "true",
    "os-version": "17.4.1",
    "x-custom-xiaoyuzhou-app-dev": "",
    "abtest-info": options.abtestInfo || "{}",
    timezone: options.timezone || "Asia/Shanghai",
  };
  if (options.accessToken) headers["x-jike-access-token"] = options.accessToken;
  if (options.refreshToken) headers["x-jike-refresh-token"] = options.refreshToken;
  if (options.contentType) headers["content-type"] = options.contentType;
  if (options.localTime) headers["local-time"] = options.localTime;
  return headers;
}

function extractXiaoyuzhouAuth(headers) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers || {})) {
    normalized[key.toLowerCase()] = Array.isArray(value) ? value[0] || "" : value || "";
  }
  return {
    accessToken: normalized["x-jike-access-token"] || "",
    refreshToken: normalized["x-jike-refresh-token"] || "",
  };
}

function nowIsoWithTimezone() {
  const d = new Date();
  const tzo = -d.getTimezoneOffset();
  const sign = tzo >= 0 ? "+" : "-";
  const pad = (num) => String(num).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${pad(Math.floor(Math.abs(tzo) / 60))}:${pad(Math.abs(tzo) % 60)}`;
}

module.exports = {
  buildXiaoyuzhouHeaders,
  extractXiaoyuzhouAuth,
  getDeviceId,
  nowIsoWithTimezone,
};
