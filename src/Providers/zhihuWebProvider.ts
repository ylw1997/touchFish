/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-12 15:14:35
 * @LastEditTime: 2025-08-15 14:46:57
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\zhihuWebProvider.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import {
  WebviewView,
  WebviewViewProvider,
  ExtensionContext,
  Uri,
} from "vscode";
import * as vscode from "vscode";
import {
  getZhihuComment,
  getZhihuWebData,
  getZhihuWebDetail,
  voteZhihuAnswer,
  searchZhihu,
  getZhihuQuestionDetailFunc,
  followQuestion,
  unfollowQuestion,
} from "../api/zhihu";
import * as fs from "fs";
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
            case "ZHIHU_GETDATA": {
              const data = await getZhihuWebData(payload);
              webviewView.webview.postMessage({ payload: data, uuid });
              break;
            }
            case "getZhihuComment": {
              const comments = await getZhihuComment(payload);
              webviewView.webview.postMessage({ payload: { data: comments, answerId: payload }, uuid });
              break;
            }
            case "getZhihuQuestionDetail": {
              const answers = await getZhihuWebDetail(payload);
              const detailObj = await getZhihuQuestionDetailFunc(payload);
              webviewView.webview.postMessage({
                payload: { data: answers, payload: payload, ...detailObj },
                uuid,
              });
              break;
            }
            case "ZHIHU_SAVE_SCROLL_POSITION": {
              this.context.workspaceState.update("zhihuScrollPosition", payload);
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

    // 判断是否为开发环境
    const isDev =
      process.env.NODE_ENV === "development" ||
      process.env.VSCODE_DEBUG_MODE === "true";
    let htmlContent = "";
    console.log("isDev判断是否为开发环境", isDev);
    if (isDev) {
      // 开发环境，直接加载本地Vite dev server
      htmlContent = `
      <!doctype html>
                <html lang="en">
          <head>
            <script type="module">
        import RefreshRuntime from "http://localhost:5174/@react-refresh"
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
        </script>
            <script type="module" src="http://localhost:5174/@vite/client"></script>

            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="http://localhost:5174/vite.svg" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Vite + React + TS</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="http://localhost:5174/src/main.tsx"></script>
          </body>
        </html>
      `;
    } else {
      const distPath = Uri.joinPath(this.context.extensionUri, "zhihu", "dist");
      const indexPath = Uri.joinPath(distPath, "index.html");
      let html = fs.readFileSync(indexPath.fsPath, "utf-8");
      html = html.replace(
        /(href|src)="\/([^"]*)"/g,
        (_, attr, path) =>
          `${attr}="${webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(distPath, path)
          )}"`
      );
      htmlContent = html;
    }
    webviewView.webview.html = htmlContent;
  }
}
