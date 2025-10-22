/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-22 08:49:53
 * @LastEditTime: 2025-10-22 10:24:21
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\xhsWebProvider.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
/*
 * XhsWebProvider: 小红书 Webview 列表展示 (仿知乎实现, 精简版)
 */
import { WebviewViewProvider, WebviewView, ExtensionContext } from 'vscode';
import * as vscode from 'vscode';
import { getXhsFeed } from '../api/xhs';

interface XhsMessage<T=any> { command: string; payload?: T; uuid?: string; }

export class XhsWebProvider implements WebviewViewProvider {
  constructor(private context: ExtensionContext) {}

  public resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    webviewView.webview.options = { enableScripts: true, localResourceRoots: [this.context.extensionUri] };

    // 恢复滚动
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
          case 'XHS_GETDATA': {
            const cursor = (payload && (payload as any).cursor) || '';
            const data = await getXhsFeed(cursor);
            webviewView.webview.postMessage({ payload: data, uuid });
            break;
          }
          case 'XHS_SAVE_SCROLL_POSITION': {
            this.context.workspaceState.update('xhsScrollPosition', payload || 0);
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

    // 简化: 生产 & 开发均使用内联 HTML (后续可接入 Vite)
  webviewView.webview.html = this.getInlineHtml();
  }

  private getInlineHtml(): string {
    return `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>小红书数据</title>
    <style>
      body { font-family: 'Microsoft YaHei'; padding:8px; }
      .note { border:1px solid var(--vscode-textBlockQuote-border); padding:10px; margin:8px 0; border-radius:6px; }
      pre { white-space:pre-wrap; word-break:break-word; font-size:12px; line-height:1.5; }
      .loading { text-align:center; padding:14px; }
    </style>
    </head><body>
      <div id="list"></div>
      <div id="loading" class="loading">加载中...</div>
    <script>
      const vscode = acquireVsCodeApi();
      const pending = new Map();
      let cursor=''; let ended=false; let loading=false;
      function send(command,payload){ const uuid=Math.random().toString(36).slice(2); vscode.postMessage({command,payload,uuid}); return new Promise(r=>pending.set(uuid,r)); }
      function esc(str){return (str||'').replace(/[&<>]/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[s]));}
      window.addEventListener('message',ev=>{ const { payload, uuid } = ev.data; if(uuid && pending.has(uuid)){ pending.get(uuid)(payload); pending.delete(uuid); }
        if(payload && payload.items){ render(payload.items); cursor = payload.cursor||''; ended = !payload.has_more; document.getElementById('loading').textContent = ended? '已结束':'加载完毕'; loading=false; }
        if(payload && payload.ok===0){ document.getElementById('loading').textContent = '错误: '+payload.msg; }
      });
      async function load(){ if(loading||ended) return; loading=true; document.getElementById('loading').textContent='加载中...'; await send('XHS_GETDATA',{cursor}); }
      function render(items){ const list=document.getElementById('list'); if(!Array.isArray(items)) return; if(!cursor) list.innerHTML=''; items.forEach(it=>{ const div=document.createElement('div'); div.className='note'; const raw = esc(JSON.stringify(it.raw||it,null,2)); div.innerHTML = '<pre>'+ raw +'</pre>'; list.appendChild(div); }); }
      load();
    </script>
    </body></html>`;
  }
}
