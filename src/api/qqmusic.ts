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

// 全局 credential 存储
let globalCredential: { musicid: string; musickey: string } | null = null;

export const setGlobalCredential = (
  credential: { musicid: string; musickey: string } | null,
) => {
  globalCredential = credential;
};

export const getGlobalCredential = () => globalCredential;

// 创建支持 cookies 的 axios 实例
const createSession = () => {
  return axios.create({
    withCredentials: true,
    timeout: 30000,
  });
};

// 微信登录专用 session（保持 cookies）
let wxSession: any = null;

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

// 基础 POST 请求
const postRequest = async (
  data: any,
  enableSign: boolean = false,
  credential?: { musicid?: string; musickey?: string },
) => {
  try {
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
    const creds = credential || globalCredential;
    if (creds?.musicid && creds?.musickey) {
      const isWx = creds.musickey.startsWith("W_X");
      const loginType = isWx ? "1" : "2";

      headers["Cookie"] =
        `uin=${creds.musicid}; qqmusic_key=${creds.musickey}; qm_keyst=${creds.musickey}; tmeLoginType=${loginType};`;
      if (isWx) {
        headers["Cookie"] += ` wxuin=${creds.musicid};`;
      }

      requestData.comm.uid = creds.musicid; // Setup uid unconditionally

      if (!requestData.comm.qq) {
        requestData.comm.qq = creds.musicid;
        requestData.comm.authst = creds.musickey;
        requestData.comm.tmeLoginType = loginType;
        requestData.comm.loginUin = creds.musicid;
        requestData.comm.tmeAppID = "qqmusic";
      }
    }

    const response = await axios.post(url, requestData, {
      headers,
      params,
      timeout: 30000,
    });

    if (response.data?.code !== 0) {
      throw new Error(response.data?.msg || "请求失败");
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
  credential?: { musicid?: string; musickey?: string },
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
const hash33 = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += (hash << 5) + str.charCodeAt(i);
  }
  return hash & 2147483647;
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
            u1: "https://y.qq.com/",
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

      const data = response.data;

      // 解析登录结果 (例如: ptuiCB('0','0','https://...','0','登录成功!', 'Nickname');)
      if (data.includes("登录成功")) {
        // 尝试从回调中提取昵称
        const ptuiMatch = data.match(
          /ptuiCB\('0','0','[^']*','0','登录成功!',\s*'([^']*)'/,
        );
        const nickname = ptuiMatch ? ptuiMatch[1] : "QQ用户";

        // 提取用户信息
        return {
          code: 0,
          data: {
            status: "success",
            userInfo: {
              musicid: "",
              musickey: "",
              nickname: nickname,
            },
          },
        };
      } else if (data.includes("二维码已失效")) {
        return {
          code: 0,
          data: { status: "timeout" },
        };
      } else if (data.includes("已扫码")) {
        return {
          code: 0,
          data: { status: "scanning" },
        };
      } else {
        return {
          code: 0,
          data: { status: "pending" },
        };
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
  credential: {
    musicid: string;
    musickey: string;
  } | null = null,
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

    return {
      code: 0,
      data: {
        musicid: currentCredential.musicid,
        musickey: currentCredential.musickey,
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
  credential: { musicid: string; musickey: string },
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

    const result = await postRequest(data);
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
export const getMyPlaylists = async (credential: {
  musicid: string;
  musickey: string;
}): Promise<ApiResponse<Playlist[]>> => {
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

    const result = await postRequest(data);
    console.log(
      "[API getMyPlaylists] Raw result:",
      JSON.stringify(result, null, 2),
    );
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
