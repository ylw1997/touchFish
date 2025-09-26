/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-12 15:14:35
 * @LastEditTime: 2025-09-26 17:49:49
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\weiboProvider.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import {
  WebviewView,
  WebviewViewProvider,
  ExtensionContext,
  Uri,
  window,
} from "vscode";
import {
  cancelfollowUser,
  cancelLike,
  createComments,
  createRepost,
  followUser,
  getLongText,
  getUserWeibo,
  getWeiboComment,
  getWeiboData,
  getWeiboImg,
  downloadVideoAsFile,
  getWeiboSearch,
  sendWeibo,
  setLike,
  uploadImage,
  getUserByName,
  getHotSearch,
} from "../api/weibo";
import * as vscode from "vscode";
import { commandsType, uploadType, weiboAJAX } from "../../type";
import { setConfigByKey } from "../config";
import * as fs from "fs";
export class WeiboProvider implements WebviewViewProvider {
  constructor(protected context: ExtensionContext) {}

  public resolveWebviewView(webviewView: WebviewView): Thenable<void> | void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        const position = this.context.workspaceState.get(
          "weiboScrollPosition",
          0
        );
        webviewView.webview.postMessage({
          command: "RESTORE_SCROLL_POSITION",
          payload: position,
        });
      }
    });

    webviewView.webview.onDidReceiveMessage(
      async (message: commandsType<string | any>) => {
        const { command, payload, uuid } = message;
        // console.log("Weibo provider received a message:", message);
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
            case "SAVE_SCROLL_POSITION": {
              this.context.workspaceState.update(
                "weiboScrollPosition",
                payload
              );
              break;
            }
            case "GETDATA": {
              let res = await getWeiboData(payload);
              if (res.data?.ok !== 1) {
                if (res.data?.ok == -100) {
                  const cookie = await window.showInputBox({
                    placeHolder: "请输入微博的cookie",
                    prompt: "请输入微博的cookie",
                  });
                  if (cookie) {
                    await setConfigByKey("weiboCookie", cookie);
                    res = await getWeiboData(payload);
                  }
                } else {
                  window.showInformationMessage("获取微博数据失败!");
                }
              }
              webviewView.webview.postMessage({
                command: "SENDDATA",
                payload: {
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETIMG": {
              const res = await getWeiboImg(payload);
              webviewView.webview.postMessage({
                payload: res,
                uuid,
              });
              break;
            }
            case "GETVIDEO": {
              const videoUrl = payload;
              try {
                const videoPath = await downloadVideoAsFile(videoUrl);
                const videoUri = Uri.file(videoPath);
                const webviewUri = webviewView.webview.asWebviewUri(videoUri);
                webviewView.webview.postMessage({
                  payload: webviewUri.toString(),
                  uuid,
                });
              } catch (error) {
                console.error("Failed to fetch video:", error);
                // Post back an error message
                webviewView.webview.postMessage({
                  payload: { ok: 0, msg: "获取视频失败!" },
                  uuid,
                });
              }
              break;
            }
            case "GETCOMMENT": {
              const res = await getWeiboComment((payload as any).url);
              webviewView.webview.postMessage({
                command: `SENDCOMMENT`,
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETLONGTEXT": {
              const res = await getLongText(payload);
              webviewView.webview.postMessage({
                command: `SENDLONGTEXT`,
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETUSERBLOG": {
              const res = await getUserWeibo(payload);
              webviewView.webview.postMessage({
                command: `SENDUSERBLOG`,
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETFOLLOW": {
              const res = await followUser(payload);
              webviewView.webview.postMessage({
                command: `SENDFOLLOW`,
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETNEWBLOGRESULT": {
              const res = await sendWeibo(payload);
              webviewView.webview.postMessage({
                command: "SENDNEWBLOGRESULT",
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETUPLOADIMGURL": {
              const uploadObj = JSON.parse(payload) as uploadType;
              const res = await uploadImage(uploadObj.base64);
              webviewView.webview.postMessage({
                command: `SENDUPLOADIMGURL`,
                payload: {
                  payload: uploadObj.uid,
                  uid: uploadObj.uid,
                  type: uploadObj.type,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETCANCELFOLLOW": {
              const res = await cancelfollowUser(payload);
              webviewView.webview.postMessage({
                command: `SENDCANCELFOLLOW`,
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETCREATECOMMENTS": {
              const res = await createComments(payload);
              webviewView.webview.postMessage({
                command: `SENDCREATECOMMENTS`,
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETCREATEREPOST": {
              const res = await createRepost(payload);
              webviewView.webview.postMessage({
                command: `SENDCREATEREPOST`,
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETSETLIKE": {
              const res = await setLike(payload);
              webviewView.webview.postMessage({
                command: `SENDSETLIKE`,
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETCANCELLIKE": {
              const res = await cancelLike(payload);
              webviewView.webview.postMessage({
                command: `SENDCANCELLIKE`,
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETSEARCH": {
              const res = await getWeiboSearch(payload);
              webviewView.webview.postMessage({
                command: `SENDSEARCH`,
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETUSERBYNAME": {
              const res = await getUserByName(payload);
              webviewView.webview.postMessage({
                command: `SENDUSERBYNAME`,
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
            case "GETHOTSEARCH": {
              const res = await getHotSearch();
              webviewView.webview.postMessage({
                command: `SENDHOTSEARCH`,
                payload: {
                  payload: payload,
                  ...res.data,
                },
                uuid,
              } as commandsType<weiboAJAX>);
              break;
            }
          }
        } catch (err: any) {
          console.error("Error handling webview message:", err);
          try {
            webviewView.webview.postMessage({
              payload: { ok: 0, msg: err?.message || "内部错误" },
              uuid,
            });
          } catch (e) {
            console.error("Failed to post error message to webview:", e);
          }
        }
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
        import RefreshRuntime from "http://localhost:5173/@react-refresh"
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
        </script>

            <script type="module" src="http://localhost:5173/@vite/client"></script>

            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="http://localhost:5173/vite.svg" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Vite + React + TS</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="http://localhost:5173/src/main.tsx"></script>
          </body>
        </html>
      `;
    } else {
      const distPath = Uri.joinPath(
        this.context.extensionUri,
        "weibo",
        "dist"
      );
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
