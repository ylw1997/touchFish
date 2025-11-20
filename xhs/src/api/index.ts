/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 08:49:41
 * @LastEditTime: 2025-11-05 11:00:00
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\api\index.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 小红书 API 封装，提供完整的类型定义
 */
import type { CommandList } from '../../../types/commands';
import type {
  XhsFeedRawResponse,
  XhsSearchParams,
  XhsSearchResponse,
  XhsFeedDetailParams,
  XhsFeedDetailResponse,
  XhsCommentsResponseData,
  XhsUserPostedParams,
  XhsUserPostedResponse,
  XhsUserHoverCardParams,
  XhsUserHoverCardResponse,
  XhsFollowParams,
  XhsFollowResponse,
  XhsUnfollowParams,
  XhsUnfollowResponse,
  XhsSubCommentsResponseData,
  XhsLikeNoteParams,
  XhsLikeNoteResponse,
  XhsDislikeNoteParams,
  XhsDislikeNoteResponse,
  XhsCollectNoteParams,
  XhsCollectNoteResponse,
  XhsUncollectNoteParams,
  XhsUncollectNoteResponse,
} from '../../../types/xhs';

type RequestFunc = <T = any>(command: CommandList, payload: any, content?: string) => Promise<T>;

export class XhsApi {
  constructor(private request: RequestFunc) {}

  /**
   * 获取首页推荐Feed
   */
  getHomeFeed(params: { cursor?: string }) {
    return this.request<XhsFeedRawResponse>(
      'XHS_GET_HOME_FEED' as CommandList,
      params,
      '加载首页推荐中...'
    );
  }

  /**
   * 搜索笔记
   */
  searchNotes(params: XhsSearchParams) {
    return this.request<XhsSearchResponse>(
      'XHS_SEARCH' as CommandList,
      params,
      '搜索中...'
    );
  }

  /**
   * 获取笔记详情
   */
  getFeedDetail(payload: XhsFeedDetailParams) {
    return this.request<XhsFeedDetailResponse>(
      'XHS_FEED_DETAIL' as CommandList,
      payload,
      '加载笔记内容中...'
    );
  }

  /**
   * 获取笔记评论
   */
  getComments(payload: {
    note_id: string;
    cursor?: string;
    top_comment_id?: string;
    image_formats?: string;
    xsec_token: string;
  }) {
    return this.request<XhsCommentsResponseData>(
      'XHS_GET_COMMENTS' as CommandList,
      payload,
      cursorLabel(payload.cursor)
    );
  }

  /**
   * 获取根评论的子评论
   */
  getSubComments(payload: {
    note_id: string;
    root_comment_id: string;
    cursor?: string;
    xsec_token: string;
    num?: number;
  }) {
    const label = payload.cursor ? '加载更多子评论...' : '加载子评论中...';
    return this.request<XhsSubCommentsResponseData>(
      'XHS_GET_SUB_COMMENTS' as CommandList,
      payload,
      label
    );
  }

  /**
   * 获取用户已发布笔记列表
   */
  getUserPosted(payload: XhsUserPostedParams) {
    const label = payload.cursor ? '加载更多用户笔记...' : '加载用户笔记中...';
    return this.request<XhsUserPostedResponse>(
      'XHS_GET_USER_POSTED' as CommandList,
      payload,
      label
    );
  }

  /**
   * 获取用户hover card详情
   * @returns 用户头像/昵称/关注粉丝/简介/获赞收藏等信息
   */
  getUserHoverCard(payload: XhsUserHoverCardParams) {
    return this.request<XhsUserHoverCardResponse>(
      'XHS_USER_HOVER_CARD' as CommandList,
      payload,
      '加载用户信息中...'
    );
  }

  /**
   * 关注用户
   */
  followUser(payload: XhsFollowParams) {
    return this.request<XhsFollowResponse>(
      'XHS_USER_FOLLOW' as CommandList,
      payload,
      '关注中...'
    );
  }

  /**
   * 取消关注用户
   */
  unfollowUser(payload: XhsUnfollowParams) {
    return this.request<XhsUnfollowResponse>(
      'XHS_USER_UNFOLLOW' as CommandList,
      payload,
      '取消关注中...'
    );
  }

  /** 点赞笔记 */
  likeNote(payload: XhsLikeNoteParams) {
    return this.request<XhsLikeNoteResponse>(
      'XHS_NOTE_LIKE' as CommandList,
      payload,
      '点赞中...'
    );
  }

  /** 取消点赞 */
  dislikeNote(payload: XhsDislikeNoteParams) {
    return this.request<XhsDislikeNoteResponse>(
      'XHS_NOTE_DISLIKE' as CommandList,
      payload,
      '取消点赞中...'
    );
  }

  /** 收藏笔记 */
  collectNote(payload: XhsCollectNoteParams) {
    return this.request<XhsCollectNoteResponse>(
      'XHS_NOTE_COLLECT' as CommandList,
      payload,
      '收藏中...'
    );
  }

  /** 取消收藏 */
  uncollectNote(payload: XhsUncollectNoteParams) {
    return this.request<XhsUncollectNoteResponse>(
      'XHS_NOTE_UNCOLLECT' as CommandList,
      payload,
      '取消收藏中...'
    );
  }
}

function cursorLabel(cursor?: string) {
  return cursor ? '加载更多评论...' : '加载评论中...';
}

export const createXhsApi = (request: RequestFunc) => new XhsApi(request);
