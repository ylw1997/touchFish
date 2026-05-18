/**
 * QQ音乐 API 封装 (TypeScript 版本)
 * 参考: https://github.com/L-1124/QQMusicApi
 */

import axios from "axios";
import { showError } from "../utils/errorMessage";
import type {
  Song,
  Playlist,
  RankList,
  QRCodeInfo,
  SongQuality,
  UserInfo,
  ApiResponse,
} from "../../qqmusic/src/types/qqmusic";
import { LoginType } from "../../qqmusic/src/types/qqmusic";

// API 基础配置
const BASE_URL = "https://u.y.qq.com/cgi-bin/musicu.fcg";
const ENC_BASE_URL = "https://u.y.qq.com/cgi-bin/musics.fcg";
const VERSION_CODE = 13020508;

import { sign } from "./sign";

export interface QQMusicCredential {
  musicid: string;
  musickey: string;
  refresh_key?: string;
  refresh_token?: string;
  openid?: string;
  unionid?: string;
  access_token?: string;
  expired_at?: number;
  str_musicid?: string;
  login_type?: number;
  musickeyCreateTime?: number;
  keyExpiresIn?: number;
}

// 全局 credential 存储
let globalCredential: QQMusicCredential | null = null;
let isRefreshing = false;
const refreshQueue: Array<(credential: QQMusicCredential | null) => void> = [];
let credentialRefreshedHandler: ((credential: QQMusicCredential) => void) | null =
  null;

export const setGlobalCredential = (
  credential: QQMusicCredential | null,
) => {
  globalCredential = credential;
};

export const getGlobalCredential = () => globalCredential;

export const onQQMusicCredentialRefreshed = (
  handler: (credential: QQMusicCredential) => void,
) => {
  credentialRefreshedHandler = handler;
};

// 创建支持 cookies 的 axios 实例
const createSession = () => {
  return axios.create({
    withCredentials: true,
    timeout: 30000,
  });
};

// 微信登录专用 session（保持 cookies）
let wxSession: any = null;

// QQ 登录 cookies（ptqrlogin 返回的，用于后续 authorize 步骤）
let qqLoginCookies: string[] = [];

// 生成 GUID (32位十六进制，无连字符，与 Python SDK 保持一致)
const generateGuid = () => {
  return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/[x]/g, function () {
    return ((Math.random() * 16) | 0).toString(16);
  });
};

// 基础请求头
const getBaseHeaders = () => ({
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Referer: "https://y.qq.com/",
  Origin: "https://y.qq.com",
});

// 构建公共参数
const buildCommonParams = () => {
  const params: any = {
    cv: VERSION_CODE,
    v: VERSION_CODE,
    ct: "11",
    tmeAppID: "qqmusic",
    format: "json",
    inCharset: "utf-8",
    outCharset: "utf-8",
    uid: "3931641530",
  };

  // 使用全局 credential
  if (globalCredential?.musicid && globalCredential?.musickey) {
    params.uid = globalCredential.musicid;
    params.qq = globalCredential.musicid;
    params.authst = globalCredential.musickey;
    params.tmeLoginType = globalCredential.musickey.startsWith("W_X")
      ? "1"
      : "2";
  }

  return params;
};

const buildAnonymousCommonParams = () => ({
  cv: VERSION_CODE,
  v: VERSION_CODE,
  ct: "11",
  tmeAppID: "qqmusic",
  format: "json",
  inCharset: "utf-8",
  outCharset: "utf-8",
  uid: "0",
});

const LOGIN_EXPIRED_CODES = new Set([1000, 104400, 104401]);

const getCredential = (credential?: QQMusicCredential | null) =>
  credential ?? globalCredential;

const getLoginType = (credential: QQMusicCredential) =>
  credential.login_type ?? (credential.musickey.startsWith("W_X") ? 1 : 2);

const normalizeCredential = (
  raw: any,
  fallback?: QQMusicCredential | null,
): QQMusicCredential | null => {
  if (!raw) return null;
  const musicid =
    raw.str_musicid ||
    raw.musicid ||
    raw.openId ||
    raw.openid ||
    fallback?.musicid ||
    "";
  const musickey = raw.musickey || fallback?.musickey || "";
  if (!musicid || !musickey) return null;

  return {
    musicid: String(musicid),
    musickey: String(musickey),
    refresh_key: raw.refresh_key || fallback?.refresh_key || "",
    refresh_token: raw.refresh_token || fallback?.refresh_token || "",
    openid: raw.openid || fallback?.openid || "",
    unionid: raw.unionid || fallback?.unionid || "",
    access_token: raw.access_token || fallback?.access_token || "",
    expired_at: Number(raw.expired_at || fallback?.expired_at || 0),
    str_musicid: raw.str_musicid || fallback?.str_musicid || String(musicid),
    login_type: Number(raw.loginType || raw.login_type || fallback?.login_type || (String(musickey).startsWith("W_X") ? 1 : 2)),
    musickeyCreateTime: Number(
      raw.musickeyCreateTime || fallback?.musickeyCreateTime || 0,
    ),
    keyExpiresIn: Number(raw.keyExpiresIn || fallback?.keyExpiresIn || 0),
  };
};

const hasRefreshMaterial = (credential?: QQMusicCredential | null) =>
  Boolean(
    credential?.musicid &&
      credential?.musickey &&
      credential?.refresh_key &&
      credential?.refresh_token,
  );

const isCredentialExpiredByTime = (credential?: QQMusicCredential | null) => {
  if (!credential?.musickeyCreateTime || !credential?.keyExpiresIn) return false;
  const expiresAt = credential.musickeyCreateTime + credential.keyExpiresIn;
  return Math.floor(Date.now() / 1000) >= expiresAt - 60;
};

const isLoginExpiredPayload = (payload: any): boolean => {
  if (!payload || typeof payload !== "object") return false;
  if (LOGIN_EXPIRED_CODES.has(Number(payload.code))) return true;

  return Object.values(payload).some((value) => {
    if (!value || typeof value !== "object") return false;
    return LOGIN_EXPIRED_CODES.has(Number((value as any).code));
  });
};

const extractModuleErrorMessage = (payload: any) => {
  if (!payload || typeof payload !== "object") return "";
  for (const value of Object.values(payload)) {
    if (value && typeof value === "object") {
      const item = value as any;
      if (item.code && item.code !== 0) {
        return item.message || item.msg || "";
      }
    }
  }
  return "";
};

