/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:31:27
 * @LastEditTime: 2024-09-18 17:18:11
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\type\type.d.ts
 * @Description: 
 */

// 通用新闻定义
export interface NewsItem {
  title: string,
  image?: string,
  url: string,
  isTop?: boolean;
  [key: string]: unknown;
}

export type NewsCommandType = "itHome.openUrl" | "kkj.openUrl" | "cls.openUrl" | "chiphell.openUrl" | "v2ex.openUrl" | "hupu.openUrl" | "nga.openUrl"|"zhihu.openUrl"