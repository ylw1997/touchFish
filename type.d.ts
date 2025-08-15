/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-19 14:17:37
 * @LastEditTime: 2025-08-14 18:02:27
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\type.d.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
/**
 * CommandList 命令说明：
 * GETDATA            获取微博数据
 * SENDDATA           发送微博数据到前端
 * GETIMG             获取微博图片
 * SENDIMG            发送微博图片到前端
 * GETCOMMENT         获取微博评论
 * SENDCOMMENT        发送微博评论到前端
 * GETLONGTEXT        获取长微博内容
 * SENDLONGTEXT       发送长微博内容到前端
 * GETUSERBLOG        获取用户微博
 * SENDUSERBLOG       发送用户微博到前端
 * GETFOLLOW          关注用户
 * SENDFOLLOW         关注结果返回
 * GETNEWBLOGRESULT   发布微博
 * SENDNEWBLOGRESULT  发布微博结果返回
 * GETUPLOADIMGURL    上传图片
 * SENDUPLOADIMGURL   上传图片结果返回
 * GETCANCELFOLLOW    取关用户
 * SENDCANCELFOLLOW   取关结果返回
 * GETSETLIKE         点赞微博
 * SENDSETLIKE        点赞结果返回
 * GETCANCELLIKE      取消点赞微博
 * SENDCANCELLIKE     取消点赞结果返回
 * GETCREATECOMMENTS  发表评论
 * SENDCREATECOMMENTS 发表评论结果返回
 * GETCREATEREPOST    转发微博
 * SENDCREATEREPOST   转发结果返回
 * GETSEARCH          搜索微博
 * SENDSEARCH         搜索结果返回
 * GETUSERBYNAME      根据用户名获取用户信息
 * SENDUSERBYNAME     根据用户名获取用户信息结果返回
 * GETHOTSEARCH       获取热搜
 * SENDHOTSEARCH      发送热搜
 */
export type CommandList =
  | "GETDATA"
  | "SENDDATA"
  | "GETIMG"
  | "SENDIMG"
  | "GETCOMMENT"
  | "SENDCOMMENT"
  | "GETLONGTEXT"
  | "SENDLONGTEXT"
  | "GETUSERBLOG"
  | "SENDUSERBLOG"
  | "GETFOLLOW"
  | "SENDFOLLOW"
  | "GETNEWBLOGRESULT"
  | "SENDNEWBLOGRESULT"
  | "GETUPLOADIMGURL"
  | "SENDUPLOADIMGURL"
  | "GETCANCELFOLLOW"
  | "SENDCANCELFOLLOW"
  | "GETSETLIKE"
  | "SENDSETLIKE"
  | "GETCANCELLIKE"
  | "SENDCANCELLIKE"
  | "GETCREATECOMMENTS"
  | "SENDCREATECOMMENTS"
  | "GETCREATEREPOST"
  | "SENDCREATEREPOST"
  | "GETSEARCH"
  | "SENDSEARCH"
  | "GETUSERBYNAME"
  | "SENDUSERBYNAME"
  | "GETHOTSEARCH"
  | "SENDHOTSEARCH"
  | "GETVIDEO"
  | "SENDVIDEO"
  | "SAVE_SCROLL_POSITION"
  | "RESTORE_SCROLL_POSITION";

export type ZhihuCommandList =
  | "ZHIHU_GETDATA"
  | "ZHIHU_SENDDATA"
  | "getZhihuComment"
  | "getZhihuQuestionDetail"
  | "sendZhihuQuestionDetail"
  | "ZHIHU_SAVE_SCROLL_POSITION"
  | "ZHIHU_VOTE_ANSWER"
  | "ZHIHU_SEARCH"
  | "ZHIHU_SEND_SEARCH_RESULTS"
  | "ZHIHU_FOLLOW_QUESTION"
  | "ZHIHU_UNFOLLOW_QUESTION"
  | "ZHIHU_RESTORE_SCROLL_POSITION";

export type ZhihuCommandsType<T> = {
  command: ZhihuCommandList;
  payload: T;
  source?: string;
};

export type commandsType<T> = {
  command: CommandList;
  payload: T;
  source?: string;
};

export interface payloadType extends weiboAJAX {
  source: string;
  msg?: string;
}

export type weiboAJAX = {
  ok: number;
  since_id: number;
  max_id: number;
  total_number: number;
  since_id_str: string;
  max_id_str: string;
  statuses: weiboItem[];
  data: any;
  payload: any;
};

export interface baseWeiboField {
  id: number;
  text: string;
  text_raw: string;
  page_info?: {
    object_type: "video" | "hudongvote" | "live";
    page_pic: Page_pic; // 视频封面
    page_url: string;
    page_title: string;
    content1: string;
    content2: string;
    media_info: {
      format: "mp4";
      stream_url: string; // 视频链接
      stream_url_hd: string; // 高清视频链接
      name: string; // 视频名称
      next_title: string; // 标题
    };
    short_url: string; // 短链接
  };
}

