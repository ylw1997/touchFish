/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:31:27
 * @LastEditTime: 2022-05-20 15:13:07
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\type\type.d.ts
 * @Description: 
 */
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

export interface kkjNewsItem {
  "title": string,
  "url": string,
  "time": string,
}