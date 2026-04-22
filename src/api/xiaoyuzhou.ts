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
    const message =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.msg ||
      axiosError.response?.data?.error ||
      `接口报错 ${axiosError.response?.status}: ${JSON.stringify(axiosError.response?.data)}` ||
      axiosError.message;
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

function normalizeUserInfo(user: any): XiaoyuzhouUserInfo {
  return {
    uid: String(user?.uid ?? ""),
    nickname: String(user?.nickname ?? ""),
    avatar: user?.avatar?.picture?.smallPicUrl || user?.avatar?.picture?.picUrl,
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
): Promise<XiaoyuzhouApiResult<boolean>> {
  try {
    await xiaoyuzhouHttp.post(
      `${CREATOR_BASE_URL}/v1/auth/send-code`,
      {
        areaCode,
        mobilePhoneNumber: phoneNumber,
      },
      { headers: getCreatorHeaders(), timeout: 15000 },
    );

    return { code: 0, data: true };
  } catch (error) {
    const normalized = normalizeError(error);
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
    const response = await xiaoyuzhouHttp.post(
      `${CREATOR_BASE_URL}/v1/auth/login-with-sms`,
      {
        areaCode,
        mobilePhoneNumber: phoneNumber,
        verifyCode,
      },
      { headers: getCreatorHeaders(), timeout: 15000 },
    );

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
    const result = {
      credential: refreshedCredential,
      userInfo: normalizeUserInfo(response.data?.data?.user),
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
