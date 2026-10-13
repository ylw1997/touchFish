import axios, { AxiosError } from "axios";
import {
  buildXiaoyuzhouHeaders,
  extractXiaoyuzhouAuth,
  getDeviceId,
} from "./xiaoyuzhouShared";

const CREATOR_BASE_URL = "https://podcaster-api.xiaoyuzhoufm.com";
const APP_BASE_URL = "https://api.xiaoyuzhoufm.com";
export const xiaoyuzhouHttp = axios.create({
  timeout: 30000,
});

export interface XiaoyuzhouCredential {
  accessToken: string;
  refreshToken: string;
}

export interface XiaoyuzhouUserInfo {
  uid: string;
  nickname: string;
  avatar?: string;
}

export interface XiaoyuzhouApiResult<T> {
  code: number;
  message?: string;
  data: T;
}

let globalCredential: XiaoyuzhouCredential | null = null;
let isRefreshing = false;
const refreshQueue: Array<(credential: XiaoyuzhouCredential | null) => void> =
  [];

export function setGlobalCredential(credential: XiaoyuzhouCredential | null) {
  globalCredential = credential;
}

export function getGlobalCredential(): XiaoyuzhouCredential | null {
  return globalCredential;
}

export type TokenRefreshedHandler = (credential: XiaoyuzhouCredential) => void;
let tokenRefreshedHandler: TokenRefreshedHandler | null = null;

export function onTokenRefreshed(handler: TokenRefreshedHandler) {
  tokenRefreshedHandler = handler;
}

function getCredential(credential?: XiaoyuzhouCredential | null) {
  return credential ?? globalCredential;
}

function getNowIsoString() {
  const d = new Date();
  const tzo = -d.getTimezoneOffset();
  const dif = tzo >= 0 ? "+" : "-";
  const pad = (num: number) => String(num).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":" +
    pad(d.getSeconds()) +
    dif +
    pad(Math.floor(Math.abs(tzo) / 60)) +
    ":" +
    pad(Math.abs(tzo) % 60)
  );
}

function getCreatorHeaders() {
  return {
    accept: "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    "content-type": "application/json;charset=UTF-8",
    "x-app-build-time": "2026-04-08 10:43:10 +0800",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    Origin: "https://podcaster.xiaoyuzhoufm.com",
    Referer: "https://podcaster.xiaoyuzhoufm.com/login",
  };
}

/**
 * Refresh access token using refresh token
 * Following xyz implementation: POST /app_auth_tokens.refresh
 * https://github.com/ultrazg/xyz/blob/main/handlers/token.go
 */
async function doRefreshToken(
  credential: XiaoyuzhouCredential,
): Promise<XiaoyuzhouCredential | null> {
  try {
    console.log("[xiaoyuzhou] Refreshing token...", {
      accessToken: credential.accessToken.slice(0, 20) + "...",
      refreshToken: credential.refreshToken.slice(0, 20) + "...",
    });

    // 使用 refreshToken 生成 deviceId
    const deviceId = getDeviceId(credential.refreshToken);
    console.log("[xiaoyuzhou] Using deviceId:", deviceId.slice(0, 8) + "...");

    const response = await xiaoyuzhouHttp.post(
      `${APP_BASE_URL}/app_auth_tokens.refresh`,
      null, // 无请求体
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: credential.accessToken,
          refreshToken: credential.refreshToken,
          contentType: "application/x-www-form-urlencoded; charset=utf-8",
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );

    console.log("[xiaoyuzhou] Refresh response headers:", response.headers);

    const newAuth = extractXiaoyuzhouAuth(
      response.headers as Record<string, string | string[] | undefined>,
    );

    console.log("[xiaoyuzhou] Extracted auth:", {
      hasAccessToken: !!newAuth.accessToken,
      hasRefreshToken: !!newAuth.refreshToken,
    });

    if (newAuth.accessToken && newAuth.refreshToken) {
      const newCredential = {
        accessToken: newAuth.accessToken,
        refreshToken: newAuth.refreshToken,
      };
      setGlobalCredential(newCredential);
      if (tokenRefreshedHandler) {
        tokenRefreshedHandler(newCredential);
      }
      console.log("[xiaoyuzhou] Token refreshed successfully");
      return newCredential;
    }

    console.error("[xiaoyuzhou] Token refresh failed: missing tokens in response");
    return null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[xiaoyuzhou] Token refresh failed:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error("[xiaoyuzhou] Token refresh failed:", error);
    }
    return null;
  }
}

