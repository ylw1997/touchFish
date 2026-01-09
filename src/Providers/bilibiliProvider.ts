/*
 * @Description: Bilibili Webview Provider
 */
import { WebviewView, ExtensionContext, window } from "vscode";
import { getRecommend } from "../api/bilibili";
import { CommandsType } from "../../types/commands";
import { setConfigByKey } from "../core/config";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";
import { showInfo } from "../utils/errorMessage";

export class BilibiliProvider extends BaseWebviewProvider {
  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "bilibili/dist",
      devPort: 5176,
      title: "Bilibili",
      scrollKey: "bilibiliScrollPosition",
      restoreCommand: "RESTORE_SCROLL_POSITION",
      saveCommand: "SAVE_SCROLL_POSITION",
    });
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    return super.resolveWebviewView(webviewView);
  }

  protected async handleCustomMessage(
    message: IncomingMessage,
    webviewView: WebviewView
  ) {
    const { command, uuid } = message;
    switch (command) {
      case "BILIBILI_RECOMMEND": {
        let res = await getRecommend();
        if (res.data?.code !== 0) {
          if (res.data?.code === -101) {
            // 未登录，请求设置 Cookie
            const cookie = await window.showInputBox({
              placeHolder: "请输入B站的cookie",
              prompt: "请输入B站的cookie（从浏览器开发者工具中获取）",
            });
            if (cookie) {
              await setConfigByKey("bilibiliCookie", cookie);
              res = await getRecommend();
            }
          } else {
            showInfo(`获取B站推荐失败: ${res.data?.message || "未知错误"}`);
          }
        }
        webviewView.webview.postMessage({
          command: "BILIBILI_RECOMMEND_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
    }
  }
}