const refreshCredentialInternal = async (
  credential: QQMusicCredential,
): Promise<QQMusicCredential | null> => {
  if (!hasRefreshMaterial(credential)) return null;

  const loginType = getLoginType(credential);
  const param: any =
    loginType === 2
      ? {
          openid: credential.openid || "",
          access_token: credential.access_token || "",
          refresh_token: credential.refresh_token || "",
          expired_in: credential.expired_at || 0,
          musicid: credential.musicid,
          musickey: credential.musickey,
          refresh_key: credential.refresh_key || "",
          loginMode: 2,
        }
      : {
          openid: credential.openid || "",
          refresh_token: credential.refresh_token || "",
          str_musicid: credential.str_musicid || credential.musicid,
          musicid: credential.musicid,
          musickey: credential.musickey,
          unionid: credential.unionid || "",
          refresh_key: credential.refresh_key || "",
          loginMode: 2,
        };

  const response = await axios.post(
    BASE_URL,
    {
      comm: {
        ...buildAnonymousCommonParams(),
        tmeLoginType: loginType,
      },
      "music.login.LoginServer.Login": {
        method: "Login",
        module: "music.login.LoginServer",
        param,
      },
    },
    {
      headers: getBaseHeaders(),
      timeout: 30000,
    },
  );

  if (response.data?.code !== 0) return null;
  const loginResult =
    response.data["music.login.LoginServer.Login"] ||
    response.data["music.login.LoginServer"];
  if (!loginResult || loginResult.code !== 0) return null;

  return normalizeCredential(loginResult.data, credential);
};

export const refreshQQMusicCredential = async (
  credential?: QQMusicCredential | null,
): Promise<QQMusicCredential | null> => {
  const currentCredential = getCredential(credential);
  if (!currentCredential) return null;
  return refreshCredentialInternal(currentCredential);
};

const refreshGlobalCredential = async (): Promise<QQMusicCredential | null> => {
  const currentCredential = getGlobalCredential();
  if (!currentCredential || !hasRefreshMaterial(currentCredential)) return null;

  if (isRefreshing) {
    return new Promise((resolve) => refreshQueue.push(resolve));
  }

  isRefreshing = true;
  try {
    const newCredential = await refreshCredentialInternal(currentCredential);
    if (newCredential) {
      setGlobalCredential(newCredential);
      if (credentialRefreshedHandler) {
        credentialRefreshedHandler(newCredential);
      }
    } else {
      setGlobalCredential(null);
    }

    while (refreshQueue.length > 0) {
      refreshQueue.shift()!(newCredential);
    }

    return newCredential;
  } finally {
    isRefreshing = false;
  }
};

const refreshCredentialForRequest = async (
  credential: QQMusicCredential,
  isExplicitCredential: boolean,
) => {
  if (isExplicitCredential) {
    const newCredential = await refreshCredentialInternal(credential);
    if (newCredential && globalCredential?.musicid === credential.musicid) {
      setGlobalCredential(newCredential);
      if (credentialRefreshedHandler) {
        credentialRefreshedHandler(newCredential);
      }
    }
    return newCredential;
  }

  return refreshGlobalCredential();
};

// 基础 POST 请求
const postRequest = async (
  data: any,
  enableSign: boolean = false,
  credential?: QQMusicCredential | null,
  hasRetried: boolean = false,
) => {
  try {
    let creds = getCredential(credential);
    if (!hasRetried && creds && isCredentialExpiredByTime(creds)) {
      creds = await refreshCredentialForRequest(creds, Boolean(credential));
    }

    const requestData = { ...data };
    if (!requestData.comm) {
      requestData.comm = buildCommonParams();
    } else {
      requestData.comm = { ...buildCommonParams(), ...requestData.comm };
    }

    const url = enableSign ? ENC_BASE_URL : BASE_URL;
    const params: any = {};
    if (enableSign) {
      params.sign = sign(requestData);
    }

    const headers: any = getBaseHeaders();
    if (creds?.musicid && creds?.musickey) {
      const loginType = getLoginType(creds);
      const isWx = loginType === 1;

      headers["Cookie"] =
        `uin=${creds.musicid}; qqmusic_key=${creds.musickey}; qm_keyst=${creds.musickey}; tmeLoginType=${loginType};`;
      if (isWx) {
        headers["Cookie"] += ` wxuin=${creds.musicid};`;
      }

      requestData.comm.uid = creds.musicid; // Setup uid unconditionally
      requestData.comm.qq = creds.musicid;
      requestData.comm.authst = creds.musickey;
      requestData.comm.tmeLoginType = loginType;
      requestData.comm.loginUin = creds.musicid;
      requestData.comm.tmeAppID = "qqmusic";
    }

    const response = await axios.post(url, requestData, {
      headers,
      params,
      timeout: 30000,
    });

    if (
      !hasRetried &&
      isLoginExpiredPayload(response.data) &&
      hasRefreshMaterial(creds)
    ) {
      const newCredential = await refreshCredentialForRequest(
        creds as QQMusicCredential,
        Boolean(credential),
      );
      if (newCredential) {
        return postRequest(data, enableSign, newCredential, true);
      }
    }

    if (response.data?.code !== 0) {
      throw new Error(response.data?.msg || "请求失败");
    }

    const moduleError = extractModuleErrorMessage(response.data);
    if (moduleError && isLoginExpiredPayload(response.data)) {
      throw new Error(moduleError);
    }

    return response.data;
  } catch (error: any) {
    showError(`QQ音乐请求失败: ${error.message}`);
    throw error;
  }
};

// ==================== 搜索 API ====================

/**
 * 搜索歌曲
 */
export const searchSongs = async (
  keyword: string,
  page: number = 1,
  num: number = 20,
): Promise<ApiResponse<Song[]>> => {
  try {
    const res = await axios.get(
      "https://c.y.qq.com/soso/fcgi-bin/client_search_cp",
      {
        params: {
          p: page,
          n: num,
          w: keyword,
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://y.qq.com/",
          Origin: "https://y.qq.com",
        },
      },
    );

    const text = res.data;
    if (typeof text !== "string" || !text.includes("(")) {
      throw new Error("返回格式异常");
    }

    const jsonText = text.substring(
      text.indexOf("(") + 1,
      text.lastIndexOf(")"),
    );
    const result = JSON.parse(jsonText);

    if (result.code !== 0) {
      throw new Error("搜索请求失败");
    }

    const songs = result.data?.song?.list || [];

    return {
      code: 0,
      data: songs.map((item: any) => ({
        mid: item.songmid,
        id: item.songid,
        name: item.songname,
        title: item.songname,
        singer: item.singer || [],
        album: {
          name: item.albumname,
          mid: item.albummid,
          pmid: item.albummid,
        },
        interval: item.interval || 0,
        isonly: item.isonly || 0,
        pay: item.pay,
        file: { media_mid: item.strMediaMid || item.media_mid },
        mv: { vid: item.vid },
      })),
    };
  } catch (error: any) {
    return {
      code: -1,
      data: [],
      message: error.message,
    };
  }
};

/**
 * 搜索歌手
 */