export async function refreshXiaoyuzhouToken(
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouCredential | null> {
  const currentCredential = getCredential(credential);
  if (!currentCredential) {
    return null;
  }

  return doRefreshToken(currentCredential);
}

/**
 * Queue-based token refresh to handle concurrent requests
 */
async function refreshToken(): Promise<XiaoyuzhouCredential | null> {
  const currentCredential = getGlobalCredential();
  if (!currentCredential) {
    return null;
  }

  // If already refreshing, queue this request
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;

  try {
    const newCredential = await doRefreshToken(currentCredential);

    // Notify all queued requests
    while (refreshQueue.length > 0) {
      const resolve = refreshQueue.shift()!;
      resolve(newCredential);
    }

    if (!newCredential) {
      // Refresh failed, clear credential
      setGlobalCredential(null);
    }

    return newCredential;
  } finally {
    isRefreshing = false;
  }
}

function normalizeError(error: unknown, shouldClearCredential: boolean = true) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    if (axiosError.response?.status === 401 && shouldClearCredential) {
      setGlobalCredential(null);
    }
    const resData = axiosError.response?.data;
    let message =
      resData?.toast ||
      resData?.message ||
      resData?.msg ||
      resData?.error ||
      `接口报错 ${axiosError.response?.status}: ${JSON.stringify(axiosError.response?.data)}` ||
      axiosError.message;

    if (typeof message === "string" && message.includes("body/captcha")) {
      message =
        "小宇宙接口启用了人机安全验证，请在弹出的滑块中完成验证后重试";
    }

    return {
      code: axiosError.response?.status ?? -1,
      message,
    };
  }

  return {
    code: -1,
    message: error instanceof Error ? error.message : "Unknown error",
  };
}

export interface XiaoyuzhouQrCodeInfo {
  id: string;
  url: string;
}

export interface XiaoyuzhouQrCodeStatusResult {
  status: "WAITTING" | "SCANNED" | "CONFIRMED" | "EXPIRED";
  credential?: XiaoyuzhouCredential;
  userInfo?: XiaoyuzhouUserInfo;
}

function normalizeUserInfo(user: any): XiaoyuzhouUserInfo {
  return {
    uid: String(user?.uid ?? user?.id ?? ""),
    nickname: String(
      user?.nickname ?? user?.username ?? user?.name ?? "小宇宙用户",
    ),
    avatar:
      user?.avatar?.picture?.smallPicUrl ||
      user?.avatar?.picture?.picUrl ||
      user?.avatar?.picture?.thumbnailUrl ||
      user?.avatarUrl ||
      (typeof user?.avatar === "string" ? user?.avatar : undefined),
  };
}

/**
 * Wrapper to handle API requests with automatic token refresh on 401
 */
async function withAutoRefresh<T>(
  requestFn: (credential: XiaoyuzhouCredential | null) => Promise<T>,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<T>> {
  const auth = getCredential(credential);

  try {
    const data = await requestFn(auth);
    return { code: 0, data };
  } catch (error) {
    const axiosError = error as AxiosError<any>;

    console.log("[xiaoyuzhou] Request failed:", {
      status: axiosError?.response?.status,
      hasRefreshToken: !!auth?.refreshToken,
    });

    // If 401, try to refresh token and retry
    if (axiosError?.response?.status === 401 && auth?.refreshToken) {
      console.log("[xiaoyuzhou] Got 401, attempting token refresh...");
      const newCredential = await refreshToken();

      if (newCredential) {
        console.log("[xiaoyuzhou] Token refreshed, retrying request...");
        // Retry with new credential
        try {
          const data = await requestFn(newCredential);
          console.log("[xiaoyuzhou] Retry request successful");
          return { code: 0, data };
        } catch (retryError) {
          console.error("[xiaoyuzhou] Retry request failed:", retryError);
          const normalized = normalizeError(retryError, false);
          return {
            code: normalized.code,
            message: normalized.message,
            data: null as T,
          };
        }
      } else {
        // Refresh failed, clear credential
        console.error("[xiaoyuzhou] Token refresh failed, clearing credential");
        setGlobalCredential(null);
      }
    }

    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null as T,
    };
  }
}

