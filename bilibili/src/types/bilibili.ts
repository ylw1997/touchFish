/*
 * @Description: Bilibili 数据类型定义
 */

// 视频作者信息
export interface BilibiliOwner {
  mid: number;
  name: string;
  face: string;
}

// 视频统计信息
export interface BilibiliStat {
  view: number;
  like: number;
  danmaku: number;
  vt?: number;
}

// 推荐理由
export interface RcmdReason {
  reason_type: number;
}

// 视频项
export interface BilibiliVideoItem {
  id: number;
  bvid: string;
  cid: number;
  goto: string;
  uri: string;
  pic: string;
  pic_4_3?: string;
  title: string;
  duration: number;
  pubdate: number;
  owner: BilibiliOwner;
  stat: BilibiliStat;
  av_feature: any;
  is_followed: number;
  rcmd_reason?: RcmdReason;
  show_info: number;
  track_id: string;
  pos: number;
  room_info: any;
  ogv_info: any;
  business_info: any;
  is_stock: number;
  enable_vt: number;
  vt_display: string;
  dislike_switch: number;
  dislike_switch_pc: number;
}

// 推荐接口响应
export interface BilibiliRecommendResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    item: BilibiliVideoItem[];
    business_card?: any;
    floor_info?: any;
    user_feature?: any;
    preload_expose_pct?: number;
    preload_floor_expose_pct?: number;
    mid?: number;
  };
}

// ============== 热门 API 类型 ==============

// 热门视频项 (与推荐类似但字段略有不同)
export interface PopularVideoItem {
  aid: number;
  bvid: string;
  cid: number;
  pic: string;
  title: string;
  duration: number;
  pubdate: number;
  owner: BilibiliOwner;
  stat: {
    view: number;
    like: number;
    danmaku: number;
  };
  rcmd_reason?: {
    content?: string;
  };
}

// 热门接口响应
export interface BilibiliPopularResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    list: PopularVideoItem[];
    no_more: boolean;
  };
}

// ============== 直播 API 类型 ==============

// 直播房间信息 (room/v3/area/getRoomList 接口)
export interface LiveRoomItem {
  roomid: number;
  uid: number;
  title: string;
  uname: string;
  face: string;
  cover: string;
  user_cover: string;
  system_cover: string;
  online: number;
  link: string;
  area_name: string;
}

// 直播接口响应
export interface BilibiliLiveResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    list: LiveRoomItem[];
    count: number;
  };
}

// 统一的列表项类型（用于渲染）
export interface BilibiliListItem {
  id: number;
  bvid: string;
  cid: number;
  uri: string;
  pic: string;
  title: string;
  duration: number;
  pubdate: number;
  owner: BilibiliOwner;
  stat: BilibiliStat;
  is_followed: number;
  rcmd_reason?: RcmdReason;
  // 动态相关
  pub_time?: string; // "11分钟前"
  // 收藏夹相关
  is_folder?: boolean;
  media_count?: number;
}

// ============== 动态 API 类型 ==============

// 动态作者信息
export interface DynamicAuthor {
  mid: number;
  name: string;
  face: string;
  following: boolean;
  pub_time: string;
  pub_ts: number;
}

// 动态视频 archive 信息
export interface DynamicArchive {
  aid: string;
  bvid: string;
  cover: string;
  title: string;
  duration_text: string;
  jump_url: string;
  stat: {
    danmaku: string;
    play: string;
  };
}

// 动态项
export interface DynamicItem {
  id_str: string;
  modules: {
    module_author: DynamicAuthor;
    module_dynamic: {
      major?: {
        archive?: DynamicArchive;
        type: string;
      };
    };
    module_stat: {
      comment: { count: number };
      forward: { count: number };
      like: { count: number; status: boolean };
    };
  };
  type: string;
  visible: boolean;
}

// 动态接口响应
export interface BilibiliDynamicResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    has_more: boolean;
    items: DynamicItem[];
    offset: string;
    update_baseline: string;
    update_num: number;
  };
}

// ============== 待看 API 类型 ==============

// 待看视频项
export interface WatchLaterItem {
  aid: number;
  bvid: string;
  cid: number;
  pic: string;
  title: string;
  duration: number;
  pubdate: number;
  owner: BilibiliOwner;
  stat: {
    view: number;
    danmaku: number;
    like: number;
  };
  uri: string;
  viewed: boolean;
  add_at: number;
}

// 待看接口响应
export interface BilibiliWatchLaterResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    count: number;
    list: WatchLaterItem[];
  };
}

// ============== 收藏夹 API 类型 ==============