export const searchSingers = async (
  keyword: string,
): Promise<ApiResponse<any[]>> => {
  try {
    const res = await axios.get(
      "https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg",
      {
        params: { key: keyword },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://y.qq.com/",
          Origin: "https://y.qq.com",
        },
      },
    );

    if (res.data?.code !== 0) {
      throw new Error("搜索请求失败");
    }

    const singerData = res.data.data?.singer;
    const list = singerData?.itemlist || [];

    return {
      code: 0,
      data: list,
    };
  } catch (error: any) {
    return {
      code: -1,
      data: [],
      message: error.message,
    };
  }
};

// ==================== 歌曲 API ====================

/**
 * 获取歌曲播放链接
 */
export const getSongUrl = async (
  mid: string,
  quality: SongQuality = 128,
  credential?: QQMusicCredential,
): Promise<ApiResponse<string>> => {
  try {
    // 根据音质选择文件类型
    let fileType = "M500";
    let extension = ".mp3";
    if (quality === 320) {
      fileType = "M800";
      extension = ".mp3";
    } else if (quality === 999) {
      fileType = "F000";
      extension = ".flac";
    }

    const filename = `${fileType}${mid}${mid}${extension}`;

    const data: any = {
      comm: {
        ct: "19", // Force ct: 19 explicitly for Vkey fetches like Python lib
      },
      "music.vkey.GetVkey.UrlGetVkey": {
        method: "UrlGetVkey",
        module: "music.vkey.GetVkey",
        param: {
          filename: [filename],
          guid: generateGuid(),
          songmid: [mid],
          songtype: [0],
        },
      },
    };

    const result = await postRequest(data, false, credential);
    const vkeyData =
      result["music.vkey.GetVkey.UrlGetVkey"] || result["music.vkey.GetVkey"];

    const urlInfo = vkeyData?.data?.midurlinfo?.[0];

    if (!urlInfo?.purl) {
      let errorMessage = "无法获取播放链接（可能需要登录或歌曲无版权）";

      if (urlInfo?.pneedbuy === 1) {
        errorMessage =
          "该歌曲为数字专辑/单曲，需在 QQ音乐 App 内单独购买后播放";
      } else if (urlInfo?.uiAlert === 7) {
        errorMessage = "该歌曲可能需要单独购买数字专辑后播放";
      } else if (urlInfo?.uiAlert === 41 || urlInfo?.uiAlert === 42) {
        errorMessage = "该歌曲为 VIP 专享，请确保已登录 VIP 账号";
      }

      return {
        code: -1,
        data: "",
        message: errorMessage,
      };
    }

    const url = `https://isure.stream.qqmusic.qq.com/${urlInfo.purl}`;

    return {
      code: 0,
      data: url,
    };
  } catch (error: any) {
    return {
      code: -1,
      data: "",
      message: error.message,
    };
  }
};

/**
 * 获取歌曲详情
 */
export const getSongDetail = async (
  mid: string,
): Promise<ApiResponse<Song>> => {
  try {
    const data = {
      "music.pf_song_detail_svr": {
        method: "get_song_detail_yqq",
        module: "music.pf_song_detail_svr",
        param: {
          song_mid: mid,
        },
      },
    };

    const result = await postRequest(data);
    const trackInfo = result["music.pf_song_detail_svr"]?.data?.track_info;

    if (!trackInfo) {
      return {
        code: -1,
        data: null as any,
        message: "无法获取歌曲详情",
      };
    }

    return {
      code: 0,
      data: {
        mid: trackInfo.mid,
        id: trackInfo.id,
        name: trackInfo.name,
        title: trackInfo.title,
        singer: trackInfo.singer || [],
        album: trackInfo.album,
        interval: trackInfo.interval,
        isonly: trackInfo.isonly,
        pay: trackInfo.pay,
        file: trackInfo.file,
        mv: trackInfo.mv,
      },
    };
  } catch (error: any) {
    return {
      code: -1,
      data: null as any,
      message: error.message,
    };
  }
};

/**
 * 获取歌曲歌词
 */
export const getLyric = async (mid: string): Promise<ApiResponse<string>> => {
  try {
    const data = {
      "music.musichallSong.PlayLyricInfo": {
        method: "GetPlayLyricInfo",
        module: "music.musichallSong.PlayLyricInfo",
        param: {
          songMid: mid,
        },
      },
    };

    const result = await postRequest(data);
    const lyric = result["music.musichallSong.PlayLyricInfo"]?.data?.lyric;

    return {
      code: 0,
      data: lyric || "",
    };
  } catch (error: any) {
    return {
      code: -1,
      data: "",
      message: error.message,
    };
  }
};

// ==================== 歌单 API ====================

/**
 * 获取推荐歌单
 */
export const getRecommendPlaylists = async (
  num: number = 10,
): Promise<ApiResponse<Playlist[]>> => {
  try {
    const data = {
      comm: buildCommonParams(),
      "music.playlist.PlaylistSquare.GetRecommendFeed": {
        module: "music.playlist.PlaylistSquare",
        method: "GetRecommendFeed",
        param: {
          From: 0,
          Size: num,
        },
      },
    };

    const result = await postRequest(data);

    // API 返回的是 List 数组，每个元素包含 Playlist 对象
    const list =
      result["music.playlist.PlaylistSquare.GetRecommendFeed"]?.data?.List ||
      [];
    // 映射数据结构 - 从 Playlist.basic 中提取字段
    const playlists = list.map((item: any) => {
      const basic = item.Playlist?.basic || {};
      const creator = basic.creator || {};
      const cover = basic.cover || {};

      return {
        dissid: basic.tid,
        dissname: basic.title,
        logo: cover.medium_url || cover.small_url || cover.default_url || "",
        nick: creator.nick,
        songnum: basic.song_cnt,
        listennum: basic.play_cnt,
        desc: basic.desc,
      };
    });

    return {
      code: 0,
      data: playlists,
    };
  } catch (error: any) {
    console.error("[API getRecommendPlaylists] Error:", error);
    return {
      code: -1,
      data: [],
      message: error.message,
    };
  }
};

/**
 * 获取歌单详情
 */
