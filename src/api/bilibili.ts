/*
 * @Description: Bilibili API 调用
 */
import axios from "axios";
import { getOrSetCookie, buildCommonHeaders } from "../utils/apiUtils";
import { getConfigByKey } from "../core/config";
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
 * 生成登录二维码
 * https://passport.bilibili.com/x/passport-login/web/qrcode/generate
 */
export const generateQRCode = async () => {
  try {
    console.log("[generateQRCode] 开始请求二维码");
    const res = await axios.get(
      "https://passport.bilibili.com/x/passport-login/web/qrcode/generate",
      {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://www.bilibili.com",
        },
      }
    );
    console.log("[generateQRCode] 请求成功:", res.data);
    return {
      data: {
        code: res.data.code,
        message: res.data.message,
        data: res.data.data,
      },
    };
  } catch (error: any) {
    console.error("[generateQRCode] Error:", error.message);
    return {
      data: {
        code: -1,
        message: error.message || "获取二维码失败",
        data: null,
      },
    };
  }
};

/**
 * 轮询二维码登录状态
 * https://passport.bilibili.com/x/passport-login/web/qrcode/poll
 */
export const pollQRCode = async (qrcode_key: string) => {
  try {
    const res = await axios.get(
      "https://passport.bilibili.com/x/passport-login/web/qrcode/poll",
      {
        params: { qrcode_key },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://www.bilibili.com",
        },
      }
    );

    const responseData = res.data;
    const code = responseData.data?.code;

    // 登录成功，提取完整cookie
    if (code === 0) {
      const setCookies = res.headers["set-cookie"];
      let fullCookie = "";

      if (setCookies && Array.isArray(setCookies)) {
        // 提取所有必要的cookie字段
        const cookieFields = [
          "SESSDATA",
          "bili_jct",
          "DedeUserID",
          "DedeUserID__ckMd5",
          "sid",
          "buvid3",
          "buvid4",
          "b_nut",
        ];
        const extractedCookies: string[] = [];

        for (const cookieStr of setCookies) {
          for (const field of cookieFields) {
            const match = cookieStr.match(new RegExp(`${field}=([^;]+)`));
            if (match && !extractedCookies.some((c) => c.startsWith(`${field}=`))) {
              extractedCookies.push(`${field}=${match[1]}`);
            }
          }
        }
        fullCookie = extractedCookies.join("; ");
      }

      return {
        data: {
          code: 0,
          message: "登录成功",
          data: {
            status: "success",
            cookie: fullCookie,
          },
        },
      };
    }

    // 二维码已扫码但未确认
    if (code === 86090) {
      return {
        data: {
          code: 0,
          message: "已扫码",
          data: {
            status: "scanning",
          },
        },
      };
    }

    // 二维码已过期
    if (code === 86038) {
      return {
        data: {
          code: 0,
          message: "二维码已过期",
          data: {
            status: "timeout",
          },
        },
      };
    }

    // 其他状态
    return {
      data: {
        code: 0,
        message: responseData.message,
        data: {
          status: "pending",
        },
      },
    };
  } catch (error: any) {
    showError(`轮询登录状态失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: {
          status: "failed",
        },
      },
    };
  }
};

/**
 * 获取用户信息
 * https://api.bilibili.com/x/web-interface/nav
 */
export const getLoginUserInfo = async (cookie: string) => {
  try {
    const res = await axios.get("https://api.bilibili.com/x/web-interface/nav", {
      headers: buildCommonHeaders(cookie, {
        Referer: "https://www.bilibili.com/",
        Origin: "https://www.bilibili.com",
      }),
    });

    if (res.data.code === 0) {
      const { face, uname, mid, level_info } = res.data.data;
      return {
        code: 0,
        data: {
          mid,
          uname,
          face,
          level: level_info?.current_level,
        },
      };
    }

    return {
      code: res.data.code,
      message: res.data.message,
      data: null,
    };
  } catch (error: any) {
    return {
      code: -1,
      message: error.message,
      data: null,
    };
  }
};

/**
 * 获取热门视频列表
 * https://api.bilibili.com/x/web-interface/popular
 */
export const getPopular = async (pn: number = 1) => {
  try {
    return await axios.get(
      `https://api.bilibili.com/x/web-interface/popular`,
      {
        params: { pn, ps: 20 },
        headers: await getBilibiliHeaders(),
      },
    );
  } catch (error: any) {
    showError(`获取B站热门失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: { list: [], no_more: false },
      },
    };
  }
};

/**
 * 获取直播列表
 * https://api.live.bilibili.com/room/v3/area/getRoomList
 */
export const getLiveList = async (page: number = 1) => {
  try {
    return await axios.get(
      `https://api.live.bilibili.com/room/v3/area/getRoomList`,
      {
        params: {
          page,
          page_size: 20,
          sort_type: "online",
        },
        headers: await getBilibiliHeaders(),
      },
    );
  } catch (error: any) {
    showError(`获取B站直播失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: { list: [], has_more: false },
      },
    };
  }
};

/**
 * 获取关注的直播列表
 * https://api.live.bilibili.com/xlive/web-ucenter/v1/xfetter/FeedList
 */
export const getFollowedLiveList = async (
  page: number = 1,
  pageSize: number = 50,
) => {
  try {
    const cookie = getConfigByKey("bilibiliCookie");
    if (!cookie) {
      return {
        data: {
          code: -101,
          message: "Cookie not configured",
          data: { list: [] },
        },
      };
    }

    return await axios.get(
      `https://api.live.bilibili.com/xlive/web-ucenter/v1/xfetter/FeedList`,
      {
        params: {
          page,
          page_size: pageSize,
          platform: "web",
        },
        headers: buildCommonHeaders(cookie, {
          Referer: "https://live.bilibili.com/",
          Origin: "https://live.bilibili.com",
        }),
      },
    );
  } catch (error: any) {
    return {
      data: {
        code: -1,
        message: error.message,
        data: { list: [] },
      },
    };
  }
};

