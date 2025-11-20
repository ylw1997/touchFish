/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-22 08:49:53
 * @LastEditTime: 2025-11-19 17:04:32
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\xhsWebProvider.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
/*
 * XhsWebProvider: 小红书 Webview 列表展示 (仿知乎实现, 精简版)
 */
import { WebviewView, ExtensionContext } from "vscode";
import * as vscode from "vscode";
import { showWarn, showInfo, showError } from '../utils/errorMessage';
import {
  getXhsFeed,
  getXhsFeedDetail,
  getXhsComments,
  searchXhsNotes,
  getXhsUserPosted,
  getXhsUserHoverCard,
  followXhsUser,
  unfollowXhsUser,
  getXhsSubComments,
  likeXhsNote,
  dislikeXhsNote,
} from "../api/xhs";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";

interface XhsMessage<T = any> {
  command: string;
  payload?: T;
  uuid?: string;
}

/**
 * 获取小红书原图URL
 * @param imgUrl 展示图URL
 * @returns 原图URL，解析失败返回原URL
 */
function getXhsOriginalImageUrl(imgUrl: string): string {
  try {
    // 情况1: URL包含.jpg
    // 示例: https://sns-webpic-qc.xhscdn.com/202403211626/c4fcecea4bd012a1fe8d2f1968d6aa91/110/0/01e50c1c135e8c010010000000018ab74db332_0.jpg!nd_dft_wlteh_webp_3
    if (imgUrl.includes(".jpg")) {
      const parts = imgUrl.split("/");
      const lastThreeParts = parts.slice(-3).join("/");
      const imgId = lastThreeParts.split("!")[0];
      return `https://sns-img-qc.xhscdn.com/${imgId}`;
    }
    // 情况2: URL包含spectrum
    // 示例: https://sns-webpic-qc.xhscdn.com/202403231640/ea961053c4e0e467df1cc93afdabd630/spectrum/1000g0k0200n7mj8fq0005n7ikbllol6q50oniuo!nd_dft_wgth_webp_3
    else if (imgUrl.includes("spectrum")) {
      const parts = imgUrl.split("/");
      const lastTwoParts = parts.slice(-2).join("/");
      const imgId = lastTwoParts.split("!")[0];
      return `http://sns-webpic.xhscdn.com/${imgId}?imageView2/2/w/format/jpg`;
    }
    // 情况3: 其他格式
    // 示例: http://sns-webpic-qc.xhscdn.com/202403181511/64ad2ea67ce04159170c686a941354f5/1040g008310cs1hii6g6g5ngacg208q5rlf1gld8!nd_dft_wlteh_webp_3
    else {
      const parts = imgUrl.split("/");
      const imgId = parts[parts.length - 1].split("!")[0];
      return `https://sns-img-qc.xhscdn.com/${imgId}`;
    }
  } catch (e) {
    console.error("解析原图URL失败:", e);
    return imgUrl; // 解析失败返回原URL
  }
}