export async function sendSmsCode(
  phoneNumber: string,
  areaCode: string = "+86",
  verifyParam?: string,
): Promise<XiaoyuzhouApiResult<boolean>> {
  try {
    const payload: Record<string, any> = {
      areaCode,
      mobilePhoneNumber: phoneNumber,
      captcha: {
        scene: "web",
        verifyParam: verifyParam || "",
      },
    };

    const headers = {
      ...getCreatorHeaders(),
      origin: "https://accounts.xiaoyuzhoufm.com",
      referer: "https://accounts.xiaoyuzhoufm.com/",
    };

    try {
      await xiaoyuzhouHttp.post(
        "https://web-api.xiaoyuzhoufm.com/v1/auth/send-code",
        payload,
        { headers, timeout: 15000 },
      );
    } catch (e: any) {
      if (e.response?.status === 404 || !e.response) {
        await xiaoyuzhouHttp.post(
          `${CREATOR_BASE_URL}/v1/auth/send-code`,
          payload,
          { headers, timeout: 15000 },
        );
      } else {
        throw e;
      }
    }

    return { code: 0, data: true };
  } catch (error) {
    const normalized = normalizeError(error, false);
    return { code: normalized.code, message: normalized.message, data: false };
  }
}

export async function loginWithSms(
  phoneNumber: string,
  verifyCode: string,
  areaCode: string = "+86",
): Promise<
  XiaoyuzhouApiResult<{
    credential: XiaoyuzhouCredential;
    userInfo: XiaoyuzhouUserInfo;
  } | null>
