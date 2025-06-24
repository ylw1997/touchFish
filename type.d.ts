/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-19 14:17:37
 * @LastEditTime: 2025-06-24 14:22:31
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\type.d.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved. 
 * @Description: 
 */
/**
 * CommandList 命令说明：
 * GETDATA           获取微博数据
 * SENDDATA          发送微博数据到前端
 * GETIMG            获取微博图片
 * SENDIMG           发送微博图片到前端
 * GETCOMMENT        获取微博评论
 * SENDCOMMENT       发送微博评论数据到前端
 * GETLONGTEXT       获取长文本内容
 * SENDLONGTEXT      发送长文本数据到前端
 * GETUSERBLOG       获取用户微博
 * SENDUSERBLOG      发送用户微博数据到前端
 * GETFOLLOW         获取关注状态
 * SENDFOLLOW        发送关注状态到前端
 * GETNEWBLOGRESULT  获取新发微博结果
 * SENTNEWBLOGRESULT 发送新发微博结果到前端
 * GETUPLOADIMGURL   获取图片上传URL
 * SENDUPLOADIMGURL  发送图片上传URL到前端
 * GETCANCELFOLLOW   获取取消关注状态
 * SENDCANCELFOLLOW  发送取消关注状态到前端
 * GETSETLIKE        获取设置点赞状态
 * SENDSETLIKE       发送设置点赞状态到前端
 * GETCANCELLIKE     获取取消点赞状态
 * SENDCANCELLIKE    发送取消点赞状态到前端
 * GETCREATECOMMENTS 获取创建评论结果
 * SENDCREATECOMMENTS 发送创建评论结果到前端
 */
// GETDATA 获取数据 SENDDDATA 发送数据 GETIMG 获取图片 SENDIMG 发送图片 
export type CommandList = "GETDATA" | "SENDDATA" | "GETIMG" | "SENDIMG" |"GETCOMMENT"| "SENDCOMMENT" | "GETLONGTEXT" | "SENDLONGTEXT" | "GETUSERBLOG"| "SENDUSERBLOG"|'GETFOLLOW'|'SENDFOLLOW'|'GETNEWBLOGRESULT'|'SENTNEWBLOGRESULT'|'GETUPLOADIMGURL'|'SENDUPLOADIMGURL'|'GETCANCELFOLLOW'|'SENDCANCELFOLLOW'|'GETSETLIKE'|'SENDSETLIKE'|'GETCANCELLIKE'|'SENDCANCELLIKE'|'GETCREATECOMMENTS'|'SENDCREATECOMMENTS';

export type commandsType<T> = {
  command: CommandList,
  payload: T
};

export type weiboAJAX = {
  ok: number,
  since_id: number,
  max_id: number,
  total_number: number,
  since_id_str: string,
  max_id_str: string,
  statuses: weiboItem[]
  data:any
}

export type weiboItem = {
  id: number;
  text: string;
  text_raw: string;
  source?: string;
  pic_ids: string[];
  mblogid: string;
  pic_infos: {
    [key: string]: {
      pic_id: string;
      type: "pic" | "video";
      largest: {
        url: string;
        height: number;
        width: number;
      },
      large: {
        url: string;
        height: number;
        width: number;
      },
      bmiddle: {
        url: string;
        height: number
        width: number
      },
      thumbnail:{
        url: string;
        height: number;
        width: number
      }
    }
  };
  created_at: string;
  region_name?: string;
  user?: weiboUser;
  comments_count: number; // 评
  reposts_count:number; // 转
  attitudes_count:number; // 赞
  pic_num: number;
  comments?:commentsItem[] // 评论
  followBtnCode?:{ //  关注按钮
    followcardid:string;
    uid:string;
  }
  retweeted_status?:weiboItem // 转发微博
}



export type weiboUser = {
  id: number;
  screen_name: string;
  avatar_hd?: string;
  avatar_large?: string;
  following?:boolean
}

export type commentsItem = {
  text: string;
  id:string;
  source:string;
  user?: weiboUser;
  created_at:string;
  like_counts:number;
  comments:commentsItem[]
}

export type uploadType = {
  uid:string;
  base64: string;
  name: string;
  type: string;
  size: number;
  originFileObj?: File;
}