export interface weiboItem extends baseWeiboField {
  id: number;
  text: string;
  text_raw: string;
  isLongText: boolean;
  source?: string;
  pic_ids: string[];
  mblogid: string;
  mblogtype: number; // 微博类型 0:普通微博 1,热门或者广告 2,置顶
  pics?: {
    pid: string;
    size: string;
    url: string;
  }[];
  bid: string; // 微博ID
  pic_infos: {
    [key: string]: {
      pic_id: string;
      type: "pic" | "video";
      largest: {
        url: string;
        height: number;
        width: number;
      };
      large: {
        url: string;
        height: number;
        width: number;
      };
      bmiddle: {
        url: string;
        height: number;
        width: number;
      };
      thumbnail: {
        url: string;
        height: number;
        width: number;
      };
    };
  };
  created_at: string;
  region_name?: string;
  user?: weiboUser;
  comments_count: number; // 评
  reposts_count: number; // 转
  attitudes_count: number; // 赞
  attitudes_status: number;
  pic_num: number;
  comments?: commentsItem[]; // 评论
  followBtnCode?: {
    //  关注按钮
    followcardid: string;
    uid: string;
  };
  retweeted_status?: weiboItem; // 转发微博
}

export type weiboUser = {
  id: number;
  screen_name: string;
  avatar_hd?: string;
  avatar_large?: string;
  following?: boolean;
  followers_count?: number;
  verified_reason?: string;
};

type commentsPicItemImg = {
  url: string;
  width: number;
  height: number;
  croped: boolean;
  cut_type: number;
};

type commentsPicItem = {
  pic_ids?: string[];
  pic_infos: {
    [key: string]: {
      large: commentsPicItemImg;
      bmiddle: commentsPicItemImg;
      thumbnail: commentsPicItemImg;
      woriginal: commentsPicItemImg;
    };
  };
};

export interface commentsItem extends baseWeiboField {
  text: string;
  text_raw: string;
  id: number;
  source: string;
  user?: weiboUser;
  created_at: string;
  like_counts: number;
  comments: commentsItem[];
  url_struct?: commentsPicItem[];
}

export type uploadType = {
  uid: string;
  base64: string;
  name: string;
  type: string;
  size: number;
  originFileObj?: File;
};

export type weiboCommentParams = {
  id: number; // 微博ID
  comment: string; // 评论内容
  pic_id?: string; // 图片ID ""
  is_repost?: number; // 0
  comment_ori?: number; //0
  is_comment?: number; //0
};

export type weiboRepostParams = {
  id: number; // 微博ID
  comment: string; // 转发评论内容
  pic_id?: string; // 图片ID ""
  is_repost?: number; //0
  comment_ori?: number; //0
  is_comment?: number; //0
  visible?: number; //0
  share_id?: string; //""
};

declare global {
  interface Window {
    showImg?: boolean;
  }
}

// 热搜
export interface hotItem {
  flag: number;
  word: string;
  num: number;
}

export interface ZhihuAuthor {
  id: string;
  name: string;
  avatar_url: string;
}

export interface ZhihuQuestion {
  id: string;
  title: string;
}

export interface ZhihuItemData {
  id: string;
  author?: ZhihuAuthor;
  question?: ZhihuQuestion;
  created_time?: number;
  voteup_count?: number;
  comment_count?: number;
  excerpt: string;
  content?: string;
  metrics_area?: string;
  image_area?: string;
  index?: number;
  vote_next_step?: "vote" | "unvote";
  title?: string;
  type: "answer" | "article" | "topic";
}

export interface ZhihuCommentItem {
  content: string;
  created_time: number;
  id: number;
  is_author: boolean;
  like_count: number;
  reply_to_id: number;
  type: number;
  author: {
    avatar_url: string;
    id: number;
    name: string;
    url_token: string;
  };
  comment_tag: {
    type: "ip_info" | "hot";
    text: string;
  }[];
  child_comments: ZhihuCommentItem[];
}

export interface ZhihuHotItem {
  excerpt_area: {
    text: string;
  };
  image_area: {
    url: string;
  };
  link: {
    url: string;
  };
  title_area: {
    text: string;
  };
  metrics_area: {
    text: string;
  };
}

export interface ZhihuSearchItem {
  type: "hot_timing" | "search_result";
  object: ZhihuItemData;
  index: number;
  highlight?: {
    description: string;
    title: string;
  };
}

// 知乎人气问题
export interface ZhihuHotQuestion {
  type: "personalized_question";
  reason: string;
  question: {
    id: string;
    title: string;
    detail?: string;
    excerpt?: string;
    answer_count: number;
    visit_count: number;
    follower_count: number;
    author: {
      id: string;
      name: string;
      avatar_url: string;
    };
  };
}
