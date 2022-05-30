/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:31:27
 * @LastEditTime: 2022-05-30 09:17:45
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\type\type.d.ts
 * @Description: 
 */

// it之家新闻定义
export interface NewsItem {
  "forbidcomment": boolean,
  "kwdlist": string[],
  "newsid": number,
  "title": string,
  "postdate": string,
  "orderdate": string,
  "description": string,
  "image": string,
  "hitcount": number,
  "commentcount": number,
  "hidecount": boolean,
  "cid": number,
  "nd": number,
  "sid": number,
  "url": string
}
// 快科技新闻定义
export interface kkjNewsItem {
  "title": string,
  "url": string,
  "time": string,
  isTop: boolean;
}
// 财联社新闻定义
export interface clsNewsItem {
  title: string;
  time: string;
  content: string;
  id:string;
}

// chiphell 新闻定义
export interface chiphellNewsItem {
  title: string;
  url: string;
}