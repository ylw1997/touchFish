/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-12 15:14:35
 * @LastEditTime: 2025-06-12 11:22:05
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\weiboProvider.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved. 
 * @Description: 
 */
import { WebviewView, WebviewViewProvider, ExtensionContext, Uri, window } from 'vscode';
import { getLongText, getUserWeibo, getWeiboComment, getWeiboData, getWeiboImg } from '../api/weibo';
import { commandsType, weiboAJAX } from '../../type';
import { setConfigByKey } from '../config';
export class WeiboProvider implements WebviewViewProvider {
  constructor(protected context: ExtensionContext) { }

  public resolveWebviewView(webviewView: WebviewView): Thenable<void> | void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this.context.extensionUri
      ]
    }

    const scriptUri = webviewView.webview.asWebviewUri(Uri.joinPath(
      this.context.extensionUri,
      'weibo/dist/index.js'
    ))

    const cssUri = webviewView.webview.asWebviewUri(Uri.joinPath(
      this.context.extensionUri,
      'weibo/dist/index.css'
    ))

    webviewView.webview.onDidReceiveMessage(async (message: commandsType<string>) => {
      switch (message.command) {
        case "GETDATA":
          {
            let res = await getWeiboData(message.payload);
            console.log("GETDATA", res.data);
            if (res.data.ok !== 1) {
              if (res.data.ok == -100) {
                const cookie = await window.showInputBox({
                  placeHolder: "请输入微博的cookie",
                  prompt: "请输入微博的cookie",
                });
                if (cookie) {
                  await setConfigByKey('weiboCookie', cookie);
                  res = await getWeiboData(message.payload);
                }
              } else {
                window.showInformationMessage("获取微博数据失败!");
              }
            }
            webviewView.webview.postMessage({
              command: "SENDDATA",
              payload: res.data
            } as commandsType<weiboAJAX>)
            break;
          }
        case "GETIMG":
          {
            const res = await getWeiboImg(message.payload);
            webviewView.webview.postMessage({
              command: `SENDIMG:${message.payload}` as any,
              payload: res
            } as commandsType<string>)
            break;
          }
        case "GETCOMMENT":
          {
            const res = await getWeiboComment((message.payload as any).url);
            webviewView.webview.postMessage({
              command: `SENDCOMMENT`,
              payload: {
                payload: message.payload,
                ...res.data
              }
            } as commandsType<weiboAJAX>)
            break;
          }
        case "GETLONGTEXT":
          {
            const res = await getLongText(message.payload);
            webviewView.webview.postMessage({
              command: `SENDLONGTEXT`,
              payload: {
                payload: message.payload,
                ...res.data
              }
            } as commandsType<weiboAJAX>)
            break;
          }
        case "GETUSERBLOG":
          {
            const res = await getUserWeibo(message.payload);
            webviewView.webview.postMessage({
              command: `SENDUSERBLOG`,
              payload: {
                payload: message.payload,
                ...res.data
              }
            } as commandsType<weiboAJAX>)
            break;
          }
      }
    })

    webviewView.webview.html = `
      <!DOCTYPE html>
        <html lang="en"></html>
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

}