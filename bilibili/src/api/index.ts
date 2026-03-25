/*
 * @Description: Bilibili API requests
 */

import type {
  BilibiliRecommendResponse,
  BilibiliPopularResponse,
  BilibiliDynamicResponse,
  BilibiliWatchLaterResponse,
  BilibiliFavoriteFoldersResponse,
  BilibiliFavoriteDetailResponse,
  BilibiliPlayUrlResponse,
  BilibiliWatchLaterDelResponse,
  BilibiliDanmakuResponse,
  BilibiliSearchResponse,
  BilibiliUserVideosResponse,
  BilibiliUserCardResponse,
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

  // 获取热门视频列表
  getPopular(page: number = 1) {
    return this.request<BilibiliPopularResponse>(
      "BILIBILI_POPULAR",
      { page },
      "请求热门视频中..."
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

  // 搜索视频
  search(keyword: string, page: number = 1) {
    return this.request<BilibiliSearchResponse>(
      "BILIBILI_SEARCH",
      { keyword, page },
      "搜索中..."
    );
  }

  // 获取用户上传的视频列表
  getUserVideos(mid: number, page: number = 1) {
    return this.request<BilibiliUserVideosResponse>(
      "BILIBILI_USER_VIDEOS",
      { mid, page },
      "获取用户视频中..."
    );
  }

  // 获取用户卡片信息
  getUserCard(mid: number) {
    return this.request<BilibiliUserCardResponse>(
      "BILIBILI_USER_CARD",
      { mid },
      "获取用户信息中..."
    );
  }

  // 关注/取消关注用户
  modifyRelation(fid: number, act: 1 | 2) {
    return this.request<{ code: number; message: string }>(
      "BILIBILI_MODIFY_RELATION",
      { fid, act },
      act === 1 ? "关注中..." : "取消关注中..."
    );
  }
}