export const getPlaylistDetail = async (
  dissid: number,
  page: number = 1,
  num: number = 30,
): Promise<ApiResponse<{ playlist: Playlist; songs: Song[] }>> => {
  try {
    const data = {
      "music.srfDissInfo.DissInfo": {
        method: "CgiGetDiss",
        module: "music.srfDissInfo.DissInfo",
        param: {
          disstid: dissid,
          dirid: 0,
          tag: true,
          song_begin: (page - 1) * num,
          song_num: num,
          userinfo: true,
          orderlist: true,
          onlysonglist: false,
        },
      },
    };

    const result = await postRequest(data);
    const resData = result["music.srfDissInfo.DissInfo"]?.data;

    if (!resData) {
      return {
        code: -1,
        data: null as any,
        message: "无法获取歌单详情",
      };
    }

    const playlist: Playlist = {
      dissid: resData.dirinfo?.id || dissid,
      dissname: resData.dirinfo?.title || "未知歌单",
      logo: resData.dirinfo?.picurl || "",
      nick: resData.dirinfo?.creator?.nick,
      songnum: resData.total_song_num || 0,
    };

    const songs: Song[] = (resData.songlist || []).map((item: any) => ({
      mid: item.mid,
      id: item.id,
      name: item.name || item.title,
      title: item.title,
      singer: item.singer || [],
      album: item.album,
      interval: item.interval,
      isonly: item.isonly,
      pay: item.pay,
      file: item.file,
      mv: item.mv,
    }));

    return {
      code: 0,
      data: { playlist, songs },
    };
  } catch (error: any) {
    return {
      code: -1,
      data: null as any,
      message: error.message,
    };
  }
};

// ==================== 排行榜 API ====================

/**
 * 获取排行榜列表
 */
export const getRankLists = async (): Promise<ApiResponse<RankList[]>> => {
  try {
    const data = {
      comm: buildCommonParams(),
      "music.musicToplist.Toplist.GetAll": {
        module: "music.musicToplist.Toplist",
        method: "GetAll",
        param: {},
      },
    };

    const result = await postRequest(data);
    const resData = result["music.musicToplist.Toplist.GetAll"]?.data;

    const groups = resData?.group || [];

    // 从 groups 中提取所有排行榜
    const topList: any[] = [];
    groups.forEach((group: any) => {
      if (group.toplist) {
        topList.push(...group.toplist);
      }
    });

    return {
      code: 0,
      data: topList.map((item: any) => ({
        id: item.topId,
        topId: item.topId,
        title: item.title,
        subtitle: item.titleShare || item.titleDetail,
        picUrl: item.headPicUrl || item.frontPicUrl,
        update_key: item.update_key,
      })),
    };
  } catch (error: any) {
    return {
      code: -1,
      data: [],
      message: error.message,
    };
  }
};

/**
 * 获取排行榜详情
 */
export const getRankDetail = async (
  topId: number,
  page: number = 1,
  num: number = 30,
): Promise<ApiResponse<{ rankInfo: RankList; songs: Song[] }>> => {
  try {
    const data = {
      comm: buildCommonParams(),
      "music.musicToplist.Toplist.GetDetail": {
        module: "music.musicToplist.Toplist",
        method: "GetDetail",
        param: {
          topId,
          offset: num * (page - 1),
          num,
          withTags: false,
        },
      },
    };

    const result = await postRequest(data);
    const resData = result["music.musicToplist.Toplist.GetDetail"]?.data;

    if (!resData) {
      return {
        code: -1,
        data: null as any,
        message: "无法获取排行榜详情",
      };
    }

    const rankInfo: RankList = {
      id: resData.topId || topId,
      topId: resData.topId || topId,
      title: resData.title || "未知榜单",
      subtitle: resData.titleShare || resData.titleDetail,
      picUrl: resData.headPicUrl || resData.frontPicUrl,
      update_key: resData.update_key,
    };

    const songs: Song[] = (resData.songInfoList || resData.song || []).map(
      (item: any) => ({
        mid: item.mid,
        id: item.id,
        name: item.name || item.title,
        title: item.title,
        singer: item.singer || [],
        album: item.album,
        interval: item.interval,
        isonly: item.isonly,
        pay: item.pay,
        file: item.file,
        mv: item.mv,
      }),
    );

    return {
      code: 0,
      data: { rankInfo, songs },
    };
  } catch (error: any) {
    return {
      code: -1,
      data: null as any,
      message: error.message,
    };
  }
};

// ==================== 登录 API ====================

/**
 * 获取登录二维码（QQ）
 */
export const getQQLoginQR = async (): Promise<ApiResponse<QRCodeInfo>> => {
  try {
    // QQ 登录二维码需要通过特殊接口获取
    const response = await axios.get("https://ssl.ptlogin2.qq.com/ptqrshow", {
      params: {
        appid: "716027609",
        e: "2",
        l: "M",
        s: "3",
        d: "72",
        v: "4",
        t: Math.random(),
        daid: "383",
        pt_3rd_aid: "100497308",
      },
      responseType: "arraybuffer",
    });

    // 转换图片为 base64
    const buffer = Buffer.from(response.data, "binary");
    const base64 = buffer.toString("base64");
    const qrCode = `data:image/png;base64,${base64}`;

    // 从 cookies 中获取 qrsig
    const cookies = response.headers["set-cookie"] || [];
    const qrsigCookie = cookies.find((c: string) => c.includes("qrsig"));
    const qrsig = qrsigCookie?.match(/qrsig=([^;]+)/)?.[1] || "";

    return {
      code: 0,
      data: {
        data: qrCode,
        identifier: qrsig,
        type: LoginType.QQ,
      },
    };
  } catch (error: any) {
    return {
      code: -1,
      data: null as any,
      message: error.message,
    };
  }
};

/**
 * 计算 hash33（QQ登录用）
 */
const hash33 = (str: string, seed: number = 0): number => {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash += (hash << 5) + str.charCodeAt(i);
  }
  return hash & 2147483647;
};

/**
 * 从 Set-Cookie 数组中提取 name=value 对，并去重
 * 规则：同名 cookie 后出现的覆盖先出现的，但空值不覆盖已有非空值
 */
const parseCookies = (setCookies: string[]): string => {
  const cookieMap = new Map<string, string>();
  for (const cookie of setCookies) {
    const nameValue = cookie.split(";")[0];
    const eqIdx = nameValue.indexOf("=");
    if (eqIdx > 0) {
      const name = nameValue.substring(0, eqIdx).trim();
      const value = nameValue.substring(eqIdx + 1).trim();
      if (!cookieMap.has(name)) {
        cookieMap.set(name, value);
      } else if (value) {
        // 只有非空值才覆盖已有的值
        cookieMap.set(name, value);
      }
    }
  }
  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
};

/**
 * 通过 QQ 扫码完成登录并获取 musicid/musickey
 */
