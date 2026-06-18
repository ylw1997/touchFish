import { WebviewView, ExtensionContext } from "vscode";
import * as vscode from "vscode";
import { getDouyinFeed, getDouyinFavorites } from "../api/douyin";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";

interface DouyinMessage<T = any> {
  command: string;
  payload?: T;
  uuid?: string;
}

export class DouyinProvider extends BaseWebviewProvider {
  private _webviewView?: WebviewView;

  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "douyin/dist",
      devPort: 5188,
      title: "抖音",
      scrollKey: "douyinScrollPosition",
      restoreCommand: "DY_RESTORE_SCROLL_POSITION",
      saveCommand: "DY_SAVE_SCROLL_POSITION",
      imgToggledCommand: "DY_IMG_TOGGLED",
    });
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    this._webviewView = webviewView;
    return super.resolveWebviewView(webviewView);
  }

  /** 通知前端强制刷新 feed */
  public refreshWebview() {
    if (this._webviewView) {
      this._webviewView.webview.postMessage({ command: "DY_FORCE_REFRESH" });
    }
  }

  protected async handleCustomMessage(
    message: IncomingMessage,
    webviewView: WebviewView
  ) {
    const { command, payload, uuid } = message as DouyinMessage;
    switch (command) {
      case "DY_GET_HOME_FEED": {
        const data = await getDouyinFeed();
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "DY_GET_FAVORITES": {
        const maxCursor = (payload && (payload as any).max_cursor) || 0;
        const data = await getDouyinFavorites(maxCursor);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "DY_SAVE_COOKIE": {
        const { cookie } = (payload || {}) as { cookie: string };
        if (cookie) {
          await vscode.workspace.getConfiguration("touchfish").update("douyinCookie", cookie, true);
          webviewView.webview.postMessage({ payload: { success: true }, uuid });
        } else {
          throw new Error("Cookie 不能为空");
        }
        break;
      }
      case "DY_OPEN_COOKIE_SETTING": {
        await vscode.commands.executeCommand("touchfish.setDouyinCookie");
        break;
      }
    }
  }
}