> {
  try {
    const payload = {
      areaCode,
      mobilePhoneNumber: phoneNumber,
      verifyCode,
    };
    const headers = {
      ...getCreatorHeaders(),
      origin: "https://accounts.xiaoyuzhoufm.com",
      referer: "https://accounts.xiaoyuzhoufm.com/",
    };

    let response;
    try {
      response = await xiaoyuzhouHttp.post(
        "https://web-api.xiaoyuzhoufm.com/v1/auth/login-with-sms",
        payload,
        { headers, timeout: 15000 },
      );
    } catch (e: any) {
      if (e.response?.status === 404 || !e.response) {
        response = await xiaoyuzhouHttp.post(
          `${CREATOR_BASE_URL}/v1/auth/login-with-sms`,
          payload,
          { headers, timeout: 15000 },
        );
      } else {
        throw e;
      }
    }

    const auth = extractXiaoyuzhouAuth(
      response.headers as Record<string, string | string[] | undefined>,
    );

    if (!auth.accessToken || !auth.refreshToken) {
      return {
        code: -1,
        message: "登录成功但未返回 token",
        data: null,
      };
    }

    // The login endpoint returns a short-lived access token in practice.
    // Immediately exchange it for a stable app token via refresh.
    const refreshedCredential = (await doRefreshToken(auth)) ?? auth;

    const userRaw =
      response.data?.data?.user ||
      response.data?.user ||
      response.data?.data ||
      response.data;

    let userInfo = normalizeUserInfo(userRaw);
    if (!userInfo?.uid) {
      try {
        const profileRes = await getMyProfile(refreshedCredential);
        if (profileRes.code === 0 && profileRes.data) {
          userInfo = profileRes.data;
        }
      } catch {
        // ignore
      }
    }

    const result = {
      credential: refreshedCredential,
      userInfo,
    };

    setGlobalCredential(result.credential);

    return {
      code: 0,
      data: result,
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return { code: normalized.code, message: normalized.message, data: null };
  }
}

export async function getMyProfile(
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<XiaoyuzhouUserInfo | null>> {
  const deviceId = getDeviceId(
    credential?.refreshToken || credential?.accessToken,
  );
  return withAutoRefresh(async (auth) => {
    const response = await xiaoyuzhouHttp.get(
      `${APP_BASE_URL}/v1/profile/get`,
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth?.accessToken,
          refreshToken: auth?.refreshToken,
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );
    const user =
      response.data?.data?.user ||
      response.data?.user ||
      response.data?.data ||
      response.data;
    return normalizeUserInfo(user);
  }, credential);
}

export async function createLoginQrCode(): Promise<
  XiaoyuzhouApiResult<XiaoyuzhouQrCodeInfo | null>
> {
  try {
    const response = await xiaoyuzhouHttp.post(
      "https://web-api.xiaoyuzhoufm.com/v1/auth/qrcode/create",
      { clientId: "podcaster-platform" },
      {
        headers: {
          "content-type": "application/json",
          origin: "https://accounts.xiaoyuzhoufm.com",
          referer: "https://accounts.xiaoyuzhoufm.com/",
          "x-midway-app-id": "v6worU4NnWyL",
        },
        timeout: 15000,
      },
    );

    return {
      code: 0,
      data: {
        id: String(response.data?.id || ""),
        url: String(response.data?.url || ""),
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, false);
    return { code: normalized.code, message: normalized.message, data: null };
  }
}

// 缓存扫码成功后拿到的凭证，防止后续请求或竞态请求覆盖成功状态
const qrSuccessCredentials = new Map<string, XiaoyuzhouCredential>();

export async function checkLoginQrCodeStatus(
  id: string,
): Promise<XiaoyuzhouApiResult<XiaoyuzhouQrCodeStatusResult>> {
  // 如果当前 qrId 已经确认成功，直接返回成功状态
  if (qrSuccessCredentials.has(id)) {
    const cred = qrSuccessCredentials.get(id)!;
    return {
      code: 0,
      data: {
        status: "CONFIRMED",
        credential: cred,
        userInfo: { uid: "", nickname: "小宇宙用户" },
      },
    };
  }

  try {
    const response = await xiaoyuzhouHttp.post(
      "https://web-api.xiaoyuzhoufm.com/v1/auth/qrcode/login",
      { id },
      {
        headers: {
          "content-type": "application/json",
          origin: "https://accounts.xiaoyuzhoufm.com",
          referer: "https://accounts.xiaoyuzhoufm.com/",
        },
        timeout: 15000,
      },
    );

    const status = response.data?.status;

    // 尝试从多种途径提取 Token：headers、Set-Cookie、response.data
    let accessToken = "";
    let refreshToken = "";

    const headers = (response.headers || {}) as Record<string, any>;

    // 1. 从标准响应头提取
    for (const [k, v] of Object.entries(headers)) {
      const lk = k.toLowerCase();
      const valStr = Array.isArray(v) ? v[0] : String(v || "");
      if (lk === "x-jike-access-token" && !accessToken) accessToken = valStr;
      if (lk === "x-jike-refresh-token" && !refreshToken) refreshToken = valStr;
    }

    // 2. 从 Set-Cookie 提取
    const setCookie = headers["set-cookie"] || headers["Set-Cookie"];
    if (setCookie) {
      const list = Array.isArray(setCookie) ? setCookie : [setCookie];
      for (const item of list) {
        const str = String(item);
        const matchAcc = str.match(/(?:x-jike-access-token|accessToken)=([^;]+)/i);
        const matchRef = str.match(/(?:x-jike-refresh-token|refreshToken)=([^;]+)/i);
        if (matchAcc && !accessToken) accessToken = decodeURIComponent(matchAcc[1].trim());
        if (matchRef && !refreshToken) refreshToken = decodeURIComponent(matchRef[1].trim());
      }
    }

    // 3. 从 response.data 提取
    const resData = response.data;
    if (resData && typeof resData === "object") {
      if (!accessToken) {
        accessToken = resData.accessToken || resData.data?.accessToken || resData.token || "";
      }
      if (!refreshToken) {
        refreshToken = resData.refreshToken || resData.data?.refreshToken || "";
      }
    }

    // 小宇宙官方前端定义：CONFIRMED 和 USED 均代表扫码确认登录成功！
    if (status === "CONFIRMED" || status === "USED") {
      if (accessToken && refreshToken) {
        const auth = { accessToken, refreshToken };
        const refreshedCredential = (await doRefreshToken(auth)) ?? auth;
        setGlobalCredential(refreshedCredential);
        qrSuccessCredentials.set(id, refreshedCredential);

        let userInfo: XiaoyuzhouUserInfo | null = null;
        try {
          const profileRes = await getMyProfile(refreshedCredential);
          if (profileRes.code === 0 && profileRes.data) {
            userInfo = profileRes.data;
          }
        } catch (e) {
          console.warn("[xiaoyuzhou] Failed to fetch profile after QR login", e);
        }

        return {
          code: 0,
          data: {
            status: "CONFIRMED",
            credential: refreshedCredential,
            userInfo: userInfo || { uid: "", nickname: "小宇宙用户" },
          },
        };
      }

      // 如果状态是 CONFIRMED/USED 但单次请求未收到 Token，可能是已在上一秒消费或等待服务端落库
      // 如果全局已经有有效凭证，直接使用
      const currentGlobal = getGlobalCredential();
      if (currentGlobal?.accessToken && currentGlobal?.refreshToken) {
        return {
          code: 0,
          data: {
            status: "CONFIRMED",
            credential: currentGlobal,
            userInfo: { uid: "", nickname: "小宇宙用户" },
          },
        };
      }
    }

    if (status === "SCANNED") {
      return {
        code: 0,
        data: { status: "SCANNED" },
      };
    }

    return {
      code: 0,
      data: { status: "WAITTING" },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errData = error.response?.data;
      // 官方规则：只有 HTTP 401 且 code === 21 时才代表二维码真正失效
      if (error.response?.status === 401 && errData?.code === 21) {
        return {
          code: 0,
          data: { status: "EXPIRED" },
        };
      }
    }
    const normalized = normalizeError(error, false);
    return {
      code: normalized.code,
      message: normalized.message,
      data: { status: "WAITTING" },
    };
  }
}

export async function getDiscoveryFeed(
  loadMoreKey?: string,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  const deviceId = getDeviceId(credential?.refreshToken || credential?.accessToken);
  return withAutoRefresh(async (auth) => {
    const response = await xiaoyuzhouHttp.post(
      `${APP_BASE_URL}/v1/discovery-feed/list`,
      {
        returnAll: "false",
        ...(loadMoreKey ? { loadMoreKey } : {}),
      },
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth?.accessToken,
          refreshToken: auth?.refreshToken,
          contentType: "application/json",
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );
    return response.data;
  }, credential);
}

export async function getInboxList(
  loadMoreKey?: { pubDate: string; id: string } | null,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  const deviceId = getDeviceId(
    credential?.refreshToken || credential?.accessToken,
  );
  return withAutoRefresh(async (auth) => {
    const response = await xiaoyuzhouHttp.post(
      `${APP_BASE_URL}/v1/inbox/list`,
      {
        limit: "20",
        ...(loadMoreKey ? { loadMoreKey } : {}),
      },
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth?.accessToken,
          refreshToken: auth?.refreshToken,
          contentType: "application/json",
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );
    return response.data;
  }, credential);
}

export async function getPilotDiscoveryList(
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  const deviceId = getDeviceId(
    credential?.refreshToken || credential?.accessToken,
  );
  return withAutoRefresh(async (auth) => {
    const response = await xiaoyuzhouHttp.post(
      `${APP_BASE_URL}/v1/pilot-discovery/list`,
      {},
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth?.accessToken,
          refreshToken: auth?.refreshToken,
          contentType: "application/json",
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );
    return response.data;
  }, credential);
}

export async function getTopList(
  category: "HOT" | "ROCK" | "NEW" = "HOT",
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  const categoryMap: Record<string, string> = {
    HOT: "HOT_EPISODES_IN_24_HOURS",
    ROCK: "SKYROCKET_EPISODES",
    NEW: "NEW_STAR_EPISODES",
  };

  const deviceId = getDeviceId(credential?.refreshToken || credential?.accessToken);
  return withAutoRefresh(async (auth) => {
    const response = await xiaoyuzhouHttp.get(
      `${APP_BASE_URL}/v1/top-list/get?category=${categoryMap[category]}`,
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth?.accessToken,
          refreshToken: auth?.refreshToken,
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );
    return response.data;
  }, credential);
}

export async function searchPodcasts(
  keyword: string,
  loadMoreKey?: unknown,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  const deviceId = getDeviceId(credential?.refreshToken || credential?.accessToken);
  return withAutoRefresh(async (auth) => {
    const response = await xiaoyuzhouHttp.post(
      `${APP_BASE_URL}/v1/search/create`,
      {
        keyword,
        type: "PODCAST",
        ...(loadMoreKey ? { loadMoreKey } : {}),
      },
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth?.accessToken,
          refreshToken: auth?.refreshToken,
          contentType: "application/json",
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );
    return response.data;
  }, credential);
}

export async function getPodcastDetail(
  pid: string,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  const deviceId = getDeviceId(credential?.refreshToken || credential?.accessToken);
  return withAutoRefresh(async (auth) => {
    const response = await xiaoyuzhouHttp.get(
      `${APP_BASE_URL}/v1/podcast/get?pid=${pid}`,
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth?.accessToken,
          refreshToken: auth?.refreshToken,
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );
    return response.data;
  }, credential);
}

export async function getEpisodeList(
  pid: string,
  order: "asc" | "desc" = "desc",
  loadMoreKey?: unknown,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  const deviceId = getDeviceId(credential?.refreshToken || credential?.accessToken);
  return withAutoRefresh(async (auth) => {
    const response = await xiaoyuzhouHttp.post(
      `${APP_BASE_URL}/v1/episode/list`,
      {
        pid,
        order,
        limit: 20,
        ...(loadMoreKey ? { loadMoreKey } : {}),
      },
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth?.accessToken,
          refreshToken: auth?.refreshToken,
          contentType: "application/json",
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );
    return response.data;
  }, credential);
}

export async function getEpisodeDetail(
  eid: string,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  const deviceId = getDeviceId(credential?.refreshToken || credential?.accessToken);
  return withAutoRefresh(async (auth) => {
    const response = await xiaoyuzhouHttp.get(
      `${APP_BASE_URL}/v1/episode/get?eid=${eid}`,
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth?.accessToken,
          refreshToken: auth?.refreshToken,
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );
    return response.data;
  }, credential);
}

export async function getEpisodeTranscript(
  eid: string,
  mediaId: string,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  const deviceId = getDeviceId(credential?.refreshToken || credential?.accessToken);
  return withAutoRefresh(async (auth) => {
    const response = await xiaoyuzhouHttp.post(
      `${APP_BASE_URL}/v1/episode-transcript/get`,
      {
        eid,
        mediaId,
      },
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth?.accessToken,
          refreshToken: auth?.refreshToken,
          contentType: "application/json",
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );

    if (response.data?.data?.transcriptUrl) {
      try {
        const cdnRes = await axios.get(response.data.data.transcriptUrl, {
          headers: { 'User-Agent': 'Xiaoyuzhou/2.99.1(android 28)' }
        });
        return { code: 0, data: { transcripts: cdnRes.data } };
      } catch (e) {
        console.error("Failed to fetch transcript from CDN", e);
      }
    }

    return response.data;
  }, credential);
}

export async function getSubscriptions(
  loadMoreKey?: { subscribedAt: string; id: string } | null,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  const deviceId = getDeviceId(credential?.refreshToken || credential?.accessToken);
  return withAutoRefresh(async (auth) => {
    const response = await xiaoyuzhouHttp.post(
      `${APP_BASE_URL}/v1/subscription/list`,
      {
        limit: "20",
        sortOrder: "desc",
        sortBy: "subscribedAt",
        ...(loadMoreKey ? { loadMoreKey } : {}),
      },
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth?.accessToken,
          refreshToken: auth?.refreshToken,
          contentType: "application/json",
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );
    return response.data;
  }, credential);
}

export async function updateSubscription(
  pid: string,
  mode: "ON" | "OFF",
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  const deviceId = getDeviceId(
    credential?.refreshToken || credential?.accessToken,
  );
  return withAutoRefresh(async (auth) => {
    const response = await xiaoyuzhouHttp.post(
      `${APP_BASE_URL}/v1/subscription/update`,
      {
        pid,
        mode,
      },
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth?.accessToken,
          refreshToken: auth?.refreshToken,
          contentType: "application/json",
          localTime: getNowIsoString(),
          deviceId,
        }),
        timeout: 15000,
      },
    );
    return response.data;
  }, credential);
}
