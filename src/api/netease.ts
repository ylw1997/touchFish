import axios from "axios";
import * as https from "https";
import * as crypto from "crypto";
import { showError } from "../utils/errorMessage";
import { linuxEncrypt, weapiEncrypt } from "./neteaseCrypto";

// 针对网易云 CDN 采用较老 TLS 版本或异常证书，配置遗留安全重新协商的 HttpsAgent，防止 Node.js 段握手失败
const safeAgent = new https.Agent({
  rejectUnauthorized: false, // 避开证书校验问题
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT, // 开启遗留重新协商
});

// 全局 Cookie 凭证
let globalCookie: string = "";

export const setGlobalNeteaseCookie = (cookie: string) => {
  globalCookie = cookie || "";
};

export const getGlobalNeteaseCookie = () => globalCookie;

/**
 * 从 Cookie 中正则提取 csrf_token
 */
function getCsrfToken(cookie: string): string {
  const match = cookie.match(/__csrf=([^;]+)/);
  return match ? match[1] : "";
}

/**
 * 官方直连通用请求封装 (基于 LinuxAPI 转发，突破火山 DCDN 的 JA3 拦截)
 */
const request = async (options: {
  url: string; // 例如 '/cloudsearch/get/web'
  data?: any;
  noCheckCode?: boolean;
}) => {
  // 转发接口目标地址
  const targetUrl = "https://music.163.com/api/linux/forward";

  // 拼装底层网易云 api 地址
  const cleanUrl = options.url.startsWith("/api") ? options.url : `/api${options.url}`;
  const innerUrl = `https://music.163.com${cleanUrl}`;

  // 组装业务 payload 数据并自动注入 csrf_token
  const innerParams = { ...(options.data || {}) };
  if (globalCookie) {
    innerParams.csrf_token = getCsrfToken(globalCookie);
  }

  const payload = {
    method: "POST",
    url: innerUrl,
    params: innerParams,
  };

  // linuxapi 原生 AES 加密
  const encryptedHex = linuxEncrypt(payload);

  // 构造表单编码体
  const bodyData = `eparams=${encodeURIComponent(encryptedHex)}`;

  // 模拟官方 Linux 客户端 Headers
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Referer": "https://music.163.com",
    "Origin": "https://music.163.com",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36",
    "Cookie": globalCookie,
  };

  try {
    const response = await axios({
      url: targetUrl,
      method: "POST",
      data: bodyData,
      headers,
      timeout: 15000,
    });

    if (!options.noCheckCode && response.data && response.data.code !== 200 && response.data.code !== 0) {
      throw new Error(response.data.message || response.data.msg || "请求失败");
    }

    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.response?.data?.msg || error.message;
    showError(`网易云音乐请求失败: ${msg}`);
    throw error;
  }
};

// ==================== 登录 / 用户状态 API ====================

/**
 * 获取当前登录状态与用户信息
 * 官方直连版通过获取个人账号信息接口 /api/nuser/account/get 来判定有效性
 */
export const getLoginStatus = async (): Promise<any> => {
  if (!globalCookie) {
    return {
      code: 200,
      data: {
        code: 200,
        account: null,
        profile: null,
      },
    };
  }
  try {
    const result = await request({
      url: "/api/nuser/account/get",
      data: {},
    });
    // 官方返回的结构中含有 account 和 profile
    // 兼容原版 Provider 的结构，将其包装 in data 中
    return {
      code: 200,
      data: {
        code: 200,
        account: result.account,
        profile: result.profile,
      },
    };
  } catch (err) {
    console.log("[Netease] 获取登录状态失败(已静默捕获):", err);
    // 未登录或 Cookie 过期返回 null profile
    return {
      code: 200,
      data: {
        code: 200,
        account: null,
        profile: null,
      },
    };
  }
};

/**
 * 退出登录
 */
export const logout = async (): Promise<any> => {
  return { code: 200, success: true };
};

// ==================== 搜索 API ====================

