/*
 * @Description: Bilibili API requests
 */

import type {
  BilibiliRecommendResponse,
  BilibiliDynamicResponse,
  BilibiliWatchLaterResponse,
  BilibiliFavoriteFoldersResponse,
  BilibiliFavoriteDetailResponse,
  BilibiliPlayUrlResponse,
  BilibiliWatchLaterDelResponse,
  BilibiliDanmakuResponse,
} from "../types/bilibili";
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

  // 获取动态列表
  getDynamic(page: number = 1, offset?: string) {
    return this.request<BilibiliDynamicResponse>(
      "BILIBILI_DYNAMIC",
      { page, offset },
      "请求动态中..."
    );
  }

  // 获取待看列表
  getWatchLater(page: number = 1, pageSize: number = 20) {
    return this.request<BilibiliWatchLaterResponse>(
      "BILIBILI_WATCHLATER",
      { page, pageSize },
      "请求待看列表中..."
    );
  }

  // 获取收藏夹列表
  getFavoriteFolders() {
    return this.request<BilibiliFavoriteFoldersResponse>(
      "BILIBILI_FAVORITE_FOLDERS",
      null,
      "请求收藏夹列表中..."
    );
  }

  // 获取收藏夹详情（视频列表）
  getFavoriteDetail(mediaId: number, page: number = 1, pageSize: number = 20) {
    return this.request<BilibiliFavoriteDetailResponse>(
      "BILIBILI_FAVORITE_DETAIL",
      { mediaId, page, pageSize },
      "请求收藏夹视频中..."
    );
  }

  // 加入待看
  addToWatchLater(bvid: string) {
    return this.request<{ code: number; message: string }>(
      "BILIBILI_ADD_TO_WATCHLATER",
      { bvid },
      "加入待看中..."
    );
  }

  // 获取视频播放链接
  getPlayUrl(bvid: string, cid: number) {
    return this.request<BilibiliPlayUrlResponse>(
      "BILIBILI_PLAYURL",
      { bvid, cid },
      "获取播放链接中..."
    );
  }

  // 移除稍后再看
  delWatchLater(avid: string) {
    return this.request<BilibiliWatchLaterDelResponse>(
      "BILIBILI_WATCHLATER_DEL",
      { avid },
      "移除待看中..."
    );
  }

  // 获取弹幕
  getDanmaku(cid: number) {
    return this.request<BilibiliDanmakuResponse>(
      "BILIBILI_GET_DANMAKU",
      { cid },
      "获取弹幕中..."
    );
  }
}
