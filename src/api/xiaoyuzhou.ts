import axios, { AxiosError } from "axios";
import {
  buildXiaoyuzhouHeaders,
  extractXiaoyuzhouAuth,
} from "./xiaoyuzhouShared";

const CREATOR_BASE_URL = "https://podcaster-api.xiaoyuzhoufm.com";
const APP_BASE_URL = "https://api.xiaoyuzhoufm.com";

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

export function setGlobalCredential(credential: XiaoyuzhouCredential | null) {
  globalCredential = credential;
}

function getCredential(credential?: XiaoyuzhouCredential | null) {
  return credential ?? globalCredential;
}

function getNowIsoString() {
  return new Date().toISOString();
}

function getCreatorHeaders() {
  return {
    accept: "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    "content-type": "application/json;charset=UTF-8",
    "x-app-build-time": "2026-04-08 10:43:10 +0800",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    Origin: "https://podcaster.xiaoyuzhoufm.com",
    Referer: "https://podcaster.xiaoyuzhoufm.com/login",
  };
}

function normalizeError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const message =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.msg ||
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

function ensureCredential(
  credential?: XiaoyuzhouCredential | null,
): XiaoyuzhouCredential {
  const activeCredential = getCredential(credential);
  if (!activeCredential?.accessToken || !activeCredential?.refreshToken) {
    throw new Error("小宇宙未登录，请先登录后再试");
  }
  return activeCredential;
}

export async function sendSmsCode(
  phoneNumber: string,
  areaCode: string = "+86",
): Promise<XiaoyuzhouApiResult<boolean>> {
  try {
    await axios.post(
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
    const response = await axios.post(
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

    const result = {
      credential: auth,
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
  try {
    const auth = ensureCredential(credential);
    const response = await axios.post(
      `${APP_BASE_URL}/v1/discovery-feed/list`,
      {
        returnAll: "false",
        ...(loadMoreKey ? { loadMoreKey } : {}),
      },
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          contentType: "application/json",
          localTime: getNowIsoString(),
        }),
        timeout: 15000,
      },
    );

    return { code: 0, data: response.data };
  } catch (error) {
    const normalized = normalizeError(error);
    return { code: normalized.code, message: normalized.message, data: null };
  }
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

  try {
    const auth = ensureCredential(credential);
    const response = await axios.get(
      `${APP_BASE_URL}/v1/top-list/get?category=${categoryMap[category]}`,
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          localTime: getNowIsoString(),
        }),
        timeout: 15000,
      },
    );

    return { code: 0, data: response.data };
  } catch (error) {
    const normalized = normalizeError(error);
    return { code: normalized.code, message: normalized.message, data: null };
  }
}

export async function searchPodcasts(
  keyword: string,
  loadMoreKey?: unknown,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const response = await axios.post(
      `${APP_BASE_URL}/v1/search/create`,
      {
        keyword,
        type: "PODCAST",
        ...(loadMoreKey ? { loadMoreKey } : {}),
      },
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          contentType: "application/json",
          localTime: getNowIsoString(),
        }),
        timeout: 15000,
      },
    );

    return { code: 0, data: response.data };
  } catch (error) {
    const normalized = normalizeError(error);
    return { code: normalized.code, message: normalized.message, data: null };
  }
}

export async function getPodcastDetail(
  pid: string,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const response = await axios.get(`${APP_BASE_URL}/v1/podcast/get?pid=${pid}`, {
      headers: buildXiaoyuzhouHeaders({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        localTime: getNowIsoString(),
      }),
      timeout: 15000,
    });

    return { code: 0, data: response.data };
  } catch (error) {
    const normalized = normalizeError(error);
    return { code: normalized.code, message: normalized.message, data: null };
  }
}

export async function getEpisodeList(
  pid: string,
  order: "asc" | "desc" = "desc",
  loadMoreKey?: unknown,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const response = await axios.post(
      `${APP_BASE_URL}/v1/episode/list`,
      {
        pid,
        order,
        ...(loadMoreKey ? { loadMoreKey } : {}),
      },
      {
        headers: buildXiaoyuzhouHeaders({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          contentType: "application/json",
          localTime: getNowIsoString(),
        }),
        timeout: 15000,
      },
    );

    return { code: 0, data: response.data };
  } catch (error) {
    const normalized = normalizeError(error);
    return { code: normalized.code, message: normalized.message, data: null };
  }
}

export async function getEpisodeDetail(
  eid: string,
  credential?: XiaoyuzhouCredential | null,
): Promise<XiaoyuzhouApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const response = await axios.get(`${APP_BASE_URL}/v1/episode/get?eid=${eid}`, {
      headers: buildXiaoyuzhouHeaders({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        localTime: getNowIsoString(),
      }),
      timeout: 15000,
    });

    return { code: 0, data: response.data };
  } catch (error) {
    const normalized = normalizeError(error);
    return { code: normalized.code, message: normalized.message, data: null };
  }
}
