/**
 * 网易云音乐 API 数据适配层
 */
import type { CommandList } from "../../../types/commands";
import type {
  Song,
  Playlist,
  RankList,
  QRCodeInfo,
  SongQuality,
  UserInfo,
  ApiResponse,
} from "../types/qqmusic";

type RequestFunc = <T = any>(
  command: CommandList,
  payload: any,
  content?: string
) => Promise<T>;

/**
 * 适配器：将网易云 NeteaseSong 转换为前端通用的 Song
 */
function mapNeteaseSongToSong(n: any): Song {
  if (!n) return {} as Song;
  const singerList = n.ar || n.artists || [];
  const albumObj = n.al || n.album;
  return {
    mid: String(n.id),
    id: n.id,
    name: n.name,
    title: n.name,
    singer: singerList.map((a: any) => ({
      id: a.id,
      mid: String(a.id),
      name: a.name,
      type: 0,
    })),
    album: albumObj
      ? {
          id: albumObj.id,
          mid: String(albumObj.id),
          name: albumObj.name,
          pmid: albumObj.picUrl || "",
        }
      : undefined,
    interval: n.dt ? Math.floor(n.dt / 1000) : 0,
    isonly: 0,
    pay: {
      pay_down: 0,
      pay_month: n.fee === 1 ? 1 : 0,
      pay_play: n.fee === 1 ? 1 : 0,
      pay_status: n.fee === 1 ? 1 : 0,
    },
  };
}

/**
 * 适配器：将网易云 NeteasePlaylist 转换为前端通用的 Playlist
 */
function mapNeteasePlaylistToPlaylist(n: any): Playlist {
  if (!n) return {} as Playlist;
  return {
    dissid: n.id,
    dissname: n.name,
    diss_cover: n.coverImgUrl || n.picUrl || "",
    logo: n.coverImgUrl || n.picUrl || "",
    nick: n.creator?.nickname || "",
    songnum: n.trackCount || 0,
    listennum: n.playCount || 0,
    desc: n.description || "",
  };
}

/**
 * 适配器：将网易云榜单 转换为前端通用的 RankList
 */
function mapNeteaseRankToRank(n: any): RankList {
  if (!n) return {} as RankList;
  return {
    id: n.id,
    topId: n.id,
    title: n.name,
    subtitle: n.updateFrequency || "",
    picUrl: n.coverImgUrl || "",
  };
}

export class QQMusicApi {
  private request: RequestFunc;

  constructor(request: RequestFunc) {
    this.request = request;
  }

  // ==================== 搜索 ====================
  // 搜索歌曲
  async searchSongs(keyword: string, page: number = 1, num: number = 20) {
    const result = await this.request<any>(
      "NETEASE_SEARCH" as any,
      { keyword, page, limit: num },
      "搜索歌曲中..."
    );
    const list = result?.result?.songs || [];
    return {
      code: 0,
      data: list.map(mapNeteaseSongToSong),
      message: "success",
    } as ApiResponse<Song[]>;
  }

  // 搜索歌手
  async searchSingers(keyword: string, page: number = 1, num: number = 20) {
    const result = await this.request<any>(
      "NETEASE_SEARCH_SINGERS" as any,
      { keyword, page, limit: num },
      "搜索歌手中..."
    );
    const list = result?.result?.artists || [];
    return {
      code: 0,
      data: list.map((a: any) => ({
        id: a.id,
        mid: String(a.id),
        singer_MID: String(a.id),
        name: a.name,
        singer_name: a.name,
        pic: a.picUrl || "",
        picUrl: a.picUrl || "",
        songNum: a.musicSize || 0,
      })),
      message: "success",
    } as ApiResponse<any[]>;
  }

  // 获取歌手基本信息
  async getSingerInfo(mid: string) {
    const result = await this.request<any>(
      "NETEASE_GET_SINGER_INFO" as any,
      { mid },
      "获取歌手信息中..."
    );
    const artist = result?.data?.artist || {};
    return {
      code: 0,
      data: {
        SingerMid: String(artist.id),
        SingerName: artist.name,
        picUrl: artist.picUrl || "",
        songNum: artist.musicSize || 0,
      },
      message: "success",
    } as ApiResponse<any>;
  }

  // 获取歌手歌曲列表
  async getSingerSongs(mid: string, page: number = 1, num: number = 30) {
    const result = await this.request<any>(
      "NETEASE_GET_SINGER_SONGS" as any,
      { mid, page, num },
      "获取歌手歌曲中..."
    );
    const list = result?.songs || [];
    return {
      code: 0,
      data: list.map(mapNeteaseSongToSong),
      message: "success",
    } as ApiResponse<Song[]>;
  }