export interface NeteaseSong {
  id: number;
  name: string;
  ar: Array<{ id: number; name: string }>;
  al: { id: number; name: string; picUrl: string };
  dt: number; // 歌曲时长，单位毫秒
  fee: number; // 收费类型，fee=1代表VIP
}

/**
 * 搜索歌曲
 * type: 1 单曲, 10 专辑, 100 歌手, 1000 歌单
 */
export const searchSongs = async (
  keyword: string,
  page: number = 1,
  limit: number = 20
): Promise<{ code: number; result: { songs: NeteaseSong[]; songCount: number } }> => {
  return request({
    url: "/cloudsearch/get/web",
    data: {
      s: keyword,
      limit,
      offset: (page - 1) * limit,
      type: 1, // 单曲
      total: true,
    },
  });
};

/**
 * 搜索歌手
 */
export const searchSingers = async (
  keyword: string,
  page: number = 1,
  limit: number = 20
): Promise<any> => {
  return request({
    url: "/cloudsearch/get/web",
    data: {
      s: keyword,
      limit,
      offset: (page - 1) * limit,
      type: 100, // 歌手
      total: true,
    },
  });
};


// ==================== 歌曲详情 & 播放链接 API ====================

/**
 * 获取歌曲播放 URL
 */
export const getSongUrl = async (
  id: number | string,
  level: "standard" | "higher" | "exhigh" | "lossless" = "standard"
): Promise<{ code: number; data: Array<{ id: number; url: string; freeTrialInfo?: any }> }> => {
  return request({
    url: "/song/enhance/player/url/v1",
    data: {
      ids: [Number(id)],
      level,
      encodeType: "mp3",
    },
  });
};

/**
 * 获取单首/多首歌曲详情（获取歌名、歌手、封面图等）
 * ids: 支持以逗号分隔的多个歌曲 ID
 */
export const getSongDetail = async (ids: string | number): Promise<{ code: number; songs: NeteaseSong[] }> => {
  const idsArray = ids.toString().split(",").map(id => Number(id));
  return request({
    url: "/v3/song/detail",
    data: {
      c: JSON.stringify(idsArray.map(id => ({ id }))),
      ids: idsArray,
    },
  });
};

/**
 * 获取歌曲歌词
 */
export const getLyric = async (id: number | string): Promise<{ code: number; lrc?: { lyric: string }; tlyric?: { lyric: string } }> => {
  return request({
    url: "/song/lyric",
    data: {
      id,
      lv: -1,
      tv: -1,
      rv: -1,
      kv: -1,
    },
  });
};

// ==================== 歌单 & 推荐 API ====================

export interface NeteasePlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  picUrl?: string; // 推荐歌单返回这个
  trackCount: number;
  playCount: number;
  creator: { nickname: string; avatarUrl: string };
  description?: string;
}

/**
 * 获取推荐歌单
 */
export const getRecommendPlaylists = async (limit: number = 10): Promise<{ code: number; result: NeteasePlaylist[] }> => {
  return request({
    url: "/personalized/playlist",
    data: {
      limit,
      n: 1000,
    },
  });
};

/**
 * 获取歌单详情 (包含其中的部分歌曲列表)
 */
export const getPlaylistDetail = async (id: number | string): Promise<{ code: number; playlist: NeteasePlaylist & { tracks: NeteaseSong[] } }> => {
  return request({
    url: "/v3/playlist/detail",
    data: {
      id,
      n: 100000,
      s: 8,
    },
  });
};

/**
 * 获取用户歌单列表 (登录后获取自己收藏/创建的歌单)
 */
export const getUserPlaylists = async (uid: number | string): Promise<{ code: number; playlist: NeteasePlaylist[] }> => {
  return request({
    url: "/user/playlist",
    data: {
      uid,
      limit: 1000,
      offset: 0,
      includeVideo: true,
    },
  });
};

/**
 * 获取每日推荐歌曲 (需要登录凭据)
 */
