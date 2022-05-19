/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:31:27
 * @LastEditTime: 2022-05-18 15:33:05
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\type.d.ts
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