  // ==================== 歌曲 ====================
  // 获取歌曲播放链接
  async getSongUrl(mid: string, quality: SongQuality = 128, _credential?: any) {
    void _credential;
    let level: "standard" | "higher" | "exhigh" | "lossless" = "standard";
    if (quality === 320) {
      level = "exhigh";
    } else if (quality === 999) {
      level = "lossless";
    }

    const result = await this.request<any>(
      "NETEASE_GET_SONG_URL" as any,
      { id: mid, level },
      "获取播放链接中..."
    );
    const url = result?.data?.[0]?.url || "";
    return {
      code: 0,
      data: url,
    } as ApiResponse<string>;
  }

  // 获取歌曲详情
  async getSongDetail(mid: string) {
    const result = await this.request<any>(
      "NETEASE_GET_SONG_DETAIL" as any,
      { ids: mid },
      "获取歌曲详情中..."
    );
    const song = result?.songs?.[0];
    return {
      code: 0,
      data: mapNeteaseSongToSong(song),
    } as ApiResponse<Song>;
  }

  // 获取歌曲歌词
  async getLyric(mid: string) {
    const result = await this.request<any>(
      "NETEASE_GET_LYRIC" as any,
      { id: mid },
      "获取歌词中..."
    );
    const lyric = result?.lrc?.lyric || "";
    return {
      code: 0,
      data: lyric,
    } as ApiResponse<string>;
  }

  // ==================== 歌单 ====================
  // 获取推荐歌单
  async getRecommendPlaylists(num: number = 10) {
    const result = await this.request<any>(
      "NETEASE_GET_RECOMMEND_PLAYLISTS" as any,
      { limit: num },
      "获取推荐歌单中..."
    );
    const list = result?.result || [];
    return {
      code: 0,
      data: list.map(mapNeteasePlaylistToPlaylist),
    } as ApiResponse<Playlist[]>;
  }

  // 获取歌单详情
  async getPlaylistDetail(dissid: number, _page: number = 1, _num: number = 30) {
    void _page;
    void _num;
    const result = await this.request<any>(
      "NETEASE_GET_PLAYLIST_DETAIL" as any,
      { id: dissid },
      "获取歌单详情中..."
    );
    const playlist = result?.playlist;
    const songs = playlist?.tracks || [];
    return {
      code: 0,
      data: {
        playlist: mapNeteasePlaylistToPlaylist(playlist),
        songs: songs.map(mapNeteaseSongToSong),
      },
    } as ApiResponse<{ playlist: Playlist; songs: Song[] }>;
  }

  // ==================== 排行榜 ====================
  // 获取排行榜列表
  async getRankLists() {
    const result = await this.request<any>(
      "NETEASE_GET_RANK_LISTS" as any,
      null,
      "获取排行榜中..."
    );
    const list = result?.list || [];
    return {
      code: 0,
      data: list.map(mapNeteaseRankToRank),
    } as ApiResponse<RankList[]>;
  }

  // 获取排行榜详情 (在网易云中，榜单实质上也是歌单详情接口)
  async getRankDetail(topId: number, _page: number = 1, _num: number = 30) {
    void _page;
    void _num;
    const result = await this.request<any>(
      "NETEASE_GET_PLAYLIST_DETAIL" as any,
      { id: topId },
      "获取排行榜详情中..."
    );
    const playlist = result?.playlist;
    const songs = playlist?.tracks || [];
    return {
      code: 0,
      data: {
        rankInfo: mapNeteaseRankToRank(playlist),
        songs: songs.map(mapNeteaseSongToSong),
      },
    } as ApiResponse<{ rankInfo: RankList; songs: Song[] }>;
  }

  // ==================== 登录 ====================
  // 获取登录二维码 (直连版禁用，引导齿轮设置)
  getLoginQR(_type: "qq" | "wx") {
    void _type;
    // 触发后端展示齿轮配置提示
    void this.request("NETEASE_GET_QR_CODE" as any, null);
    return Promise.resolve({
      code: -1,
      data: { data: "", identifier: "", type: "qq" as any },
      message: "直连版暂不支持扫码登录，请点击右上角齿轮设置 Cookie",
    } as ApiResponse<QRCodeInfo>);
  }

  // 检查登录状态
  checkLoginStatus(_identifier: string, _type: "qq" | "wx") {
    void _identifier;
    void _type;
    return Promise.resolve({
      code: 200,
      data: {
        status: "failed",
      },
    } as ApiResponse<{ status: string; userInfo?: UserInfo }>);
  }

