/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-22 17:00:00
 * @LastEditTime: 2025-09-25 12:02:47
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\x\src\api\index.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description: X API requests
 */

import type { CommandList } from "../../../types/commands";
import type {
  payloadType,
  xCommentParams,
  xRepostParams,
  uploadType,
  UploadImageResponsePayload,
} from "../../../types/x";

type RequestFunc = <T = any>(
  command: CommandList,
  payload: any,
  content?: string,
) => Promise<T>;

export class XApi {
  private request: RequestFunc;

  constructor(request: RequestFunc) {
    this.request = request;
  }

  getListData(payload: any) {
    return this.request<payloadType>("GETDATA", payload, "请求 X 中...");
  }

  getUserBlogData(uid: string | number, cursor?: string) {
    return this.request<payloadType>(
      "GETUSERBLOG",
      JSON.stringify({ uid, cursor }),
      "请求用户 X 中...",
    );
  }

  getComments(id: number | string, uid: number | string) {
    return this.request<any>(
      "GETCOMMENT",
      {
        url: `/statuses/buildComments?id=${id}&is_show_bulletin=2uid=${uid}&locale=zh-CN`,
        id,
        uid,
      },
      "请求评论中...",
    );
  }

  getMoreComments(id: number | string, uid: number | string | undefined) {
    return this.request<any>(
      "GETCOMMENT",
      {
        url: `/statuses/buildComments?flow=1&id=${id}&is_show_bulletin=2uid=${uid}&locale=zh-CN`,
        id: id,
        uid: uid,
      },
      "请求评论中...",
    );
  }

  getLongText(id: string | number) {
    return this.request<payloadType>("GETLONGTEXT", id, "请求长 X 中...");
  }

  getUserByName(username: string) {
    return this.request<payloadType>(
      "GETUSERBYNAME",
      username,
      "获取用户信息中...",
    );
  }

  followUser(userId: number | string) {
    return this.request("GETFOLLOW", userId, "关注中...");
  }

  cancelFollow(userId: number | string) {
    return this.request("GETCANCELFOLLOW", userId, "取关中...");
  }

  getMyUserInfo() {
    return this.request<payloadType>(
      "GET_MY_USER_INFO",
      null,
      "获取我的信息及...",
    );
  }

  getHotSearch() {
    return this.request<payloadType>("GETHOTSEARCH", null, "正在刷新热搜...");
  }

  getXSearch(payload: { query: string; cursor?: string; product?: string }) {
    return this.request<payloadType>("GETSEARCH", payload, "正在搜索...");
  }

  uploadImage(uploadData: uploadType) {
    return this.request<UploadImageResponsePayload>(
      "GETUPLOADIMGURL",
      JSON.stringify(uploadData),
      "上传图片中...",
    );
  }

  sendX(content: any) {
    return this.request<payloadType>(
      "GETNEWBLOGRESULT",
      JSON.stringify(content),
      "发送中...",
    );
  }

  createComment(params: xCommentParams) {
    return this.request("GETCREATECOMMENTS", params, "发送评论中...");
  }

  createRepost(params: xRepostParams) {
    return this.request("GETCREATEREPOST", params, "转发 X 中...");
  }

  setLike(id: number | string) {
    return this.request("GETSETLIKE", id, "正在点赞...");
  }

  cancelLike(id: number | string) {
    return this.request("GETCANCELLIKE", id, "取消点赞中...");
  }

  translateTweet(id: number | string) {
    return this.request<{ ok: number; data?: string; msg?: string }>(
      "GET_TRANSLATION",
      { id },
      "正在翻译...",
    );
  }

  getFollowing(userId: string, cursor?: string) {
    return this.request<any>(
      "GETFOLLOWING" as CommandList,
      JSON.stringify({ userId, cursor }),
      "获取关注列表中...",
    );
  }
}