const authorizeQQQR = async (
  uin: string,
  sigx: string,
): Promise<ApiResponse<UserInfo>> => {
  try {
    console.log("[QQMusic QQ] authorizeQQQR start, uin:", uin);

    // 合并 ptqrlogin cookies + check_sig cookies，去重后生成 Cookie header
    const buildCookieHeader = (checkSigCookies: string[]) => {
      // 按顺序合并：ptqrlogin 在前，check_sig 在后（后出现的覆盖先出现的）
      return parseCookies([...qqLoginCookies, ...checkSigCookies]);
    };

    // Step 1: 调用 check_sig 获取 p_skey
    console.log("[QQMusic QQ] Step 1: check_sig...");
    const checkSigResp = await axios.get(
      "https://ssl.ptlogin2.graph.qq.com/check_sig",
      {
        params: {
          uin,
          pttype: "1",
          service: "ptqrlogin",
          nodirect: "0",
          ptsigx: sigx,
          s_url: "https://graph.qq.com/oauth2.0/login_jump",
          ptlang: "2052",
          ptredirect: "100",
          aid: "716027609",
          daid: "383",
          j_later: "0",
          low_login_hour: "0",
          regmaster: "0",
          pt_login_type: "3",
          pt_aid: "0",
          pt_aaid: "16",
          pt_light: "0",
          pt_3rd_aid: "100497308",
        },
        headers: {
          Referer: "https://xui.ptlogin2.qq.com/",
          // 携带 ptqrlogin 的 cookies（只取 name=value）
          Cookie: qqLoginCookies.length > 0 ? parseCookies(qqLoginCookies) : undefined,
        },
        maxRedirects: 0,
        validateStatus: (status: number) => status >= 200 && status < 400,
      },
    );

    const cookies = checkSigResp.headers["set-cookie"] || [];
    console.log("[QQMusic QQ] check_sig cookies:", cookies.map((c: string) => c.split(";")[0]).join("; "));

    const cookiePairs = buildCookieHeader(cookies);
    console.log("[QQMusic QQ] Cookie header for authorize:", cookiePairs);

    const pSkeyCookie = cookies.find((c: string) => c.includes("p_skey=") && !c.includes("p_skey_forbid"));
    const pSkey = pSkeyCookie?.match(/p_skey=([^;]+)/)?.[1] || "";
    if (!pSkey) {
      console.error("[QQMusic QQ] p_skey not found in cookies:", cookies);
      return { code: -1, data: null as any, message: "获取 p_skey 失败" };
    }

    console.log("[QQMusic QQ] p_skey found, g_tk:", hash33(pSkey, 5381));

    // Step 2: 调用 graph.qq.com/oauth2.0/authorize 获取 code
    console.log("[QQMusic QQ] Step 2: authorize...");
    const authResp = await axios.post(
      "https://graph.qq.com/oauth2.0/authorize",
      new URLSearchParams({
        response_type: "code",
        client_id: "100497308",
        redirect_uri: "https://y.qq.com/portal/wx_redirect.html?login_type=1&surl=https://y.qq.com/",
        scope: "get_user_info,get_app_friends",
        state: "state",
        switch: "",
        from_ptlogin: "1",
        src: "1",
        update_auth: "1",
        openapi: "1010_1030",
        g_tk: hash33(pSkey, 5381).toString(),
        auth_time: String(Date.now()),
        ui: generateGuid(),
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: "https://xui.ptlogin2.qq.com/",
          Cookie: cookiePairs,
        },
        maxRedirects: 0,
        validateStatus: (status: number) => status >= 200 && status < 400,
      },
    );

    const location = authResp.headers["location"] || "";
    console.log("[QQMusic QQ] authorize redirect:", location.substring(0, 200));
    const codeMatch = location.match(/code=([^&]+)/);
    if (!codeMatch) {
      console.error("[QQMusic QQ] No code in location, full location:", location);
      return { code: -1, data: null as any, message: "获取授权 code 失败: " + location.substring(0, 200) };
    }
    const code = codeMatch[1];
    console.log("[QQMusic QQ] Step 3: QQLogin with code:", code);

    // Step 3: 用 code 换取 musicid/musickey
    const loginResp = await axios.post(
      "https://u.y.qq.com/cgi-bin/musicu.fcg",
      {
        comm: {
          cv: VERSION_CODE,
          v: VERSION_CODE,
          ct: "11",
          tmeAppID: "qqmusic",
          format: "json",
          inCharset: "utf-8",
          outCharset: "utf-8",
          uid: "0",
          tmeLoginType: "2",
        },
        "QQConnectLogin.LoginServer": {
          module: "QQConnectLogin.LoginServer",
          method: "QQLogin",
          param: { code },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Referer: "https://y.qq.com/",
          Origin: "https://y.qq.com",
          Cookie: cookiePairs,
        },
      },
    );

    console.log("[QQMusic QQ] QQLogin response:", JSON.stringify(loginResp.data).substring(0, 500));

    const loginData = loginResp.data["QQConnectLogin.LoginServer"];
    if (!loginData || loginData.code !== 0) {
      console.error("[QQMusic QQ] QQLogin failed:", JSON.stringify(loginData));
      return {
        code: -1,
        data: null as any,
        message: loginData?.message || "QQLogin 登录失败 (code: " + loginData?.code + ")",
      };
    }

    const loginInfo = loginData.data;
    console.log("[QQMusic QQ] Login success! musicid:", loginInfo?.musicid || loginInfo?.openId, "musickey:", loginInfo?.musickey ? "found" : "missing");

    const rawMusicid = loginInfo?.musicid || loginInfo?.openId || "";

    return {
      code: 0,
      data: {
        musicid: String(rawMusicid),
        musickey: loginInfo?.musickey || "",
        nickname: loginInfo?.nickname || loginInfo?.nick || "",
        avatar: loginInfo?.logo || loginInfo?.avatar || "",
      },
    };
  } catch (error: any) {
    return { code: -1, data: null as any, message: error.message };
  }
};

/**
 * 检查登录状态
 */
