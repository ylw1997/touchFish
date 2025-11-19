/*
 * BaseWebviewProvider 抽象公共 WebviewViewProvider 逻辑:
 * 1. 统一图片显示开关 TOGGLE_SHOW_IMG 配置写入
 * 2. 统一滚动位置保存/恢复(SAVE_SCROLL / RESTORE_SCROLL 命令参数化)
 * 3. 统一获取 showImg 配置并注入 windowConfig
 * 4. 子类仅需实现 handleCustomMessage 处理自身业务命令
 */
import * as vscode from 'vscode';
import { getWebviewHtml } from '../utils/webviewUtils';

export interface BaseWebviewOptions {
  distPath: string;          // 生产构建输出目录 (相对 extension 根)
  devPort: number;           // 开发模式端口
  title: string;             // 页面标题
  scrollKey: string;         // workspaceState 中存储滚动位置的 key
  restoreCommand: string;    // 前端用于恢复滚动的命令名
  saveCommand: string;       // 前端用于保存滚动的命令名
  imgToggledCommand?: string;// 可选: 图片开关后要再通知前端的命令
}

export interface IncomingMessage<T = any> {
  command: string;
  payload?: T;
  uuid?: string;
}

export abstract class BaseWebviewProvider implements vscode.WebviewViewProvider {
  protected context: vscode.ExtensionContext;
  protected options: BaseWebviewOptions;

  constructor(context: vscode.ExtensionContext, options: BaseWebviewOptions) {
    this.context = context;
    this.options = options;
  }

  // 子类实现: 处理除通用命令外的其它消息
  protected abstract handleCustomMessage(message: IncomingMessage, webviewView: vscode.WebviewView): Promise<void> | void;

  public resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    // 可见时恢复滚动
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        const pos = this.context.workspaceState.get(this.options.scrollKey, 0);
        webviewView.webview.postMessage({
          command: this.options.restoreCommand,
          payload: pos,
        });
      }
    });

    // 统一消息入口
    webviewView.webview.onDidReceiveMessage(async (msg: IncomingMessage) => {
      const { command, payload } = msg;
      try {
        // 图片显示开关
        if (command === 'TOGGLE_SHOW_IMG') {
          const newState = !!payload;
          const config = vscode.workspace.getConfiguration('touchfish');
          await config.update('showImg', newState, true);
          vscode.window.showInformationMessage(`图片已设置为${newState ? '显示' : '隐藏'}`);
          if (this.options.imgToggledCommand) {
            webviewView.webview.postMessage({
              command: this.options.imgToggledCommand,
              payload: newState,
            });
          }
          return;
        }
        // 保存滚动位置
        if (command === this.options.saveCommand) {
          this.context.workspaceState.update(this.options.scrollKey, payload || 0);
          return;
        }
        await this.handleCustomMessage(msg, webviewView);
      } catch (err: any) {
        // 统一错误处理与回传
        vscode.window.showErrorMessage(err?.message || 'Webview 请求发生错误');
        try {
          webviewView.webview.postMessage({
            payload: { ok: 0, msg: err?.message || '请求失败' },
            uuid: msg.uuid,
          });
        } catch {
          // 忽略二次错误回传失败
        }
      }
    });

    // showImg 配置注入
    const config = vscode.workspace.getConfiguration('touchfish');
    let showImg = config.get('showImg') as boolean | undefined;
    if (showImg === undefined) showImg = true;

    webviewView.webview.html = getWebviewHtml({
      webviewView,
      context: this.context,
      distPath: this.options.distPath,
      devPort: this.options.devPort,
      title: this.options.title,
      windowConfig: { showImg },
    });
  }
}