export const getDailyRecommendSongs = async (): Promise<{ code: number; data: { dailySongs: NeteaseSong[] } }> => {
  return request({
    url: "/v1/discovery/recommend/songs",
    data: {},
  });
};

// ==================== 排行榜 API ====================

/**
 * 获取所有榜单
 */
export const getRankLists = async (): Promise<{ code: number; list: Array<{ id: number; name: string; coverImgUrl: string; updateFrequency: string }> }> => {
  return request({
    url: "/toplist",
    data: {},
  });
};

// ==================== 评论 API ====================

export interface NeteaseComment {
  commentId: number;
  user: { nickname: string; avatarUrl: string };
  content: string;
  time: number;
  likedCount: number;
}

/**
 * 获取歌曲评论 (包括热门评论 hotComments 和普通评论 comments)
 */
export const getMusicComments = async (
  id: number | string,
  limit: number = 20
): Promise<{ code: number; hotComments?: NeteaseComment[]; comments?: NeteaseComment[]; total: number }> => {
  return request({
    url: `/v1/resource/comments/A_OD_4_${id}`,
    data: {
      rid: `A_OD_4_${id}`,
      limit,
      offset: 0,
      beforeTime: 0,
    },
  });
};

/**
 * 喜欢 / 取消喜欢歌曲
 * @param trackId 歌曲 ID
 * @param like true 喜欢，false 取消喜欢
 */
export const likeSong = async (trackId: number | string, like: boolean): Promise<{ code: number }> => {
  return request({
    url: "/api/radio/like",
    data: {
      trackId: Number(trackId),
      like,
      time: 25000,
    },
  });
};

/**
 * 获取用户喜欢的歌曲 ID 列表
 */
export const getLikedSongIds = async (): Promise<{ code: number; ids: number[] }> => {
  return request({
    url: "/api/song/like/ids",
    data: {},
  });
};

/**
 * 获取歌手详情 (包含名字、头像等) - 采用防风控精妙兜底方案
 */
export const getArtistDetail = async (artistId: number | string): Promise<any> => {
  try {
    // 1. 获取歌手歌曲 (1首) 来提取歌手名字和歌曲总数
    const songData = await request({
      url: "/api/v1/artist/songs",
      data: {
        id: Number(artistId),
        offset: 0,
        limit: 1,
        private_cloud: "true",
        work_type: 1,
        order: "time",
      },
      noCheckCode: true,
    });

    if (songData && (songData.code === 200 || songData.code === 0) && songData.songs && songData.songs.length > 0) {
      const firstSong = songData.songs[0];
      const targetArtist = firstSong.ar?.find((a: any) => String(a.id) === String(artistId)) || firstSong.ar?.[0];
      const singerName = targetArtist ? targetArtist.name : "";
      
      let picUrl = "";
      let musicSize = songData.total || 0;
      
      if (singerName) {
        // 2. 使用高稳定性、无风控的普通搜索接口获取歌手头像与歌曲数
        const searchRes = await request({
          url: "/api/search/get",
          data: {
            s: singerName,
            limit: 5,
            offset: 0,
            type: 100, // 歌手类型
            total: true,
          },
          noCheckCode: true,
        });
        
        if (searchRes && (searchRes.code === 200 || searchRes.code === 0) && searchRes.result?.artists?.length > 0) {
          const matchedArtist = searchRes.result.artists.find((a: any) => String(a.id) === String(artistId)) || searchRes.result.artists[0];
          picUrl = matchedArtist.picUrl || matchedArtist.img1v1Url || "";
          if (matchedArtist.musicSize) {
            musicSize = matchedArtist.musicSize;
          }
        }
      }

      return {
        code: 200,
        data: {
          artist: {
            id: Number(artistId),
            name: singerName,
            picUrl: picUrl,
            musicSize: musicSize,
          }
        }
      };
    }
  } catch (e) {
    console.error("[Netease] 获取歌手备用详情失败:", e);
  }

  // 兜底返回，防止前端页面卡死或报错
  return {
    code: 200,
    data: {
      artist: {
        id: Number(artistId),
        name: "未知歌手",
        picUrl: "",
        musicSize: 0,
      }
    }
  };
};

