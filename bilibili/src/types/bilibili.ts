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