/**
 * 获取直播间真实流地址 (HLS/m3u8格式)
 * https://api.live.bilibili.com/room/v1/Room/playUrl
 */
export const getLivePlayUrl = async (roomId: number, qn: number = 10000) => {
  try {
    const playInfoRes = await axios.get(
      `https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo`,
      {
        params: {
          room_id: roomId,
          protocol: "0,1",
          format: "0,1,2",
          codec: "0",
          qn,
          platform: "android",
        },
        headers: await getBilibiliHeaders({
          Referer: "https://live.bilibili.com/",
          Origin: "https://live.bilibili.com",
        }),
      },
    );

    const playurl = playInfoRes.data?.data?.playurl_info?.playurl;
    const streams: any[] = playurl?.stream ?? [];

    const resolveStreamUrl = (protocolName: string, preferredFormat?: string) => {
      const stream = streams.find((item) => item.protocol_name === protocolName);
      if (!stream) return "";

      const format =
        stream.format?.find((item: any) => item.format_name === preferredFormat) ??
        stream.format?.[0];
      const codec =
        format?.codec?.find((item: any) => item.codec_name === "avc") ??
        format?.codec?.[0];
      const urlInfo = codec?.url_info?.[0];

      if (!codec?.base_url || !urlInfo?.host) {
        return "";
      }

      return `${urlInfo.host}${codec.base_url}${urlInfo.extra ?? ""}`;
    };

    const streamUrl =
      resolveStreamUrl("http_hls", "fmp4") ||
      resolveStreamUrl("http_hls") ||
      resolveStreamUrl("http_stream");

    if (!streamUrl) {
      throw new Error(playInfoRes.data?.message || "未找到可用直播流");
    }

    return {
      data: {
        code: 0,
        message: "success",
        ttl: 1,
        data: {
          from: "live",
          result: "success",
          quality: qn,
          format: streamUrl.includes(".m3u8") ? "hls" : "flv",
          timelength: 0,
          durl: [
            {
              order: 1,
              length: 0,
              size: 0,
              url: streamUrl,
              backup_url: null,
            },
          ],
          support_formats: [],
        },
      },
    };

  } catch (error: any) {
    showError(`获取直播流地址失败: ${error.message}`);
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
 * 获取推荐视频列表
 * https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd
 */
export const getRecommend = async () => {
  try {
    return await axios.get(
      `https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd?web_location=1430650&y_num=5&fresh_type=3&feed_version=V8&homepage_ver=1&ps=10&last_y_num=5&screen=2010-595`,
      {
        headers: await getBilibiliHeaders(),
      },
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
  pageSize: number = 20,
) => {
  try {
    return await axios.get(
      `https://api.bilibili.com/x/v2/history/toview/web?pn=${page}&ps=${pageSize}`,
      {
        headers: await getBilibiliHeaders(),
      },
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
      },
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
  pageSize: number = 20,
) => {
  try {
    return await axios.get(
      `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=${page}&ps=${pageSize}`,
      {
        headers: await getBilibiliHeaders(),
      },
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
      },
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
      },
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
      },
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

/**
 * 获取用户上传的视频列表
 * https://api.bilibili.com/x/series/recArchivesByKeywords?mid=xxx&keywords&pn=1
 */
export const getUserVideos = async (mid: number, page: number = 1) => {
  try {
    const response = await axios.get(
      `https://api.bilibili.com/x/series/recArchivesByKeywords`,
      {
        params: {
          mid,
          keywords: "",
          pn: page,
        },
        headers: await getBilibiliHeaders(),
      },
    );
    return response;
  } catch (error: any) {
    showError(`获取用户视频失败: ${error.message}`);
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
 * 获取用户卡片信息
 * https://api.bilibili.com/x/web-interface/card?mid=xxx
 */
export const getUserCard = async (mid: number) => {
  try {
    const response = await axios.get(
      `https://api.bilibili.com/x/web-interface/card`,
      {
        params: { mid },
        headers: await getBilibiliHeaders(),
      },
    );
    return response;
  } catch (error: any) {
    showError(`获取用户信息失败: ${error.message}`);
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
 * 关注/取消关注用户
 * https://api.bilibili.com/x/relation/modify
 * act: 1=关注, 2=取消关注
 */
export const modifyRelation = async (fid: number, act: 1 | 2) => {
  try {
    const cookie = (await getOrSetBilibiliCookie()) as string;
    const csrf = cookie.match(/bili_jct=([^;]+)/)?.[1] || "";
    if (!csrf) {
      return {
        data: {
          code: -1,
          message: "无法获取CSRF Token",
        },
      };
    }
    const response = await axios.post(
      "https://api.bilibili.com/x/relation/modify",
      `fid=${fid}&act=${act}&csrf=${csrf}`,
      {
        headers: {
          ...(await getBilibiliHeaders()),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    return response;
  } catch (error: any) {
    showError(`${act === 1 ? "关注" : "取消关注"}失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
      },
    };
  }
};
