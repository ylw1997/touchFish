/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-22 17:00:00
 * @LastEditTime: 2025-09-25 12:02:47
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\api\index.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description: Weibo API requests
 */

import type { CommandList } from "../../../types/commands";
import type {
  payloadType,
  weiboCommentParams,
  weiboRepostParams,
  SearchType,
  uploadType,
  UploadImageResponsePayload,
} from "../../../types/weibo";

type RequestFunc = <T = any>(
  command: CommandList,
  payload: any,
  content?: string
) => Promise<T>;

export class WeiboApi {
  private request: RequestFunc;

  constructor(request: RequestFunc) {
    this.request = request;
  }

  getListData(payload: string) {
    return this.request<payloadType>("GETDATA", payload, "请求微博中...");
  }

  getUserBlogData(uid: string | number, page: number) {
    return this.request<payloadType>(
      "GETUSERBLOG",
      JSON.stringify({ uid, page }),
      "请求用户微博中..."
    );
  }

  getComments(id: number, uid: number) {
    return this.request<any>(
      "GETCOMMENT",
      {
        url: `/statuses/buildComments?id=${id}&is_show_bulletin=2uid=${uid}&locale=zh-CN`,
        id,
        uid,
      },
      "请求评论中..."
    );
  }

  getMoreComments(id: number, uid: number | undefined) {
    return this.request<any>(
        "GETCOMMENT",
        {
          url: `/statuses/buildComments?flow=1&id=${id}&is_show_bulletin=2uid=${uid}&locale=zh-CN`,
          id: id,
          uid: uid,
        },
        "请求评论中..."
      );
  }

  getLongText(id: string | number) {
    return this.request<payloadType>("GETLONGTEXT", id, "请求长微博中...");
  }

  getUserByName(username: string) {
    return this.request<payloadType>("GETUSERBYNAME", username, "获取用户信息中...");
  }

  followUser(userId: number) {
    return this.request("GETFOLLOW", userId, "关注中...");
  }

  cancelFollow(userId: number) {
    return this.request("GETCANCELFOLLOW", userId, "取关中...");
  }

  getHotSearch() {
    return this.request<payloadType>("GETHOTSEARCH", null, "正在刷新热搜...");
  }

  getWeiboSearch(keyword: string, searchType: SearchType) {
    const payload = `100103type=${searchType.type}&q=${keyword}&t=`;
    return this.request<payloadType>("GETSEARCH", payload, "正在搜索...");
  }

  uploadImage(uploadData: uploadType) {
    return this.request<UploadImageResponsePayload>(
      "GETUPLOADIMGURL",
      JSON.stringify(uploadData),
      "上传图片中..."
    );
  }

  sendWeibo(content: any) {
    return this.request<payloadType>(
      "GETNEWBLOGRESULT",
      JSON.stringify(content),
      "发送中..."
    );
  }

  createComment(params: weiboCommentParams) {
    return this.request("GETCREATECOMMENTS", params, "发送评论中...");
  }

  createRepost(params: weiboRepostParams) {
    return this.request("GETCREATEREPOST", params, "转发微博中...");
  }

  setLike(id: number) {
    return this.request("GETSETLIKE", id, "正在点赞...");
  }

  cancelLike(id: number) {
    return this.request("GETCANCELLIKE", id, "取消点赞中...");
  }
}
