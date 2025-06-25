/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-12 15:14:35
 * @LastEditTime: 2025-06-25 11:45:03
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
  createComments,
  createRepost,
  followUser,
  getLongText,
  getUserWeibo,
  getWeiboComment,
  getWeiboData,
  getWeiboImg,
  sendWeibo,
  uploadImage,
} from "../api/weibo";
import { commandsType, uploadType, weiboAJAX } from "../../type";
import { setConfigByKey } from "../config";
export class WeiboProvider implements WebviewViewProvider {
  constructor(protected context: ExtensionContext) {}

  public resolveWebviewView(webviewView: WebviewView): Thenable<void> | void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    const scriptUri = webviewView.webview.asWebviewUri(
      Uri.joinPath(this.context.extensionUri, "weibo/dist/index.js")
    );

    const cssUri = webviewView.webview.asWebviewUri(
      Uri.joinPath(this.context.extensionUri, "weibo/dist/index.css")
    );

    webviewView.webview.onDidReceiveMessage(
      async (message: commandsType<string | any>) => {
        switch (message.command) {
          case "GETDATA": {
            let res = await getWeiboData(message.payload);
            // console.log("GETDATA", res.data);
            if (res.data.ok !== 1) {
              if (res.data.ok == -100) {
                const cookie = await window.showInputBox({
                  placeHolder: "请输入微博的cookie",
                  prompt: "请输入微博的cookie",
                });
                if (cookie) {
                  await setConfigByKey("weiboCookie", cookie);
                  res = await getWeiboData(message.payload);
                }
              } else {
                window.showInformationMessage("获取微博数据失败!");
              }
            }
            webviewView.webview.postMessage({
              command: "SENDDATA",
              payload: res.data,
            } as commandsType<weiboAJAX>);
            break;
          }
          case "GETIMG": {
            const res = await getWeiboImg(message.payload);
            webviewView.webview.postMessage({
              command: `SENDIMG:${message.payload}` as any,
              payload: res,
            } as commandsType<string>);
            break;
          }
          case "GETCOMMENT": {
            const res = await getWeiboComment((message.payload as any).url);
            webviewView.webview.postMessage({
              command: `SENDCOMMENT`,
              payload: {
                payload: message.payload,
                ...res.data,
              },
            } as commandsType<weiboAJAX>);
            break;
          }
          case "GETLONGTEXT": {
            const res = await getLongText(message.payload);
            webviewView.webview.postMessage({
              command: `SENDLONGTEXT`,
              payload: {
                payload: message.payload,
                ...res.data,
              },
            } as commandsType<weiboAJAX>);
            break;
          }
          case "GETUSERBLOG": {
            const res = await getUserWeibo(message.payload);
            webviewView.webview.postMessage({
              command: `SENDUSERBLOG`,
              payload: {
                payload: message.payload,
                ...res.data,
              },
            } as commandsType<weiboAJAX>);
            break;
          }
          case "GETFOLLOW": {
            const res = await followUser(message.payload);
            webviewView.webview.postMessage({
              command: `SENDFOLLOW`,
              payload: {
                payload: message.payload,
                ...res.data,
              },
            } as commandsType<weiboAJAX>);
            break;
          }
          case "GETNEWBLOGRESULT": {
            const res = await sendWeibo(message.payload);
            webviewView.webview.postMessage({
              command: "SENTNEWBLOGRESULT",
              payload: {
                payload: message.payload,
                ...res.data,
              },
            } as commandsType<weiboAJAX>);
            break;
          }
          case "GETUPLOADIMGURL": {
            const uploadObj = JSON.parse(message.payload) as uploadType;
            const res = await uploadImage(uploadObj.base64);
            console.log("res", res);
            webviewView.webview.postMessage({
              command: `SENDUPLOADIMGURL`,
              payload: {
                payload: uploadObj.uid,
                uid: uploadObj.uid,
                type: uploadObj.type,
                ...res.data,
              },
            } as commandsType<weiboAJAX>);
            break;
          }
          case "GETCANCELFOLLOW": {
            const res = await cancelfollowUser(message.payload);
            webviewView.webview.postMessage({
              command: `SENDCANCELFOLLOW`,
              payload: {
                payload: message.payload,
                ...res.data,
              },
            } as commandsType<weiboAJAX>);
            break;
          }
          case "GETCREATECOMMENTS": {
            const res = await createComments(message.payload);
            webviewView.webview.postMessage({
              command: `SENDCREATECOMMENTS`,
              payload: {
                payload: message.payload,
                ...res.data,
              },
            } as commandsType<weiboAJAX>);
            break;
          }
          case "GETCREATEREPOST": {
            const res = await createRepost(message.payload);
            webviewView.webview.postMessage({
              command: `SENDCREATEREPOST`,
              payload: {
                payload: message.payload,
                ...res.data,
              },
            } as commandsType<weiboAJAX>);
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
    console.log("isDev", isDev);
    if (isDev) {
      // 开发环境，直接加载本地Vite dev server
      htmlContent = `
        <!doctype html>
                <html lang="en">
          <head>
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
      // 生产环境，加载打包后的静态资源
      htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>test</title>
          </head>
          <body>
            <div id="root"></div>
            <script src="${scriptUri}"></script>
            <link rel="stylesheet" href="${cssUri}">
          </body>
        </html>
      `;
    }
    webviewView.webview.html = htmlContent;
  }
}
