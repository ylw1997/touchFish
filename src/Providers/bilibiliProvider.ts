/*
 * @Description: Bilibili Webview Provider
 */
import { WebviewView, ExtensionContext, window } from "vscode";
import {
  getRecommend,
  getDynamic,
  getWatchLater,
  getFavoriteFolders,
  getFavoriteDetail,
  addToWatchLater,
  getPlayUrl,
} from "../api/bilibili";
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
    const { command, payload, uuid } = message;
    switch (command) {
      case "BILIBILI_RECOMMEND": {
        let res = await getRecommend();
        if (res.data?.code !== 0) {
          if (res.data?.code === -101) {
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
      case "BILIBILI_DYNAMIC": {
        const { page, offset } = payload || { page: 1 };
        let res = await getDynamic(page, offset);
        if (res.data?.code !== 0) {
          if (res.data?.code === -101) {
            const cookie = await window.showInputBox({
              placeHolder: "请输入B站的cookie",
              prompt: "请输入B站的cookie（从浏览器开发者工具中获取）",
            });
            if (cookie) {
              await setConfigByKey("bilibiliCookie", cookie);
              res = await getDynamic(page, offset);
            }
          } else {
            showInfo(`获取B站动态失败: ${res.data?.message || "未知错误"}`);
          }
        }
        webviewView.webview.postMessage({
          command: "BILIBILI_DYNAMIC_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_WATCHLATER": {
        const { page = 1, pageSize = 20 } = payload || {};
        let res = await getWatchLater(page, pageSize);
        if (res.data?.code !== 0) {
          if (res.data?.code === -101) {
            const cookie = await window.showInputBox({
              placeHolder: "请输入B站的cookie",
              prompt: "请输入B站的cookie（从浏览器开发者工具中获取）",
            });
            if (cookie) {
              await setConfigByKey("bilibiliCookie", cookie);
              res = await getWatchLater(page, pageSize);
            }
          } else {
            showInfo(`获取B站待看失败: ${res.data?.message || "未知错误"}`);
          }
        }
        webviewView.webview.postMessage({
          command: "BILIBILI_WATCHLATER_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_FAVORITE_FOLDERS": {
        let res = await getFavoriteFolders();
        if (res.data?.code !== 0) {
          if (res.data?.code === -101) {
            const cookie = await window.showInputBox({
              placeHolder: "请输入B站的cookie",
              prompt: "请输入B站的cookie（从浏览器开发者工具中获取）",
            });
            if (cookie) {
              await setConfigByKey("bilibiliCookie", cookie);
              res = await getFavoriteFolders();
            }
          } else {
            showInfo(`获取B站收藏夹失败: ${res.data?.message || "未知错误"}`);
          }
        }
        webviewView.webview.postMessage({
          command: "BILIBILI_FAVORITE_FOLDERS_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_FAVORITE_DETAIL": {
        const { mediaId, page = 1, pageSize = 20 } = payload || {};
        let res = await getFavoriteDetail(mediaId, page, pageSize);
        if (res.data?.code !== 0) {
          if (res.data?.code === -101) {
            const cookie = await window.showInputBox({
              placeHolder: "请输入B站的cookie",
              prompt: "请输入B站的cookie（从浏览器开发者工具中获取）",
            });
            if (cookie) {
              await setConfigByKey("bilibiliCookie", cookie);
              res = await getFavoriteDetail(mediaId, page, pageSize);
            }
          } else {
            showInfo(
              `获取B站收藏夹详情失败: ${res.data?.message || "未知错误"}`
            );
          }
        }
        webviewView.webview.postMessage({
          command: "BILIBILI_FAVORITE_DETAIL_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_ADD_TO_WATCHLATER": {
        const { bvid } = payload || {};
        const res = await addToWatchLater(bvid);
        webviewView.webview.postMessage({
          command: "BILIBILI_ADD_TO_WATCHLATER_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_PLAYURL": {
        const { bvid, cid } = payload || {};
        const res = await getPlayUrl(bvid, cid);
        webviewView.webview.postMessage({
          command: "BILIBILI_PLAYURL_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
    }
  }
}
