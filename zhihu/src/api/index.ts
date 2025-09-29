/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-22 15:00:00
 * @LastEditTime: 2025-09-29 15:53:54
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\api\index.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description: Zhihu API requests
 */

import type { ZhihuCommandList, ZhihuItemData } from "../../../type";

type RequestFunc = <T = any, P = any>(
  command: ZhihuCommandList,
  payload: P,
  content: string
) => Promise<T>;

export class ZhihuApi {
  private request: RequestFunc;

  constructor(request: RequestFunc) {
    this.request = request;
  }

  getZhihuList(payload: any) {
    return this.request<{ data: ZhihuItemData[]; paging?: any }>(
      "ZHIHU_GETDATA",
      payload,
      "请求知乎数据中..."
    );
  }

  getQuestionDetail(payload: { questionId: string; nextUrl?: string }) {
    return this.request<any, { questionId: string; nextUrl?: string }>(
      "getZhihuQuestionDetail",
      payload,
      "获取问题详情中..."
    );
  }

  voteAnswer(answerId: string, type: "up" | "neutral") {
    return this.request("ZHIHU_VOTE_ANSWER", { answerId, type }, "操作中...");
  }

  followQuestion(questionId: string) {
    return this.request("ZHIHU_FOLLOW_QUESTION", questionId, "关注中...");
  }

  unfollowQuestion(questionId: string) {
    return this.request("ZHIHU_UNFOLLOW_QUESTION", questionId, "取消关注中...");
  }

  searchZhihu(keyword: string) {
    return this.request<ZhihuItemData[]>("ZHIHU_SEARCH", keyword, "搜索中...");
  }

  getZhihuComment(answerId: string) {
    return this.request<any>("getZhihuComment", answerId, "获取评论中...");
  }
}