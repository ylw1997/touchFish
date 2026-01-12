/*
 * @Description: Bilibili API 调用
 */
import axios from "axios";
import { getOrSetCookie, buildCommonHeaders } from "../utils/apiUtils";
import { showError } from "../utils/errorMessage";

axios.defaults.timeout = 10000;

export const getOrSetBilibiliCookie = async () => {
  return await getOrSetCookie("bilibiliCookie", "请输入B站的cookie");
};

const getBilibiliHeaders = async (extraHeaders = {}) => {
  const cookie = (await getOrSetBilibiliCookie()) as string;
  return buildCommonHeaders(cookie, {
    Referer: "https://www.bilibili.com/",
    Origin: "https://www.bilibili.com",
    ...extraHeaders,
  });
};

/**
 * 获取推荐视频列表
 * https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd
 */
export const getRecommend = async () => {
  try {
    return await axios.get(
      `https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd`,
      {
        headers: await getBilibiliHeaders(),
      }
    );
  } catch (error: any) {
    showError(`获取B站推荐失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: { item: [] },
      },
    };
  }
};

/**
 * 获取动态列表
 * https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/all?type=video&page=1
 */
export const getDynamic = async (page: number = 1, offset?: string) => {
  try {
    let url = `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/all?type=video&platform=web&page=${page}`;
    if (offset) {
      url += `&timezone_offset=-480&offset=${offset}`;
    }
    return await axios.get(url, {
      headers: await getBilibiliHeaders(),
    });
  } catch (error: any) {
    showError(`获取B站动态失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: { items: [], has_more: false },
      },
    };
  }
};

/**
 * 获取待看列表
 * https://api.bilibili.com/x/v2/history/toview/web?pn=1&ps=20
 */
export const getWatchLater = async (
  page: number = 1,
  pageSize: number = 20
) => {
  try {
    return await axios.get(
      `https://api.bilibili.com/x/v2/history/toview/web?pn=${page}&ps=${pageSize}`,
      {
        headers: await getBilibiliHeaders(),
      }
    );
  } catch (error: any) {
    showError(`获取B站待看失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: { count: 0, list: [] },
      },
    };
  }
};

/**
 * 从 cookie 中解析用户 ID (DedeUserID)
 */
const getUserIdFromCookie = (cookie: string): string | null => {
  const match = cookie.match(/DedeUserID=(\d+)/);
  return match ? match[1] : null;
};

/**
 * 获取收藏夹列表
 * https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=xxx
 */
export const getFavoriteFolders = async () => {
  try {
    const cookie = (await getOrSetBilibiliCookie()) as string;
    const userId = getUserIdFromCookie(cookie);
    if (!userId) {
      showError("无法从 Cookie 中获取用户 ID，请确保 Cookie 包含 DedeUserID");
      return {
        data: {
          code: -1,
          message: "无法获取用户 ID",
          data: { count: 0, list: [] },
        },
      };
    }
    return await axios.get(
      `https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${userId}`,
      {
        headers: await getBilibiliHeaders(),
      }
    );
  } catch (error: any) {
    showError(`获取B站收藏夹失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: { count: 0, list: [] },
      },
    };
  }
};

/**
 * 获取收藏夹详情（视频列表）
 * https://api.bilibili.com/x/v3/fav/resource/list?media_id=xxx&pn=1&ps=36
 */
export const getFavoriteDetail = async (
  mediaId: number,
  page: number = 1,
  pageSize: number = 20
) => {
  try {
    return await axios.get(
      `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=${page}&ps=${pageSize}`,
      {
        headers: await getBilibiliHeaders(),
      }
    );
  } catch (error: any) {
    showError(`获取B站收藏夹详情失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: { medias: [], has_more: false },
      },
    };
  }
};
