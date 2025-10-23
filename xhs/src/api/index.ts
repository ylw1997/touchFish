/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 08:49:41
 * @LastEditTime: 2025-10-23 13:38:38
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\api\index.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
/*
 * XHS API 封装：提供与 WeiboApi 类似的调用方式，保留旧的 fetchFeed 兼容。
 */
import type { CommandList, XhsFeedRawResponse } from '../../../type';

type RequestFunc = <T = any>(command: CommandList, payload: any, content?: string) => Promise<T>;

export class XhsApi {
  constructor(private request: RequestFunc) {}

  getHomeFeed(params: { cursor?: string }) {
    return this.request<XhsFeedRawResponse>('XHS_GET_HOME_FEED' as CommandList, params, '加载首页推荐中...');
  }

  searchNotes(params: { keyword: string; page?: number }) {
    return this.request<any>('XHS_SEARCH' as CommandList, params, '搜索中...');
  }

  getFeedDetail(payload: {
    source_note_id: string;
    image_formats?: string[];
    extra?: { need_body_topic?: string };
    xsec_source?: string;
    xsec_token?: string;
  }) {
    return this.request<any>('XHS_FEED_DETAIL' as CommandList, payload, '加载笔记内容中...');
  }
}


export const createXhsApi = (request: RequestFunc) => new XhsApi(request);
