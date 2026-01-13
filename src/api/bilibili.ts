/*
 * @Description: Bilibili API 调用
 */
import axios from "axios";
import { getOrSetCookie, buildCommonHeaders } from "../utils/apiUtils";
import { showError } from "../utils/errorMessage";
// import * as cheerio from "cheerio";

axios.defaults.timeout = 10000;

export const getOrSetBilibiliCookie = async () => {
  return await getOrSetCookie("bilibiliCookie", "请输入B站的cookie");
};

export const getBilibiliHeaders = async (extraHeaders = {}) => {
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

/**
 * 从 cookie 中解析 CSRF Token (bili_jct)
 */
const getCsrfFromCookie = (cookie: string): string | null => {
  const match = cookie.match(/bili_jct=([^;]+)/);
  return match ? match[1] : null;
};

/**
 * 加入待看
 * https://api.bilibili.com/x/v2/history/toview/add
 */
export const addToWatchLater = async (bvid: string) => {
  try {
    const cookie = (await getOrSetBilibiliCookie()) as string;
    const csrf = getCsrfFromCookie(cookie);
    if (!csrf) {
      showError("无法从 Cookie 中获取 CSRF Token，请确保 Cookie 包含 bili_jct");
      return {
        data: {
          code: -1,
          message: "无法获取 CSRF Token",
        },
      };
    }
    return await axios.post(
      "https://api.bilibili.com/x/v2/history/toview/add",
      `bvid=${bvid}&csrf=${csrf}`,
      {
        headers: {
          ...(await getBilibiliHeaders()),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  } catch (error: any) {
    showError(`加入待看失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
      },
    };
  }
};

/**
 * 获取视频播放链接
 * https://api.bilibili.com/x/player/wbi/playurl
 */
export const getPlayUrl = async (bvid: string, cid: number) => {
  try {
    let finalCid = cid;
    // 如果没有cid，尝试获取
    if (!finalCid) {
      const infoRes = await getVideoInfo(bvid);
      if (infoRes.data?.code === 0 && infoRes.data?.data?.cid) {
        finalCid = infoRes.data.data.cid;
      } else {
        return {
          data: {
            code: -1,
            message: "无法获取视频CID",
            data: null,
          },
        };
      }
    }

    const url = `https://api.bilibili.com/x/player/wbi/playurl?bvid=${bvid}&cid=${finalCid}&qn=112&platform=html5&high_quality=1`;
    console.log("获取视频播放链接", url);
    return await axios.get(url, {
      headers: await getBilibiliHeaders(),
    });
  } catch (error: any) {
    showError(`获取视频播放链接失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: null,
      },
    };
  }
};

/**
 * 移除稍后再看
 * https://api.bilibili.com/x/v2/history/toview/del
 */
export const delWatchLater = async (avid: string, csrf: string) => {
  try {
    return await axios.post(
      "https://api.bilibili.com/x/v2/history/toview/del",
      `view_only=1&csrf=${csrf}&aid=${avid}`,
      {
        headers: {
          ...(await getBilibiliHeaders()),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  } catch (error: any) {
    showError(`移除待看失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
      },
    };
  }
};

/**
 * 获取视频详情（用于获取cid）
 * https://api.bilibili.com/x/web-interface/view
 */
export const getVideoInfo = async (bvid: string) => {
  try {
    const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    return await axios.get(url, {
      headers: await getBilibiliHeaders(),
    });
  } catch (error: any) {
    showError(`获取视频详情失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: null,
      },
    };
  }
};

/**
 * 获取视频弹幕 (Artplayer format)
 * https://api.bilibili.com/x/v1/dm/list.so
 */
export const getDanmaku = async (cid: number) => {
  try {
    const url = `https://api.bilibili.com/x/v1/dm/list.so?oid=${cid}`;
    const response = await axios.get(url, {
      headers: await getBilibiliHeaders(),
      responseType: "text", // XML is text
    });

    // 直接返回 XML 字符串
    return {
      data: {
        code: 0,
        // eslint-disable-next-line no-control-regex
        data: response.data.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, ""),
      },
    };
  } catch (error: any) {
    showError(`获取弹幕失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: "", // Return empty string on error
      },
    };
  }
};

/**
 * 搜索视频
 * https://api.bilibili.com/x/web-interface/wbi/search/all/v2?keyword=xxx
 */
export const searchAll = async (keyword: string, page: number = 1) => {
  try {
    const response = await axios.get(
      `https://api.bilibili.com/x/web-interface/wbi/search/all/v2`,
      {
        params: {
          keyword,
          page,
        },
        headers: await getBilibiliHeaders(),
      }
    );
    return response;
  } catch (error: any) {
    showError(`搜索失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: null,
      },
    };
  }
};