export class XhsWebProvider extends BaseWebviewProvider {
  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "xhs/dist",
      devPort: 5175,
      title: "小红书",
      scrollKey: "xhsScrollPosition",
      restoreCommand: "XHS_RESTORE_SCROLL_POSITION",
      saveCommand: "XHS_SAVE_SCROLL_POSITION",
      imgToggledCommand: "XHS_IMG_TOGGLED",
    });
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    return super.resolveWebviewView(webviewView);
  }

  protected async handleCustomMessage(message: IncomingMessage, webviewView: WebviewView) {
    const { command, payload, uuid } = message as XhsMessage;
    switch (command) {
      case "XHS_GET_HOME_FEED": {
        const cursor = (payload && (payload as any).cursor) || "";
        const data = await getXhsFeed(cursor);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "XHS_SEARCH": {
        const { keyword, page, search_id } = (payload || {}) as any;
        if (!keyword) throw new Error("缺少搜索关键词");
        const data = await searchXhsNotes({ keyword, page, search_id });
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "XHS_FEED_DETAIL": {
        const detailPayload = payload as any;
        const data = await getXhsFeedDetail(detailPayload);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "XHS_GET_COMMENTS": {
        const commentPayload = payload as any;
        const data = await getXhsComments(commentPayload);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "XHS_GET_SUB_COMMENTS": {
        const subPayload = payload as any;
        const data = await getXhsSubComments(subPayload);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "XHS_GET_USER_POSTED": {
        const userPayload = payload as any;
        const data = await getXhsUserPosted(userPayload);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "XHS_USER_HOVER_CARD": {
        const hoverPayload = payload as any;
        const data = await getXhsUserHoverCard(hoverPayload);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "XHS_USER_FOLLOW": {
        const followPayload = payload as any;
        const data = await followXhsUser(followPayload);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "XHS_USER_UNFOLLOW": {
        const unfollowPayload = payload as any;
        const data = await unfollowXhsUser(unfollowPayload);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "XHS_NOTE_LIKE": {
        const likePayload = payload as any;
        const data = await likeXhsNote(likePayload);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "XHS_NOTE_DISLIKE": {
        const dislikePayload = payload as any;
        const data = await dislikeXhsNote(dislikePayload);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "XHS_DOWNLOAD_IMAGE": {
        const { url, fileName } = (payload || {}) as { url: string; fileName: string };
        if (!url) throw new Error("缺少图片URL");
        const originalUrl = getXhsOriginalImageUrl(url);
        const isOriginal = originalUrl !== url;
        let downloadedData: ArrayBuffer | null = null;
        let imageType = "图片";
        try {
          const axiosModule = await import("axios");
          const axiosInstance = axiosModule.default.create({ timeout: 10000 });
          if (isOriginal) {
            try {
              const response = await axiosInstance.get(originalUrl, {
                responseType: "arraybuffer",
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                  Referer: "https://www.xiaohongshu.com/",
                },
                timeout: 10000,
                validateStatus: (status) => status === 200,
              });
              const dataLength = response.data?.length || response.data?.byteLength || 0;
              if (!response.data || dataLength === 0) throw new Error("下载的数据为空");
              downloadedData = response.data;
              imageType = "原图";
             
            } catch {
              showWarn("原图下载失败，正在尝试下载展示图...");
              const response = await axiosInstance.get(url, {
                responseType: "arraybuffer",
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                  Referer: "https://www.xiaohongshu.com/",
                },
                timeout: 10000,
                validateStatus: (status) => status === 200,
              });
              const dataLength = response.data?.length || response.data?.byteLength || 0;
              if (!response.data || dataLength === 0) throw new Error("下载的数据为空");
              downloadedData = response.data;
              imageType = "展示图";
            }
          } else {
            const response = await axiosInstance.get(url, {
              responseType: "arraybuffer",
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                Referer: "https://www.xiaohongshu.com/",
              },
              timeout: 10000,
              validateStatus: (status) => status === 200,
            });
            const dataLength = response.data?.length || response.data?.byteLength || 0;
            if (!response.data || dataLength === 0) throw new Error("下载的数据为空");
            downloadedData = response.data;
            imageType = "展示图";
          }
          if (downloadedData) {
            const defaultUri = vscode.Uri.file(fileName || "image.jpg");
            const uri = await vscode.window.showSaveDialog({
              defaultUri,
              filters: { Images: ["jpg", "jpeg", "png", "webp"] },
            });
            if (uri) {
              await vscode.workspace.fs.writeFile(uri, new Uint8Array(downloadedData));
              showInfo(`${imageType}已保存到: ${uri.fsPath}`);
            }
          }
        } catch (downloadErr: any) {
          if (!downloadedData) {
            const errorMsg = downloadErr.response?.status === 404
              ? `下载失败: 图片不存在(404)`
              : `下载失败: ${downloadErr.message}`;
            showError(errorMsg);
            throw downloadErr; // 让基类捕获并回传
          }
        }
        break;
      }
    }
  }
}
