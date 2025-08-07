/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-12 15:14:35
 * @LastEditTime: 2025-08-07 10:03:42
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
import { commandsType } from "../../type";
import * as fs from "fs";
export class ZhihuWebProvider implements WebviewViewProvider {
  constructor(protected context: ExtensionContext) {}

  public resolveWebviewView(webviewView: WebviewView): Thenable<void> | void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.onDidReceiveMessage(
      async (message: commandsType<string | any>) => {
        // 在这里处理来自 webview 的消息
        console.log("zhihuWebProvider接收到来自 webview 的消息:", message);
      }
    );

    const config = vscode.workspace.getConfiguration("touchfish");
    let showImg = config.get("showImg") as boolean | undefined;
    if (showImg === undefined) {
      showImg = true;
    }

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
          <script>
          window.showImg = ${showImg}
          </script>
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
      html = html.replace(
        "</head>",
        `<script>window.showImg = ${showImg}</script></head>`
      );
      htmlContent = html;
    }
    webviewView.webview.html = htmlContent;
  }
}