// 收藏夹项
export interface FavoriteFolderItem {
  id: number;
  fid: number;
  mid: number;
  attr: number;
  title: string;
  fav_state: number;
  media_count: number;
}

// 收藏夹列表响应
export interface BilibiliFavoriteFoldersResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    count: number;
    list: FavoriteFolderItem[];
  };
}

// 收藏夹内视频项
export interface FavoriteMediaItem {
  id: number;
  type: number;
  title: string;
  cover: string;
  intro: string;
  page: number;
  duration: number;
  upper: {
    mid: number;
    name: string;
    face: string;
  };
  cnt_info: {
    collect: number;
    play: number;
    danmaku: number;
  };
  link: string;
  ctime: number;
  pubtime: number;
  fav_time: number;
  bvid: string;
}

// 收藏夹详情响应
export interface BilibiliFavoriteDetailResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    info: {
      id: number;
      title: string;
      cover: string;
      media_count: number;
    };
    medias: FavoriteMediaItem[] | null;
    has_more: boolean;
  };
}

// ============== 视频播放链接 API 类型 ==============

// 视频播放链接响应
export interface BilibiliPlayUrlResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    from: string;
    result: string;
    quality: number;
    format: string;
    timelength: number;
    durl: {
      order: number;
      length: number;
      size: number;
      url: string;
      backup_url: string[] | null;
    }[];
    support_formats: {
      quality: number;
      format: string;
      new_description: string;
      display_desc: string;
    }[];
  } | null;
}

// 移除待看响应
export interface BilibiliWatchLaterDelResponse {
  code: number;
  message: string;
  ttl: number;
}

// Artplayer 弹幕项
export interface ArtplayerDanmakuItem {
  text: string;
  time: number;
  color: string;
  border: boolean;
  mode: 0 | 1 | 2;
}

// 弹幕响应
export interface BilibiliDanmakuResponse {
  code: number;
  data: string; // XML string
}

// ============== 搜索 API 类型 ==============

// 搜索视频项
export interface BilibiliSearchVideoItem {
  type: string;
  id: number;
  author: string;
  mid: number;
  typeid: string;
  typename: string;
  arcurl: string;
  aid: number;
  bvid: string;
  title: string;
  description: string;
  pic: string;
  play: number;
  video_review: number;
  favorites: number;
  tag: string;
  review: number;
  pubdate: number;
  senddate: number;
  duration: string;
  like: number;
  upic: string;
  danmaku: number;
}

// 搜索用户项
export interface BilibiliSearchUserItem {
  type: string;
  mid: number;
  uname: string;
  usign: string;
  upic: string;
  videos: number;
  fans: number;
  verify_info: string;
  level: number;
  gender: number;
  is_up: boolean;
  is_live: number;
  room_id: number;
  res: any[];
  official_verify: {
    type: number;
    desc: string;
  };
}

// 搜索结果项
export interface BilibiliSearchResultItem {
  result_type: string;
  data: BilibiliSearchVideoItem[] | BilibiliSearchUserItem[];
}

// 搜索响应
export interface BilibiliSearchResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    seid: string;
    page: number;
    pagesize: number;
    numResults: number;
    numPages: number;
    result: BilibiliSearchResultItem[];
  } | null;
}

// ============== 用户视频列表 API 类型 ==============

// 用户视频项
export interface UserVideoArchive {
  aid: number;
  title: string;
  pubdate: number;
  ctime: number;
  state: number;
  pic: string;
  duration: number;
  stat: {
    view: number;
  };
  bvid: string;
  ugc_pay: number;
  interactive_video: boolean;
  enable_vt: number;
  vt_display: string;
  playback_position: number;
  desc: string;
  upMid: number;
}

// 用户视频列表响应
export interface BilibiliUserVideosResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    archives: UserVideoArchive[];
    page: {
      num: number;
      size: number;
      total: number;
    };
  } | null;
}

// ============== 用户卡片 API 类型 ==============

// 用户卡片信息
export interface BilibiliUserCard {
  mid: string;
  name: string;
  sex: string;
  face: string;
  fans: number;
  attention: number;
  sign: string;
  level_info: {
    current_level: number;
  };
  Official?: {
    role: number;
    title: string;
    desc: string;
    type: number;
  };
  vip?: {
    type: number;
    status: number;
  };
}

// 用户卡片响应
export interface BilibiliUserCardResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    card: BilibiliUserCard;
    following: boolean;
    archive_count: number;
    article_count: number;
    follower: number;
    like_num: number;
  } | null;
}
