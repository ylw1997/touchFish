/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-22 08:49:53
 * @LastEditTime: 2025-10-23 14:15:53
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\xhsWebProvider.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
/*
 * XhsWebProvider: 小红书 Webview 列表展示 (仿知乎实现, 精简版)
 */
import { WebviewViewProvider, WebviewView, ExtensionContext, Uri } from 'vscode';
import * as vscode from 'vscode';
import { getXhsFeed, getXhsFeedDetail } from '../api/xhs';
import * as fs from 'fs';

interface XhsMessage<T=any> { command: string; payload?: T; uuid?: string; }

export class XhsWebProvider implements WebviewViewProvider {
  constructor(private context: ExtensionContext) {}

  public resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    webviewView.webview.options = { enableScripts: true, localResourceRoots: [this.context.extensionUri] };

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        const pos = this.context.workspaceState.get('xhsScrollPosition', 0);
        webviewView.webview.postMessage({ command: 'XHS_RESTORE_SCROLL_POSITION', payload: pos });
      }
    });

    webviewView.webview.onDidReceiveMessage(async (msg: XhsMessage) => {
      const { command, payload, uuid } = msg;
      try {
        switch (command) {
          case 'TOGGLE_SHOW_IMG': {
            const newState = !!payload;
            const config = vscode.workspace.getConfiguration('touchfish');
            await config.update('showImg', newState, true);
            vscode.window.showInformationMessage(`图片已设置为${newState ? '显示' : '隐藏'}`);
            webviewView.webview.postMessage({ command: 'XHS_IMG_TOGGLED', payload: newState });
            break;
          }
          case 'XHS_GET_HOME_FEED': {
            const cursor = (payload && (payload as any).cursor) || '';
            const data = await getXhsFeed(cursor);
            webviewView.webview.postMessage({ payload: data, uuid });
            break;
          }
          case 'XHS_FEED_DETAIL': {
            const detailPayload = payload as any;
            const data = await getXhsFeedDetail(detailPayload);
            webviewView.webview.postMessage({ payload: data, uuid });
            break;
          }
          case 'XHS_SAVE_SCROLL_POSITION': {
            console.log("Saving scroll position:", payload);
            this.context.workspaceState.update('xhsScrollPosition', payload || 0);
            break;
          }
          case 'XHS_REQUEST_RESTORE_SCROLL': {
            const pos = this.context.workspaceState.get('xhsScrollPosition', 0);
            console.log("Restoring scroll position to:", pos);
            webviewView.webview.postMessage({ command: 'XHS_RESTORE_SCROLL_POSITION', payload: pos });
            break;
          }
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(err?.message || '小红书请求发生错误');
        webviewView.webview.postMessage({ payload: { ok: 0, msg: err?.message || '请求失败' }, uuid });
      }
    });

    const config = vscode.workspace.getConfiguration('touchfish');
    let showImg = config.get('showImg') as boolean | undefined;
    if (showImg === undefined) showImg = true;

    const isDev = this.context.extensionMode === vscode.ExtensionMode.Development;
    let htmlContent = '';
    if (isDev) {
      // 开发模式：加载 Vite Dev Server 5175，复用 weibo/zhihu 逻辑
      htmlContent = `<!doctype html><html lang="zh"><head><meta charset="UTF-8" />
        <script>window.showImg = ${showImg}</script>
        <script type="module">\n        import RefreshRuntime from "http://localhost:5175/@react-refresh";\n        RefreshRuntime.injectIntoGlobalHook(window);\n        window.$RefreshReg$ = () => {};\n        window.$RefreshSig$ = () => (type) => type;\n        window.__vite_plugin_react_preamble_installed__ = true;\n        </script>
        <script type="module" src="http://localhost:5175/@vite/client"></script>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>小红书</title></head><body>
        <div id="root"></div>
        <script type="module" src="http://localhost:5175/src/main.tsx"></script>
        </body></html>`;
    } else {
      // 生产模式：读取 dist/index.html 并重写静态资源路径
      const distPath = Uri.joinPath(this.context.extensionUri, 'xhs', 'dist');
      const indexPath = Uri.joinPath(distPath, 'index.html');
      let html = '';
      try {
        html = fs.readFileSync(indexPath.fsPath, 'utf-8');
      } catch (e: any) {
        html = `<html><body><h3>未找到 xhs 构建资源，请先执行 pnpm --filter xhs build</h3><pre>${e?.message}</pre></body></html>`;
      }
      html = html.replace(/(href|src)="\/([^"/]*)"/g, (_m, attr, path) => {
        return `${attr}="${webviewView.webview.asWebviewUri(vscode.Uri.joinPath(distPath, path))}"`;
      });
      html = html.replace('</head>', `<script>window.showImg = ${showImg}</script></head>`);
      htmlContent = html;
    }
    webviewView.webview.html = htmlContent;
  }

  // 旧的内联实现保留以便回退（暂不删除，可根据需要恢复）
}
