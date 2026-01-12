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
