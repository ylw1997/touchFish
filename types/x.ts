// X 相关类型
export interface baseXField {
  id: number;
  text: string;
  text_raw: string;
  page_info?: {
    object_type: "video" | "hudongvote" | "live";
    page_pic: Page_pic;
    page_url: string;
    page_title: string;
    content1: string;
    content2: string;
    media_info: {
      format: "mp4";
      stream_url: string;
      stream_url_hd: string;
      name: string;
      next_title: string;
    };
    short_url: string;
  };
}

// 原文件未定义 Page_pic
 
export type Page_pic = any;

export interface xItem extends baseXField {
  id: number;
  text: string;
  text_raw: string;
  isLongText: boolean;
  longTextContent?: string;
  source: string;
  pic_ids: string[];
  mblogid: string;
  mblogtype: number;
  mix_media_info?: {
    items: {
      type: "video" | "pic";
      id: string;
       
      data: any;
    }[];
  };
  pics?: { pid: string; size: string; url: string }[];
  bid: string;
  pic_infos: {
    [key: string]: {
      pic_id: string;
      type: "pic" | "video";
      video_url?: string;
      largest: { url: string; height: number; width: number };
      large: { url: string; height: number; width: number };
      bmiddle: { url: string; height: number; width: number };
      thumbnail: { url: string; height: number; width: number };
    };
  };
  created_at: string;
  region_name?: string;
  user?: xUser;
  comments_count: number;
  reposts_count: number;
  attitudes_count: number;
  attitudes_status: number;
  pic_num: number;
  comments?: commentsItem[] | "loading";
  followBtnCode?: { followcardid: string; uid: string };
  retweeted_status?: xItem;
}

export interface commentsItem extends baseXField {
  text: string;
  text_raw: string;
  id: number;
  source: string;
  user?: xUser;
  created_at: string;
  like_counts: number;
  comments: commentsItem[];
  url_struct?: commentsPicItem[];
}

interface commentsPicItemImg {
  url: string;
  width: number;
  height: number;
  croped: boolean;
  cut_type: number;
}
interface commentsPicItem {
  pic_ids?: string[];
  pic_infos: {
    [key: string]: {
      large: commentsPicItemImg;
      bmiddle: commentsPicItemImg;
      thumbnail: commentsPicItemImg;
      woriginal: commentsPicItemImg;
    };
  };
}

export interface xUser {
  id: number | string;
  screen_name: string;
  avatar_hd?: string;
  avatar_large?: string;
  following?: boolean;
  followers_count?: number;
  followers_count_str?: string;
  friends_count_str?: string;
  verified_reason?: string;
  descText?: string;
  special_follow?: boolean;
  isOwner?: boolean;
  name?: string;
  screen_name_raw?: string;
}

export interface xAJAX {
  ok: number;
  since_id: number;
  max_id: number;
  total_number: number;
  since_id_str: string;
  max_id_str: string;
  statuses: xItem[];
   
  data: any;
   
  payload: any;
}

export interface payloadType extends xAJAX {
  source: string;
  msg?: string;
}

export interface uploadType {
  uid: string;
  base64: string;
  name: string;
  type: string;
  size: number;
  originFileObj?: File;
}

export interface xCommentParams {
  id: number | string;
  comment: string;
  pic_id?: string;
  is_repost?: number;
  comment_ori?: number;
  is_comment?: number;
}
export interface xRepostParams {
  id: number | string;
  comment: string;
  pic_id?: string;
  is_repost?: number;
  comment_ori?: number;
  is_comment?: number;
  visible?: number;
  share_id?: string;
}

export interface hotItem {
  flag: number;
  word: string;
  num: number;
}

export interface SearchType {
  type: "3" | "60";
  card_type: 10 | 9;
  text: string;
  field: string;
}

export interface UploadImageResponsePayload extends xAJAX {
  uid: string;
  type: string;
  source: string;
}