export const checkLoginStatus = async (
  identifier: string,
  type: "qq" | "wx",
): Promise<ApiResponse<{ status: string; userInfo?: UserInfo }>> => {
  try {
    if (type === "qq") {
      // 计算 ptqrtoken
      const ptqrtoken = hash33(identifier);

      // QQ 登录状态检查
      const response = await axios.get(
        "https://ssl.ptlogin2.qq.com/ptqrlogin",
        {
          params: {
            u1: "https://graph.qq.com/oauth2.0/login_jump",
            ptqrtoken: ptqrtoken.toString(),
            ptredirect: "0",
            h: "1",
            t: "1",
            g: "1",
            from_ui: "1",
            ptlang: "2052",
            action: "0-0-" + Date.now(),
            js_ver: "20102616",
            js_type: "1",
            login_sig: "",
            pt_uistyle: "40",
            aid: "716027609",
            daid: "383",
            pt_3rd_aid: "100497308",
          },
          headers: {
            Cookie: `qrsig=${identifier};`,
            Referer: "https://xui.ptlogin2.qq.com/",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        },
      );

      // 保存 ptqrlogin 的 cookies 供后续 authorize 使用
      const ptqrCookies = response.headers["set-cookie"] || [];
      qqLoginCookies = ptqrCookies;

      const data = response.data as string;
      console.log("[QQMusic QQ] ptqrlogin raw:", data.substring(0, 400));
      console.log("[QQMusic QQ] ptqrlogin cookies:", ptqrCookies.map((c: string) => c.split(";")[0]).join("; ") || "(none)");

      // 参考 QQMusicApi (L-1124) 的解析方式
      // ptuiCB('0','0','URL','0','登录成功！', 'YLW', '');
      const cbMatch = data.match(/ptuiCB\((.*?)\)/);
      if (!cbMatch) {
        console.error("[QQMusic QQ] No ptuiCB found");
        return { code: 0, data: { status: "pending" } };
      }

      // 提取单引号内的参数: 'val1','val2',...
      const args: string[] = [];
      const argRegex = /'((?:\\.|[^'\\])*)'/g;
      let m: RegExpExecArray | null;
      while ((m = argRegex.exec(cbMatch[1])) !== null) {
        args.push(m[1]);
      }

      console.log("[QQMusic QQ] args count:", args.length, "args[0]:", args[0], "args[2] first 200:", args[2]?.substring(0, 200));

      const code = parseInt(args[0], 10);
      if (isNaN(code)) return { code: 0, data: { status: "pending" } };

      switch (code) {
        case 0: {
          // 登录成功，从 URL 提取 uin 和 ptsigx
          // 参考 Python: uin=(.+?)&service, ptsigx=(.+?)&s_url
          const redirectUrl = args[2] || "";
          const uinMatch = redirectUrl.match(/[?&]uin=([^&]+)&service/);
          const sigxMatch = redirectUrl.match(/[?&]ptsigx=([^&]+)&s_url/);
          const uin = uinMatch ? uinMatch[1] : "";
          const sigx = sigxMatch ? sigxMatch[1] : "";

          console.log("[QQMusic QQ] uin:", uin || "(missing)", "ptsigx:", sigx ? "(found)" : "(missing)");

          if (!uin || !sigx) {
            console.error("[QQMusic QQ] URL extract failed, full URL:", redirectUrl);
            return {
              code: -1,
              data: { status: "failed" },
              message: `提取登录参数失败`,
            };
          }

          console.log("[QQMusic QQ] Calling authorizeQQQR...");
          const credentialResult = await authorizeQQQR(uin, sigx);
          console.log("[QQMusic QQ] authorizeQQQR result:", credentialResult.code, credentialResult.message);

          if (credentialResult.code === 0 && credentialResult.data) {
            return {
              code: 0,
              data: {
                status: "success",
                userInfo: credentialResult.data,
              },
            };
          }
          return {
            code: -1,
            data: { status: "failed" },
            message: credentialResult.message || "获取 QQ 音乐凭证失败",
          };
        }
        case 65:
          return { code: 0, data: { status: "timeout" } };
        case 66:
          return { code: 0, data: { status: "confirming" } };
        case 67:
          return { code: 0, data: { status: "confirming" } };
        default:
          return { code: 0, data: { status: "pending" } };
      }
    } else if (type === "wx") {
      // 微信登录状态检查 - 使用长轮询，超时是正常的
      try {
        const response = await axios.get(
          "https://lp.open.weixin.qq.com/connect/l/qrconnect",
          {
            params: {
              uuid: identifier,
              _: Date.now().toString(),
            },
            headers: {
              Referer: "https://open.weixin.qq.com/",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            timeout: 30000, // 30秒超时
          },
        );

        const data = response.data;

        // 解析微信响应: window.wx_errcode=xxx;window.wx_code='yyy'
        const errCodeMatch = data.match(/window\.wx_errcode=(\d+);/);
        const wxCodeMatch = data.match(/window\.wx_code='([^']*)';/);

        if (!errCodeMatch) {
          return {
            code: 0,
            data: { status: "pending" },
          };
        }

        const errCode = parseInt(errCodeMatch[1], 10);
        const wxCode = wxCodeMatch ? wxCodeMatch[1] : "";

        // 微信错误码: 408=等待扫码, 404=已扫码未确认, 403=拒绝, 405=成功, 500=错误
        switch (errCode) {
          case 405:
            // 登录成功，获取 credential
            if (wxCode) {
              const credentialResult = await authorizeWXQR(wxCode);
              if (credentialResult.code === 0 && credentialResult.data) {
                return {
                  code: 0,
                  data: {
                    status: "success",
                    userInfo: credentialResult.data,
                  },
                };
              }
            }
            return {
              code: -1,
              data: { status: "failed" },
              message: "获取登录凭证失败",
            };
          case 404:
            return {
              code: 0,
              data: { status: "scanning" },
            };
          case 408:
            return {
              code: 0,
              data: { status: "pending" },
            };
          case 403:
            return {
              code: 0,
              data: { status: "failed" },
              message: "用户拒绝授权",
            };
          case 500:
            return {
              code: 0,
              data: { status: "failed" },
              message: "系统错误",
            };
          default:
            return {
              code: 0,
              data: { status: "pending" },
            };
        }
      } catch (error: any) {
        // 超时是正常的，表示二维码仍在等待扫描
        if (
          error.code === "ECONNABORTED" ||
          error.message?.includes("timeout")
        ) {
          return {
            code: 0,
            data: { status: "scanning" }, // 超时视为已扫码状态，继续轮询
          };
        }
        throw error;
      }
    }

    return {
      code: 0,
      data: { status: "pending" },
    };
  } catch (error: any) {
    return {
      code: -1,
      data: { status: "failed" },
      message: error.message,
    };
  }
};

// ==================== 用户 API ====================

export const getEuin = async (musicid: string): Promise<string> => {
  try {
    const response = await axios.get(
      "https://c6.y.qq.com/rsc/fcgi-bin/fcg_get_profile_homepage.fcg",
      {
        params: { ct: 20, cv: 4747474, cid: 205360838, userid: musicid },
        headers: getBaseHeaders(),
      },
    );
    return response.data?.data?.creator?.encrypt_uin || "";
  } catch {
    return "";
  }
};

/**
 * 获取用户信息
 */
export const getUserInfo = async (
  credential: QQMusicCredential | null = null,
): Promise<ApiResponse<UserInfo>> => {
  try {
    const currentCredential = credential || globalCredential;
    if (!currentCredential?.musicid || !currentCredential?.musickey) {
      return {
        code: -1,
        data: null as any,
        message: "未配置 QQ 音乐登录凭证",
      };
    }

    const data = {
      comm: buildCommonParams(),
      "music.UserInfo.userInfoServer": {
        method: "GetLoginUserInfo",
        module: "music.UserInfo.userInfoServer",
        param: {},
      },
    };

    const result = await postRequest(data);
    const userData = result["music.UserInfo.userInfoServer"]?.data;

    if (!userData) {
      return {
        code: -1,
        data: null as any,
        message: "无法获取用户信息",
      };
    }

    const info = userData.info || {};

    const latestGlobalCredential = getGlobalCredential();
    const responseCredential =
      latestGlobalCredential?.musicid === currentCredential.musicid
        ? latestGlobalCredential
        : currentCredential;

    return {
      code: 0,
      data: {
        musicid: responseCredential.musicid,
        musickey: responseCredential.musickey,
        refresh_key: responseCredential.refresh_key,
        refresh_token: responseCredential.refresh_token,
        openid: responseCredential.openid,
        unionid: responseCredential.unionid,
        nickname: info.nick || "",
        avatar: info.logo || "",
      },
    };
  } catch (error: any) {
    return {
      code: -1,
      data: null as any,
      message: error.message,
    };
  }
};

