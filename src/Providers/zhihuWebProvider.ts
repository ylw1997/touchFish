/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-12 15:14:35
 * @LastEditTime: 2025-09-29 16:31:02
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\zhihuWebProvider.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import { WebviewView, WebviewViewProvider, ExtensionContext } from "vscode";
import * as vscode from "vscode";
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
import { getWebviewHtml } from "../utils/webviewUtils";
import { ZhihuCommandsType } from "../../type";
export class ZhihuWebProvider implements WebviewViewProvider {
  constructor(protected context: ExtensionContext) {}

  public resolveWebviewView(webviewView: WebviewView): Thenable<void> | void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        const position = this.context.workspaceState.get(
          "zhihuScrollPosition",
          0
        );
        webviewView.webview.postMessage({
          command: "ZHIHU_RESTORE_SCROLL_POSITION",
          payload: position,
        });
      }
    });

    webviewView.webview.onDidReceiveMessage(
      async (message: ZhihuCommandsType<string | any>) => {
        const { command, payload, uuid } = message;
        try {
          switch (command) {
            case "TOGGLE_SHOW_IMG": {
              const newState = payload as boolean;
              const config = vscode.workspace.getConfiguration("touchfish");
              config.update("showImg", newState, true);
              vscode.window.showInformationMessage(
                `图片已设置为${newState ? "显示" : "隐藏"}`
              );
              break;
            }
            case "ZHIHU_GETDATA": {
              const { tab, nextUrl } = payload as {
                tab: string;
                nextUrl?: string;
              };
              const data = await getZhihuWebData(tab as any, nextUrl);
              webviewView.webview.postMessage({ payload: data, uuid });
              break;
            }
            case "getZhihuComment": {
              const comments = await getZhihuComment(payload);
              webviewView.webview.postMessage({
                payload: { data: comments, answerId: payload },
                uuid,
              });
              break;
            }
            case "getZhihuChildComment": {
              // payload may be commentId or nextUrl
              const res = await getZhihuChildComment(payload);
              webviewView.webview.postMessage({
                payload: {
                  data: res.data,
                  paging: res.paging,
                  commentIdOrNextUrl: payload,
                },
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
              const detailRes = await getZhihuWebDetail(
                nextUrl ? nextUrl : questionId,
                order || "default"
              );
              const detailObj = await getZhihuQuestionDetailFunc(questionId);
              webviewView.webview.postMessage({
                payload: {
                  data: detailRes.data,
                  paging: detailRes.paging,
                  payload: questionId,
                  ...detailObj,
                },
                uuid,
              });
              break;
            }
            case "ZHIHU_SAVE_SCROLL_POSITION": {
              this.context.workspaceState.update(
                "zhihuScrollPosition",
                payload
              );
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
        } catch (error: any) {
          vscode.window.showErrorMessage(error.message || "知乎请求发生错误");
          webviewView.webview.postMessage({
            payload: { ok: 0, msg: error.message || "请求失败" },
            uuid,
          });
        }
      }
    );

    const config = vscode.workspace.getConfiguration("touchfish");
    let showImg = config.get("showImg") as boolean | undefined;
    if (showImg === undefined) {
      showImg = true;
    }

    webviewView.webview.html = getWebviewHtml({
      webviewView,
      context: this.context,
      distPath: "zhihu/dist",
      devPort: 5174,
      title: "Vite + React + TS",
      windowConfig: { showImg },
    });
  }
}
