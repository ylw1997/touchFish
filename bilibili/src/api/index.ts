/*
 * @Description: Bilibili API requests
 */

import type { BilibiliRecommendResponse } from "../types/bilibili";
import type { CommandList } from "../../../types/commands";

type RequestFunc = <T = any>(
  command: CommandList,
  payload: any,
  content?: string
) => Promise<T>;

export class BilibiliApi {
  private request: RequestFunc;

  constructor(request: RequestFunc) {
    this.request = request;
  }

  // 获取推荐视频列表
  getRecommend() {
    return this.request<BilibiliRecommendResponse>(
      "BILIBILI_RECOMMEND",
      null,
      "请求推荐视频中..."
    );
  }
}
