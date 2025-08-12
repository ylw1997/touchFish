/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-12 15:14:35
 * @LastEditTime: 2025-08-12 09:21:11
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
        switch (message.command) {
          case "ZHIHU_GETDATA": {
            const data = await getZhihuWebData(message.payload);
            webviewView.webview.postMessage({
              command: "ZHIHU_SENDDATA",
              payload: {
                data,
                source: message.source,
              },
            } as ZhihuCommandsType<any>);
            break;
          }
          case "getZhihuComment": {
            const comments = await getZhihuComment(message.payload);
            webviewView.webview.postMessage({
              command: "zhihuComment",
              payload: {
                data: comments,
                answerId: message.payload,
                source: message.source,
              },
            });
            break;
          }
          case "getZhihuQuestionDetail": {
            const detail = await getZhihuWebDetail(message.payload);
            webviewView.webview.postMessage({
              command: "sendZhihuQuestionDetail",
              payload: {
                data: detail,
                payload: message.payload,
                source: message.source,
              },
            });
            break;
          }
          case "ZHIHU_SAVE_SCROLL_POSITION": {
            this.context.workspaceState.update(
              "zhihuScrollPosition",
              message.payload
            );
            break;
          }
          case "ZHIHU_VOTE_ANSWER": {
            const { answerId, type } = message.payload;
           const res = await voteZhihuAnswer(answerId, type);
           console.log("ZHIHU_VOTE_ANSWER",res);
            break;
          }
          case "ZHIHU_SEARCH": {
            const results = await searchZhihu(message.payload);
            webviewView.webview.postMessage({
              command: "ZHIHU_SEND_SEARCH_RESULTS",
              payload: {
                data: results,
                source: message.source,
              },
            } as ZhihuCommandsType<any>);
            break;
          }
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
