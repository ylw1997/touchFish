/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-12 15:14:35
 * @LastEditTime: 2024-11-22 10:46:32
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\weiboProvider.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved. 
 * @Description: 
 */
import { WebviewView, WebviewViewProvider, ExtensionContext, Uri } from 'vscode';
import { getWeiboData, getWeiboImg } from '../api/weibo';
import { commandsType, weiboAJAX } from '../../type';
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
            const res = await getWeiboData(message.payload);
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
              command: `SENDIMG:${message.payload}`,
              payload: res
            } as commandsType<string>)
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