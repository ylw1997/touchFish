/*
 * XHS API 封装：提供与 WeiboApi 类似的调用方式，保留旧的 fetchFeed 兼容。
 */
import { messageHandler } from '../utils/messageHandler';
import type { CommandList, XhsFeedRawResponse } from '../../../type';

type RequestFunc = <T = any>(command: CommandList, payload: any, content?: string) => Promise<T>;

export class XhsApi {
  constructor(private request: RequestFunc) {}

  getFeed(cursor?: string) {
    return this.request<XhsFeedRawResponse>('XHS_GETDATA' as CommandList, { cursor }, '加载小红书数据中...');
  }

  getHomeFeed(params: { cursor?: string }) {
    return this.request<XhsFeedRawResponse>('XHS_GET_HOME_FEED' as CommandList, params, '加载首页推荐中...');
  }

  searchNotes(params: { keyword: string; page?: number }) {
    return this.request<any>('XHS_SEARCH' as CommandList, params, '搜索中...');
  }

  getNoteDetail(id: string) {
    return this.request<any>('XHS_NOTE_DETAIL' as CommandList, id, '获取笔记详情中...');
  }
}

// 旧函数保留，内部改用 messageHandler
export async function fetchFeed(cursor: string): Promise<XhsFeedRawResponse> {
  const res = await messageHandler.send('XHS_GETDATA', { cursor });
  return (res || {}) as XhsFeedRawResponse;
}

export const createXhsApi = (request: RequestFunc) => new XhsApi(request);
