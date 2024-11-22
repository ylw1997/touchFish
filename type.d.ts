/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-19 14:17:37
 * @LastEditTime: 2024-11-22 16:43:06
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\type.d.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved. 
 * @Description: 
 */
export type commandsType<T> = {
  command: "GETDATA" | "SENDDATA" | "GETIMG" | "SENDIMG" |"GETCOMMENT"| "SENDCOMMENT" | string,
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
  user: weiboUser;
  comments_count: number; // 评
  reposts_count:number; // 转
  attitudes_count:number; // 赞
  pic_num: number;
  comments:commentsItem[] // 评论
}



export type weiboUser = {
  id: number;
  screen_name: string;
  avatar_hd: string;
  avatar_large: string;
}

export type commentsItem = {
  text: string;
  id:string;
  source:string;
  user: weiboUser;
  comments:commentsItem[]
}