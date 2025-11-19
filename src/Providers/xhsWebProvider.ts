/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-22 08:49:53
 * @LastEditTime: 2025-11-10 09:11:31
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\xhsWebProvider.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
/*
 * XhsWebProvider: 小红书 Webview 列表展示 (仿知乎实现, 精简版)
 */
import { WebviewViewProvider, WebviewView, ExtensionContext } from "vscode";
import * as vscode from "vscode";
import {
  getXhsFeed,
  getXhsFeedDetail,
  getXhsComments,
  searchXhsNotes,
  getXhsUserPosted,
  getXhsUserHoverCard,
  followXhsUser,
  unfollowXhsUser,
} from "../api/xhs";
import { getWebviewHtml } from "../utils/webviewUtils";

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

export class XhsWebProvider implements WebviewViewProvider {
  constructor(private context: ExtensionContext) {}

  public resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        const pos = this.context.workspaceState.get("xhsScrollPosition", 0);
        webviewView.webview.postMessage({
          command: "XHS_RESTORE_SCROLL_POSITION",
          payload: pos,
        });
      }
    });

    webviewView.webview.onDidReceiveMessage(async (msg: XhsMessage) => {
      const { command, payload, uuid } = msg;
      try {
        switch (command) {
          case "TOGGLE_SHOW_IMG": {
            const newState = !!payload;
            const config = vscode.workspace.getConfiguration("touchfish");
            await config.update("showImg", newState, true);
            vscode.window.showInformationMessage(
              `图片已设置为${newState ? "显示" : "隐藏"}`
            );
            webviewView.webview.postMessage({
              command: "XHS_IMG_TOGGLED",
              payload: newState,
            });
            break;
          }
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
            const commentPayload = payload as any; // { note_id, cursor, xsec_token }
            const data = await getXhsComments(commentPayload);
            webviewView.webview.postMessage({ payload: data, uuid });
            break;
          }
          case "XHS_GET_USER_POSTED": {
            // payload: { user_id, cursor, xsec_token }
            const userPayload = payload as any;
            const data = await getXhsUserPosted(userPayload);
            webviewView.webview.postMessage({ payload: data, uuid });
            break;
          }
          case "XHS_USER_HOVER_CARD": {
            const hoverPayload = payload as any; // { target_user_id, xsec_token, xsec_source }
            const data = await getXhsUserHoverCard(hoverPayload);
            webviewView.webview.postMessage({ payload: data, uuid });
            break;
          }
          case "XHS_USER_FOLLOW": {
            const followPayload = payload as any; // { target_user_id }
            const data = await followXhsUser(followPayload);
            webviewView.webview.postMessage({ payload: data, uuid });
            // vscode.window.showInformationMessage('关注成功');
            break;
          }
          case "XHS_USER_UNFOLLOW": {
            const unfollowPayload = payload as any; // { target_user_id }
            const data = await unfollowXhsUser(unfollowPayload);
            webviewView.webview.postMessage({ payload: data, uuid });
            // vscode.window.showInformationMessage('已取消关注');
            break;
          }
          case "XHS_SAVE_SCROLL_POSITION": {
            this.context.workspaceState.update(
              "xhsScrollPosition",
              payload || 0
            );
            break;
          }
          case "XHS_REQUEST_RESTORE_SCROLL": {
            const pos = this.context.workspaceState.get("xhsScrollPosition", 0);
            webviewView.webview.postMessage({
              command: "XHS_RESTORE_SCROLL_POSITION",
              payload: pos,
            });
            break;
          }
          case "XHS_DOWNLOAD_IMAGE": {
            const { url, fileName } = (payload || {}) as {
              url: string;
              fileName: string;
            };
            if (!url) throw new Error("缺少图片URL");

            // 尝试解析原图URL
            const originalUrl = getXhsOriginalImageUrl(url);
            const isOriginal = originalUrl !== url;

            let downloadedData: ArrayBuffer | null = null;
            let imageType = "图片";

            // 使用 VSCode API 下载图片
            try {
              // 创建独立的 axios 实例，避免被全局拦截器影响
              const axiosModule = await import("axios");
              const axiosInstance = axiosModule.default.create({
                timeout: 10000,
              });

              // 先尝试下载原图
              if (isOriginal) {
                try {
                  console.log(`尝试下载原图: ${originalUrl}`);
                  const response = await axiosInstance.get(originalUrl, {
                    responseType: "arraybuffer",
                    headers: {
                      "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                      Referer: "https://www.xiaohongshu.com/",
                    },
                    timeout: 10000, // 10秒超时
                    validateStatus: (status) => status === 200, // 只接受200状态码
                  });

                  // 检查数据是否有效（Node.js中response.data是Buffer）
                  const dataLength =
                    response.data?.length || response.data?.byteLength || 0;
                  if (!response.data || dataLength === 0) {
                    throw new Error("下载的数据为空");
                  }

                  downloadedData = response.data;
                  imageType = "原图";
                  console.log(`原图下载成功，大小: ${dataLength} bytes`);
                } catch (firstErr: any) {
                  console.log(
                    `原图下载失败 (${firstErr.message})，尝试下载展示图: ${url}`
                  );
                  vscode.window.showWarningMessage(
                    `原图下载失败，正在尝试下载展示图...`
                  );
                  // 原图下载失败，尝试下载展示图
                  try {
                    const response = await axiosInstance.get(url, {
                      responseType: "arraybuffer",
                      headers: {
                        "User-Agent":
                          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        Referer: "https://www.xiaohongshu.com/",
                      },
                      timeout: 10000,
                      validateStatus: (status) => status === 200,
                    });

                    // 检查数据是否有效
                    const dataLength =
                      response.data?.length || response.data?.byteLength || 0;
                    if (!response.data || dataLength === 0) {
                      throw new Error("下载的数据为空");
                    }

                    downloadedData = response.data;
                    imageType = "展示图";
                    console.log(`展示图下载成功，大小: ${dataLength} bytes`);
                  } catch (secondErr: any) {
                    console.log(`展示图下载也失败: ${secondErr.message}`);
                    // 两个都失败了，抛出最后的错误
                    throw secondErr;
                  }
                }
              } else {
                // 直接下载展示图
                console.log(`下载展示图: ${url}`);
                const response = await axiosInstance.get(url, {
                  responseType: "arraybuffer",
                  headers: {
                    "User-Agent":
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    Referer: "https://www.xiaohongshu.com/",
                  },
                  timeout: 10000,
                  validateStatus: (status) => status === 200,
                });

                // 检查数据是否有效
                const dataLength =
                  response.data?.length || response.data?.byteLength || 0;
                if (!response.data || dataLength === 0) {
                  throw new Error("下载的数据为空");
                }

                downloadedData = response.data;
                console.log(`展示图下载成功，大小: ${dataLength} bytes`);
              }

              // 下载成功后，让用户选择保存位置
              if (downloadedData) {
                const defaultUri = vscode.Uri.file(fileName || "image.jpg");
                const uri = await vscode.window.showSaveDialog({
                  defaultUri,
                  filters: {
                    Images: ["jpg", "jpeg", "png", "webp"],
                  },
                });

                if (uri) {
                  await vscode.workspace.fs.writeFile(
                    uri,
                    new Uint8Array(downloadedData)
                  );
                  vscode.window.showInformationMessage(
                    `${imageType}已保存到: ${uri.fsPath}`
                  );
                }
              }
            } catch (downloadErr: any) {
              // 只有真正失败时才显示错误（降级成功不算失败）
              console.log(
                `外层catch捕获异常, downloadedData状态: ${
                  downloadedData ? "有数据" : "无数据"
                }`
              );
              if (!downloadedData) {
                const errorMsg =
                  downloadErr.response?.status === 404
                    ? `下载失败: 图片不存在(404) - ${
                        downloadErr.config?.url || ""
                      }`
                    : `下载失败: ${downloadErr.message}`;
                vscode.window.showErrorMessage(errorMsg);
                // 真正失败时，重新抛出异常
                throw downloadErr;
              }
              // 如果 downloadedData 有值，说明降级成功，不抛出异常，吞掉错误
              console.log(`降级下载成功，不显示错误`);
            }
            break;
          }
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(err?.message || "小红书请求发生错误");
        webviewView.webview.postMessage({
          payload: { ok: 0, msg: err?.message || "请求失败" },
          uuid,
        });
      }
    });

    const config = vscode.workspace.getConfiguration("touchfish");
    let showImg = config.get("showImg") as boolean | undefined;
    if (showImg === undefined) showImg = true;

    webviewView.webview.html = getWebviewHtml({
      webviewView,
      context: this.context,
      distPath: "xhs/dist",
      devPort: 5175,
      title: "小红书",
      windowConfig: { showImg },
    });
  }

  // 旧的内联实现保留以便回退（暂不删除，可根据需要恢复）
}