  // 使用 Credential 登录 (此处空置)
  loginWithCredential(_credential: { musicid: string; musickey: string }) {
    void _credential;
    return Promise.resolve({
      code: -1,
      data: {} as UserInfo,
      message: "请点击齿轮按钮设置 Cookie",
    } as ApiResponse<UserInfo>);
  }

  // ==================== 用户 ====================
  // 获取用户信息
  async getUserInfo() {
    const result = await this.request<any>(
      "NETEASE_GET_USER_STATUS" as any,
      null,
      "获取用户信息中..."
    );
    return {
      code: result?.code === 0 || result?.code === 200 ? 0 : -1,
      data: result?.data || null,
    } as ApiResponse<UserInfo>;
  }

  // 获取我喜欢的歌曲 (适配为真正的网易云喜欢歌单详情)
  async getMyFavoritePlaylist() {
    try {
      // 1. 先拉取所有歌单
      const playlistRes = await this.getMyPlaylists();
      if (playlistRes.code !== 0 || !playlistRes.data || playlistRes.data.length === 0) {
        return {
          code: 0,
          data: { songs: [], total: 0 },
        } as ApiResponse<{ songs: Song[]; total: number }>;
      }

      // 2. 第一个歌单通常就是“我喜欢的音乐”歌单
      const favoritePlaylist = playlistRes.data[0];
      const playlistId = favoritePlaylist.dissid;

      // 3. 拉取该歌单详情
      const result = await this.request<any>(
        "NETEASE_GET_PLAYLIST_DETAIL" as any,
        { id: playlistId },
        "获取喜欢音乐列表中..."
      );
      const tracks = result?.playlist?.tracks || [];
      return {
        code: 0,
        data: {
          songs: tracks.map(mapNeteaseSongToSong),
          total: tracks.length,
        },
      } as ApiResponse<{ songs: Song[]; total: number }>;
    } catch {
      return {
        code: 0,
        data: { songs: [], total: 0 },
      } as ApiResponse<{ songs: Song[]; total: number }>;
    }
  }

  // 获取我的歌单列表 (登录后)
  async getMyPlaylists() {
    // 1. 先拿取用户信息获得 uid
    const userRes = await this.getUserInfo();
    const uid = userRes?.data?.musicid;
    if (!uid) {
      return {
        code: 0,
        data: [],
      } as ApiResponse<Playlist[]>;
    }

    // 2. 根据 uid 拉取歌单
    const result = await this.request<any>(
      "NETEASE_GET_USER_PLAYLISTS" as any,
      { uid },
      "获取我的歌单中..."
    );
    const list = result?.playlist || [];
    return {
      code: 0,
      data: list.map(mapNeteasePlaylistToPlaylist),
    } as ApiResponse<Playlist[]>;
  }

  // 喜欢/取消喜欢歌曲
  async likeSong(id: number | string, like: boolean) {
    const res = await this.request<any>(
      "NETEASE_LIKE_SONG" as any,
      { id, like },
      like ? "添加喜欢中..." : "取消喜欢中..."
    );
    // 兼容网易云的 200 成功状态，转换为组件层期望的 0
    if (res && res.code === 200) {
      return { code: 0, message: "success", originalCode: 200 };
    }
    return res;
  }

  // 获取喜欢的歌曲 ID 列表
  async getLikedSongIds() {
    return this.request<any>(
      "NETEASE_GET_LIKED_SONG_IDS" as any,
      null,
      "获取喜欢歌曲ID列表中..."
    );
  }

  // 获取每日推荐歌曲
  async getDailyRecommendSongs() {
    try {
      const result = await this.request<any>(
        "NETEASE_GET_DAILY_RECOMMEND" as any,
        null,
        "获取每日推荐中..."
      );
      const list = result?.data?.dailySongs || [];
      return {
        code: 0,
        data: {
          songs: list.map(mapNeteaseSongToSong),
          total: list.length,
        },
      } as ApiResponse<{ songs: Song[]; total: number }>;
    } catch {
      return {
        code: 0,
        data: { songs: [], total: 0 },
      } as ApiResponse<{ songs: Song[]; total: number }>;
    }
  }

  // 获取私人FM歌曲 (适配为猜你喜欢)
  async getPersonalFM() {
    try {
      const result = await this.request<any>(
        "NETEASE_GET_PERSONAL_FM" as any,
        null,
        "获取私人FM中..."
      );
      const list = result?.data || [];
      return {
        code: 0,
        data: {
          songs: list.map(mapNeteaseSongToSong),
          total: list.length,
        },
      } as ApiResponse<{ songs: Song[]; total: number }>;
    } catch {
      return {
        code: 0,
        data: { songs: [], total: 0 },
      } as ApiResponse<{ songs: Song[]; total: number }>;
    }
  }
}
