/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 08:49:41
 * @LastEditTime: 2025-11-03 14:50:50
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

  searchNotes(params: { keyword: string; page?: number; search_id?: string }) {
    return this.request<any>('XHS_SEARCH' as CommandList, params, '搜索中...');
  }

  getFeedDetail(payload: {
    source_note_id: string;
    image_formats?: string[];
    extra?: { need_body_topic?: string };
    xsec_source?: string;
    xsec_token: string;
  }) {
    return this.request<any>('XHS_FEED_DETAIL' as CommandList, payload, '加载笔记内容中...');
  }

  getComments(payload: {
    note_id: string;
    cursor?: string;
    top_comment_id?: string;
    image_formats?: string; // "jpg,webp,avif"
    xsec_token: string;
  }) {
    return this.request<any>('XHS_GET_COMMENTS' as CommandList, payload, cursorLabel(payload.cursor));
  }

  // 获取用户已发布笔记列表
  getUserPosted(payload: { user_id: string; cursor: string; xsec_token: string,xsec_source?:string }) {
    const label = payload.cursor ? '加载更多用户笔记...' : '加载用户笔记中...';
    return this.request<any>('XHS_GET_USER_POSTED' as CommandList, payload, label);
  }

  // 获取用户 hover card 详情（头像/昵称/关注粉丝/简介/获赞收藏）
  getUserHoverCard(payload: { target_user_id: string; image_formats?: string; xsec_source?: string; xsec_token: string }) {
    return this.request<any>('XHS_USER_HOVER_CARD' as CommandList, payload, '加载用户信息中...');
  }
}

function cursorLabel(cursor?: string) {
  return cursor ? '加载更多评论...' : '加载评论中...';
}

export const createXhsApi = (request: RequestFunc) => new XhsApi(request);
