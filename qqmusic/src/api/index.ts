/**
 * QQ音乐 API 封装
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
import { SearchType } from "../types/qqmusic";

type RequestFunc = <T = any>(
  command: CommandList,
  payload: any,
  content?: string
) => Promise<T>;

export class QQMusicApi {
  private request: RequestFunc;

  constructor(request: RequestFunc) {
    this.request = request;
  }

  // ==================== 搜索 ====================
  // 搜索歌曲
  searchSongs(keyword: string, page: number = 1, num: number = 20) {
    return this.request<ApiResponse<Song[]>>(
      "QQMUSIC_SEARCH",
      { keyword, page, num, searchType: SearchType.SONG },
      "搜索歌曲中..."
    );
  }

  // 搜索歌手
  searchSingers(keyword: string, page: number = 1, num: number = 20) {
    return this.request<ApiResponse<any[]>>(
      "QQMUSIC_SEARCH_SINGER",
      { keyword, page, num, searchType: SearchType.SINGER },
      "搜索歌手中..."
    );
  }

  // ==================== 歌曲 ====================
  // 获取歌曲播放链接
  getSongUrl(mid: string, quality: SongQuality = 128, credential?: any) {
    return this.request<ApiResponse<string>>(
      "QQMUSIC_GET_SONG_URL",
      { mid, quality, credential },
      "获取播放链接中..."
    );
  }

  // 获取歌曲详情
  getSongDetail(mid: string) {
    return this.request<ApiResponse<Song>>(
      "QQMUSIC_GET_SONG_DETAIL",
      { mid },
      "获取歌曲详情中..."
    );
  }

  // 获取歌曲歌词
  getLyric(mid: string) {
    return this.request<ApiResponse<string>>(
      "QQMUSIC_GET_LYRIC",
      { mid },
      "获取歌词中..."
    );
  }

  // ==================== 歌单 ====================
  // 获取推荐歌单
  getRecommendPlaylists(num: number = 10) {
    return this.request<ApiResponse<Playlist[]>>(
      "QQMUSIC_GET_RECOMMEND_PLAYLISTS",
      { num },
      "获取推荐歌单中..."
    );
  }

  // 获取歌单详情
  getPlaylistDetail(dissid: number, page: number = 1, num: number = 30) {
    return this.request<ApiResponse<{ playlist: Playlist; songs: Song[] }>>(
      "QQMUSIC_GET_PLAYLIST_DETAIL",
      { dissid, page, num },
      "获取歌单详情中..."
    );
  }

  // ==================== 排行榜 ====================
  // 获取排行榜列表
  getRankLists() {
    return this.request<ApiResponse<RankList[]>>(
      "QQMUSIC_GET_RANK_LISTS",
      null,
      "获取排行榜中..."
    );
  }

  // 获取排行榜详情
  getRankDetail(topId: number, page: number = 1, num: number = 30) {
    return this.request<ApiResponse<{ rankInfo: RankList; songs: Song[] }>>(
      "QQMUSIC_GET_RANK_DETAIL",
      { topId, page, num },
      "获取排行榜详情中..."
    );
  }

  // ==================== 登录 ====================
  // 获取登录二维码
  getLoginQR(type: "qq" | "wx") {
    return this.request<ApiResponse<QRCodeInfo>>(
      "QQMUSIC_GET_LOGIN_QR",
      { type },
      "获取登录二维码中..."
    );
  }

  // 检查登录状态
  checkLoginStatus(identifier: string, type: "qq" | "wx") {
    return this.request<ApiResponse<{
      status: string;
      userInfo?: UserInfo;
    }>>(
      "QQMUSIC_CHECK_LOGIN_STATUS",
      { identifier, type },
      "检查登录状态中..."
    );
  }

  // 使用 Credential 登录
  loginWithCredential(credential: { musicid: string; musickey: string }) {
    return this.request<ApiResponse<UserInfo>>(
      "QQMUSIC_LOGIN_WITH_CREDENTIAL",
      credential,
      "登录中..."
    );
  }

  // ==================== 用户 ====================
  // 获取用户信息
  getUserInfo() {
    return this.request<ApiResponse<UserInfo>>(
      "QQMUSIC_GET_USER_INFO",
      null,
      "获取用户信息中..."
    );
  }

  // 获取我喜欢的歌单
  getMyFavoritePlaylist() {
    return this.request<ApiResponse<{ songs: Song[]; total: number }>>(
      "QQMUSIC_GET_MY_FAVORITE",
      null,
      "获取我喜欢的歌曲中..."
    );
  }

  // 获取我的歌单列表
  getMyPlaylists() {
    return this.request<ApiResponse<Playlist[]>>(
      "QQMUSIC_GET_MY_PLAYLISTS",
      null,
      "获取我的歌单中..."
    );
  }
}
