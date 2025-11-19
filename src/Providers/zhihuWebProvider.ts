/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-12 15:14:35
 * @LastEditTime: 2025-11-19 17:04:40
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\zhihuWebProvider.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import { WebviewView, ExtensionContext } from "vscode";
import {
  getZhihuComment,
  getZhihuChildComment,
  getZhihuWebData,
  getZhihuWebDetail,
  voteZhihuAnswer,
  searchZhihu,
  getZhihuQuestionDetailFunc,
  followQuestion,
  unfollowQuestion,
} from "../api/zhihu";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";
import { ZhihuCommandsType } from "../../type";
export class ZhihuWebProvider extends BaseWebviewProvider {
  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "zhihu/dist",
      devPort: 5174,
      title: "知乎",
      scrollKey: "zhihuScrollPosition",
      restoreCommand: "ZHIHU_RESTORE_SCROLL_POSITION",
      saveCommand: "ZHIHU_SAVE_SCROLL_POSITION",
    });
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    return super.resolveWebviewView(webviewView);
  }

  protected async handleCustomMessage(message: IncomingMessage, webviewView: WebviewView) {
    const { command, payload, uuid } = message as ZhihuCommandsType<string | any>;
    switch (command) {
      case "ZHIHU_GETDATA": {
        const { tab, nextUrl } = payload as { tab: string; nextUrl?: string };
        const data = await getZhihuWebData(tab as any, nextUrl);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "getZhihuComment": {
        const comments = await getZhihuComment(payload);
        webviewView.webview.postMessage({ payload: { data: comments, answerId: payload }, uuid });
        break;
      }
      case "getZhihuChildComment": {
        const res = await getZhihuChildComment(payload);
        webviewView.webview.postMessage({
          payload: { data: res.data, paging: res.paging, commentIdOrNextUrl: payload },
          uuid,
        });
        break;
      }
      case "getZhihuQuestionDetail": {
        const { questionId, nextUrl, order } = payload as {
          questionId: string;
          nextUrl?: string;
          order?: "default" | "updated";
        };
        const detailRes = await getZhihuWebDetail(nextUrl ? nextUrl : questionId, order || "default");
        const detailObj = await getZhihuQuestionDetailFunc(questionId);
        webviewView.webview.postMessage({
          payload: { data: detailRes.data, paging: detailRes.paging, payload: questionId, ...detailObj },
          uuid,
        });
        break;
      }
      case "ZHIHU_VOTE_ANSWER": {
        const { answerId, type } = payload;
        const res = await voteZhihuAnswer(answerId, type);
        webviewView.webview.postMessage({ payload: res.data, uuid });
        break;
      }
      case "ZHIHU_FOLLOW_QUESTION": {
        const res = await followQuestion(payload);
        webviewView.webview.postMessage({ payload: res.data, uuid });
        break;
      }
      case "ZHIHU_UNFOLLOW_QUESTION": {
        const res = await unfollowQuestion(payload);
        webviewView.webview.postMessage({ payload: res.data, uuid });
        break;
      }
      case "ZHIHU_SEARCH": {
        const results = await searchZhihu(payload);
        webviewView.webview.postMessage({ payload: results, uuid });
        break;
      }
    }
  }
}