/**
 * 获取我喜欢的歌单
 */
export const getMyFavorite = async (
  credential: QQMusicCredential,
  page: number = 1,
  num: number = 30,
): Promise<ApiResponse<{ songs: Song[]; total: number }>> => {
  try {
    const euin = await getEuin(credential.musicid);
    // 我喜欢的歌曲通常是 dirid = 201
    const data = {
      comm: buildCommonParams(),
      "music.srfDissInfo.DissInfo": {
        method: "CgiGetDiss",
        module: "music.srfDissInfo.DissInfo",
        param: {
          disstid: 0, // 使用 dirid
          dirid: 201, // 我喜欢的
          tag: true,
          song_begin: (page - 1) * num,
          song_num: num,
          userinfo: true,
          orderlist: true,
          enc_host_uin: euin,
        },
      },
    };

    const result = await postRequest(data, false, credential);
    const resData = result["music.srfDissInfo.DissInfo"]?.data;

    const songs: Song[] = (resData?.songlist || []).map((item: any) => ({
      mid: item.mid,
      id: item.id,
      name: item.name || item.title,
      title: item.title,
      singer: item.singer || [],
      album: item.album,
      interval: item.interval,
      isonly: item.isonly,
      pay: item.pay,
      file: item.file,
      mv: item.mv,
    }));

    return {
      code: 0,
      data: {
        songs,
        total: resData?.total_song_num || 0,
      },
    };
  } catch (error: any) {
    return {
      code: -1,
      data: { songs: [], total: 0 },
      message: error.message,
    };
  }
};

/**
 * 获取我的歌单列表
 */
export const getMyPlaylists = async (
  credential: QQMusicCredential,
): Promise<ApiResponse<Playlist[]>> => {
  try {
    const data = {
      comm: buildCommonParams(),
      "music.musicasset.PlaylistBaseRead": {
        method: "GetPlaylistByUin",
        module: "music.musicasset.PlaylistBaseRead",
        param: {
          uin: credential.musicid,
        },
      },
    };

    const result = await postRequest(data, false, credential);
    const playlists =
      result["music.musicasset.PlaylistBaseRead"]?.data?.v_playlist || [];

    return {
      code: 0,
      data: playlists.map((item: any) => ({
        dissid: item.tid, // Use tid for dissid
        dirid: item.dirId,
        dissname: item.dirName,
        logo: item.picUrl,
        nick: item.nick,
        songnum: item.songNum,
      })),
    };
  } catch (error: any) {
    return {
      code: -1,
      data: [],
      message: error.message,
    };
  }
};

/**
 * 获取微信登录二维码
 */