/**
 * 获取歌手歌曲列表
 */
export const getArtistSongs = async (
  artistId: number | string,
  page: number = 1,
  limit: number = 30
): Promise<{ code: number; songs: NeteaseSong[] }> => {
  return request({
    url: "/api/v1/artist/songs",
    data: {
      id: Number(artistId),
      offset: (page - 1) * limit,
      limit,
      private_cloud: "true",
      work_type: 1,
      order: "time",
    },
  });
};

/**
 * 获取私人 FM
 */
export const getPersonalFM = async (): Promise<any> => {
  return request({
    url: "/api/v1/radio/get",
    data: {},
  });
};

// ==================== 扫码登录 API ====================

/**
 * 1. 获取扫码登录所需要的 key
 */
export const getQrKey = async (): Promise<any> => {
  return request({
    url: "/api/login/qrcode/unikey",
    data: {
      type: 1,
    },
  });
};

/**
 * 2. 根据 key 生成二维码链接
 */
export const getQrCreate = async (key: string): Promise<any> => {
  return {
    code: 200,
    data: {
      qrimg: `https://music.163.com/login?codekey=${key}`,
    },
  };
};

/**
 * 3. 轮询二维码扫码状态
 * @returns 800-二维码过期, 801-等待扫码, 802-待确认, 803-授权登录成功(携带有cookie)
 */
export const getQrCheck = async (key: string): Promise<any> => {
  // 网易云音乐服务端对于扫码状态跃迁的终极风控规则：
  // 必须使用官方 Web 端/PC 端的 weapi 双重加密协议，并且在 Header 中必须携带 os=pc 的底层身份声明 Cookie，
  // 否则要么在 801 阶段被 400 拒之门外，要么在 802 跃迁 803 时被锁死！
  try {
    const data = {
      key,
      type: 1,
    };
    // 使用预置的官方 weapi 加密对参数进行多重 AES + RSA 签名
    const cryptoData = weapiEncrypt(data);
    const bodyData = `params=${encodeURIComponent(cryptoData.params)}&encSecKey=${encodeURIComponent(cryptoData.encSecKey)}`;

    const response = await axios({
      url: "https://music.163.com/weapi/login/qrcode/client/login",
      method: "POST",
      data: bodyData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": "https://music.163.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cookie": "os=pc; appver=2.9.7;", // 突破防线的决定性参数！
      },
      httpsAgent: safeAgent,
      validateStatus: () => true,
      timeout: 8000,
    });
    
    const resData = response.data || {};

    // 突破瓶颈：如果 JSON body 里没有携带 cookie，或者为了 100% 兜底，从 response headers 的 Set-Cookie 中提取核心凭证并合并
    let cookieStr = resData.cookie || "";
    const setCookies = response.headers["set-cookie"];
    if (Array.isArray(setCookies) && setCookies.length > 0) {
      const cookiePairs = setCookies.map(item => item.split(";")[0].trim()).filter(Boolean);
      if (cookiePairs.length > 0) {
        cookieStr = cookieStr ? `${cookieStr}; ${cookiePairs.join("; ")}` : cookiePairs.join("; ");
      }
    }

    if (cookieStr) {
      // 对合并后的 Cookie 进行键值对去重，过滤重复项，构造最精简且合法的 Cookie 凭证
      const parts = cookieStr.split(";");
      const cookieMap = new Map<string, string>();
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) {
          continue;
        }
        const index = trimmed.indexOf("=");
        if (index > 0) {
          const k = trimmed.substring(0, index).trim();
          const v = trimmed.substring(index + 1).trim();
          cookieMap.set(k, v);
        }
      }
      resData.cookie = Array.from(cookieMap.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
    }
    
    return resData;
  } catch (error: any) {
    console.error("[Netease] weapi 扫码检测失败:", error.message || error);
    return {
      code: 800,
      message: "网络请求异常，请稍后重试",
    };
  }
};




