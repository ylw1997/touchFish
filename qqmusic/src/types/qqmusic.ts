/**
 * QQ音乐类型定义
 */

// 歌曲信息
export interface Song {
  mid: string;
  id?: number;
  name: string;
  title?: string;
  singer: Singer[];
  album?: {
    id: number;
    mid: string;
    name: string;
    pmid?: string;
    time_public?: string;
  };
  file?: {
    size_128mp3?: number;
    size_320mp3?: number;
    size_flac?: number;
    size_try?: number;
    try_begin?: number;
    try_end?: number;
  };
  interval?: number;
  isonly?: number;
  pay?: {
    pay_down: number;
    pay_month: number;
    pay_play: number;
    pay_status: number;
  };
  mv?: {
    id: number;
    vid: string;
    name: string;
  };
  lyric?: string;
}

// 歌手信息
export interface Singer {
  id: number;
  mid: string;
  name: string;
  title?: string;
  type: number;
}

// 歌单信息
export interface Playlist {
  dissid: number;
  dirid?: number;
  dissname: string;
  diss_cover?: string;
  logo: string;
  nick?: string;
  songnum: number;
  listennum?: number;
  desc?: string;
}

// 排行榜信息
export interface RankList {
  id: number;
  title: string;
  subtitle?: string;
  picUrl?: string;
  topId: number;
  update_key?: string;
}

// 用户信息
export interface UserInfo {
  musicid: string;
  musickey: string;
  refresh_key?: string;
  refresh_token?: string;
  openid?: string;
  unionid?: string;
  nickname?: string;
  avatar?: string;
  vip?: boolean;
}

// 播放模式
export type PlayMode = "order" | "random" | "single";

// 音质类型
export enum SongQuality {
  STANDARD = 128, // 标准 128k MP3
  HIGH = 320, // 高品质 320k MP3
  LOSSLESS = 999, // 无损 FLAC
}

// 登录类型
export enum LoginType {
  QQ = "qq",
  WX = "wx",
}

// QR 码信息
export interface QRCodeInfo {
  data: string; // base64 图片数据
  identifier: string; // 用于轮询的标识
  type: LoginType;
}

// 登录状态
export enum LoginStatus {
  PENDING = "pending",
  SCANNING = "scanning",
  CONFIRMING = "confirming",
  SUCCESS = "success",
  FAILED = "failed",
  TIMEOUT = "timeout",
}

// API 响应
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message?: string;
}

// 搜索类型
export enum SearchType {
  SONG = 0,
  SINGER = 1,
  ALBUM = 2,
  SONGLIST = 3,
}

// Tab 类型
export type TabType = "recommend" | "rank" | "my" | "search";