export const getWXLoginQR = async (): Promise<ApiResponse<QRCodeInfo>> => {
  try {
    // 创建新的 session 用于微信登录（保持 cookies）
    wxSession = createSession();

    // 1. 获取微信 uuid
    const uuidRes = await wxSession.get(
      "https://open.weixin.qq.com/connect/qrconnect",
      {
        params: {
          appid: "wx48db31d50e334801",
          redirect_uri:
            "https://y.qq.com/portal/wx_redirect.html?login_type=2&surl=https://y.qq.com/",
          response_type: "code",
          scope: "snsapi_login",
          state: "STATE",
          href: "https://y.qq.com/mediastyle/music_v17/src/css/popup_wechat.css#wechat_redirect",
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://y.qq.com/",
        },
      },
    );

    // 从响应中提取 uuid
    const uuidMatch = uuidRes.data.match(/uuid=(.+?)"/);
    const uuid = uuidMatch?.[1];

    if (!uuid) {
      return {
        code: -1,
        data: null as any,
        message: "获取微信 uuid 失败",
      };
    }

    // 2. 获取二维码图片（使用同一个 session）
    const qrRes = await wxSession.get(
      `https://open.weixin.qq.com/connect/qrcode/${uuid}`,
      {
        responseType: "arraybuffer",
        headers: {
          Referer: "https://open.weixin.qq.com/connect/qrconnect",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
    );

    // 转换图片为 base64
    const buffer = Buffer.from(qrRes.data, "binary");
    const base64 = buffer.toString("base64");
    const qrCode = `data:image/jpeg;base64,${base64}`;

    return {
      code: 0,
      data: {
        data: qrCode,
        identifier: uuid,
        type: LoginType.WX,
      },
    };
  } catch (error: any) {
    return {
      code: -1,
      data: null as any,
      message: error.message,
    };
  }
};

/**
 * 微信授权登录 - 用 wx_code 换取 QQ 音乐 credential
 */
const authorizeWXQR = async (
  wxCode: string,
): Promise<ApiResponse<UserInfo>> => {
  try {
    const requestData = {
      comm: {
        ...buildAnonymousCommonParams(),
        tmeLoginType: "1",
      },
      "music.login.LoginServer.Login": {
        method: "Login",
        module: "music.login.LoginServer",
        param: {
          code: wxCode,
          strAppid: "wx48db31d50e334801",
        },
      },
    };

    if (!wxSession) {
      console.error("[authorizeWXQR] No wxSession available!");
      return {
        code: -1,
        data: null as any,
        message: "登录会话已过期，请重新获取二维码",
      };
    }

    const response = await wxSession.post(BASE_URL, requestData, {
      headers: getBaseHeaders(),
      timeout: 30000,
    });

    if (response.data?.code !== 0) {
      console.error("[authorizeWXQR] API error:", response.data?.msg);
      return {
        code: -1,
        data: null as any,
        message: response.data?.msg || "登录请求失败",
      };
    }

    const loginResult =
      response.data["music.login.LoginServer.Login"] ||
      response.data["music.login.LoginServer"];

    if (!loginResult) {
      console.error("[authorizeWXQR] No music.login.LoginServer in response");
      return {
        code: -1,
        data: null as any,
        message: "登录响应格式错误",
      };
    }

    if (loginResult.code !== 0) {
      console.error(
        "[authorizeWXQR] LoginServer returned error code:",
        loginResult.code,
      );
      console.error(
        "[authorizeWXQR] LoginServer payload:",
        JSON.stringify(loginResult),
      );
      return {
        code: -1,
        data: null as any,
        message: `登录失败 (code: ${loginResult.code})`,
      };
    }

    const loginData = loginResult.data;

    if (!loginData || !loginData.musicid || !loginData.musickey) {
      console.error("[authorizeWXQR] Missing musicid or musickey in data");
      return {
        code: -1,
        data: null as any,
        message: "获取登录凭证失败：返回数据不完整",
      };
    }

    return {
      code: 0,
      data: {
        // CRITICAL: use str_musicid instead of musicid.toString()
        // because musicid is a large integer that exceeds Number.MAX_SAFE_INTEGER
        // and JSON.parse silently corrupts it (e.g. 1152921504719684275 -> 1152921504719684400)
        musicid: loginData.str_musicid || loginData.musicid.toString(),
        musickey: loginData.musickey,
        refresh_key: loginData.refresh_key || "",
        refresh_token: loginData.refresh_token || "",
        openid: loginData.openid || "",
        nickname: loginData.nick || "",
        avatar: loginData.logo || loginData.pic || "",
      },
    };
  } catch (error: any) {
    console.error("[authorizeWXQR] Error:", error);
    return {
      code: -1,
      data: null as any,
      message: error.message || "授权失败",
    };
  }
};

/**
 * 添加歌曲到歌单 (dirid 201 为我喜欢)
 */
export const addSongsToPlaylist = async (
  dirid: number,
  songIds: number[],
): Promise<ApiResponse<boolean>> => {
  try {
    const data = {
      comm: buildCommonParams(),
      "music.musicasset.PlaylistDetailWrite": {
        method: "AddSonglist",
        module: "music.musicasset.PlaylistDetailWrite",
        param: {
          dirId: dirid,
          v_songInfo: songIds.map((id) => ({ songType: 0, songId: id })),
        },
      },
    };

    const result = await postRequest(data);
    const resData = result["music.musicasset.PlaylistDetailWrite"]?.data;
    return {
      code: 0,
      data: !!resData?.result?.updateTime,
    };
  } catch (error: any) {
    return {
      code: -1,
      data: false,
      message: error.message,
    };
  }
};

/**
 * 从歌单删除歌曲 (dirid 201 为我喜欢)
 */
export const removeSongsFromPlaylist = async (
  dirid: number,
  songIds: number[],
): Promise<ApiResponse<boolean>> => {
  try {
    const data = {
      comm: buildCommonParams(),
      "music.musicasset.PlaylistDetailWrite": {
        method: "DelSonglist",
        module: "music.musicasset.PlaylistDetailWrite",
        param: {
          dirId: dirid,
          v_songInfo: songIds.map((id) => ({ songType: 0, songId: id })),
        },
      },
    };

    const result = await postRequest(data);
    const resData = result["music.musicasset.PlaylistDetailWrite"]?.data;
    return {
      code: 0,
      data: !!resData?.result?.updateTime,
    };
  } catch (error: any) {
    return {
      code: -1,
      data: false,
      message: error.message,
    };
  }
};

/**
 * 获取雷达推荐列表
 */
export const getRadarRecommend = async (): Promise<ApiResponse<any>> => {
  try {
    const data = {
      comm: buildCommonParams(),
      "music.recommend.TrackRelationServer": {
        method: "GetRadarSong",
        module: "music.recommend.TrackRelationServer",
        param: {
          Page: 1,
          ReqType: 0,
          FavSongs: [],
          EntranceSongs: [],
        },
      },
    };

    const result = await postRequest(data);
    return {
      code: 0,
      data: result["music.recommend.TrackRelationServer"]?.data,
    };
  } catch (error: any) {
    return {
      code: -1,
      data: null,
      message: error.message,
    };
  }
};

/**
 * 获取猜你喜欢 (个性电台)
 */
export const getGuessRecommend = async (): Promise<ApiResponse<any>> => {
  try {
    const data = {
      comm: buildCommonParams(),
      "music.radioProxy.MbTrackRadioSvr": {
        method: "get_radio_track",
        module: "music.radioProxy.MbTrackRadioSvr",
        param: {
          id: 99,
          num: 5,
          from: 0,
          scene: 0,
          song_ids: [],
          ext: { bluetooth: "" },
          should_count_down: 1,
        },
      },
    };

    const result = await postRequest(data);
    return {
      code: 0,
      data: result["music.radioProxy.MbTrackRadioSvr"]?.data,
    };
  } catch (error: any) {
    return {
      code: -1,
      data: null,
      message: error.message,
    };
  }
};

/**
 * 获取歌手基本信息
 */
export const getSingerInfo = async (mid: string): Promise<ApiResponse<any>> => {
  try {
    const data = {
      comm: buildCommonParams(),
      "music.UnifiedHomepage.UnifiedHomepageSrv": {
        method: "GetHomepageHeader",
        module: "music.UnifiedHomepage.UnifiedHomepageSrv",
        param: { SingerMid: mid },
      },
    };

    const result = await postRequest(data);

    return {
      code: 0,
      data: result["music.UnifiedHomepage.UnifiedHomepageSrv"]?.data || {},
    };
  } catch (error: any) {
    return {
      code: -1,
      data: null,
      message: error.message,
    };
  }
};

/**
 * 获取歌手歌曲列表
 */
export const getSingerSongs = async (
  mid: string,
  page: number = 1,
  num: number = 20,
): Promise<ApiResponse<Song[]>> => {
  try {
    const data = {
      comm: buildCommonParams(),
      "musichall.song_list_server": {
        method: "GetSingerSongList",
        module: "musichall.song_list_server",
        param: {
          singerMid: mid,
          order: 1,
          number: num,
          begin: (page - 1) * num,
        },
      },
    };

    const result = await postRequest(data);

    const songs = result["musichall.song_list_server"]?.data?.songList || [];

    return {
      code: 0,
      data: songs.map((item: any) => {
        const song = item.songInfo || item || {};
        const singerList = song.singer || [];
        return {
          mid: song.songmid || song.mid,
          id: song.songid || song.id,
          name: song.name || song.songname || song.title || "未知歌曲",
          title: song.title || song.songname || song.name || "未知歌曲",
          singer: Array.isArray(singerList)
            ? singerList.map((s: any) => ({
              name: s.name,
              mid: s.mid || s.singer_MID,
            }))
            : [],
          album: {
            name: song.album?.name || song.albumname || "未知专辑",
            mid: song.album?.mid || song.albummid || "",
            pmid: song.album?.pmid || song.album?.mid || song.albummid || "",
          },
          interval: song.interval || 0,
          isonly: song.isonly || 0,
          pay: song.pay,
          file: {
            media_mid:
              song.strMediaMid || song.media_mid || song.file?.media_mid,
          },
          mv: { vid: song.vid || song.mv?.vid },
        };
      }),
    };
  } catch (error: any) {
    return {
      code: -1,
      data: [],
      message: error.message,
    };
  }
};
