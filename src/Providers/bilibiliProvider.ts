/*
 * @Description: Bilibili Webview Provider
 */
import { WebviewView, ExtensionContext, window, WebviewPanel } from "vscode";
import {
  getRecommend,
  getPopular,
  getFollowedLiveList,
  getLiveList,
  getLivePlayUrl,
  getDynamic,
  getWatchLater,
  getFavoriteFolders,
  getFavoriteDetail,
  addToWatchLater,
  getPlayUrl,
  delWatchLater,
  getBilibiliHeaders,
  getDanmaku,
  searchAll,
  getUserVideos,
  getUserCard,
  modifyRelation,
  generateQRCode,
  pollQRCode,
  getLoginUserInfo,
} from "../api/bilibili";
import { CommandsType } from "../../types/commands";
import { setConfigByKey, getConfigByKey } from "../core/config";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";
import { showInfo } from "../utils/errorMessage";

interface UserInfo {
  mid: number;
  uname: string;
  face: string;
  level?: number;
}

export class BilibiliProvider extends BaseWebviewProvider {
  private pipPanel: WebviewPanel | null = null;
  private mainWebviewView: WebviewView | null = null;

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
    this.mainWebviewView = webviewView;

    // 同步登录状态
    this.syncAuthState(webviewView);

    return super.resolveWebviewView(webviewView);
  }

  private async syncAuthState(webviewView: WebviewView) {
    try {
      const cookie = getConfigByKey("bilibiliCookie");
      if (cookie) {
        const userRes = await getLoginUserInfo(cookie);
        if (userRes.code === 0 && userRes.data) {
          const userInfo: UserInfo = {
            mid: userRes.data.mid,
            uname: userRes.data.uname,
            face: userRes.data.face,
            level: userRes.data.level,
          };
          webviewView.webview.postMessage({
            command: "BILIBILI_AUTH_SYNC",
            payload: {
              isLoggedIn: true,
              userInfo,
            },
          });
        } else {
          // Cookie已失效
          webviewView.webview.postMessage({
            command: "BILIBILI_AUTH_SYNC",
            payload: {
              isLoggedIn: false,
              userInfo: null,
            },
          });
        }
      } else {
        webviewView.webview.postMessage({
          command: "BILIBILI_AUTH_SYNC",
          payload: {
            isLoggedIn: false,
            userInfo: null,
          },
        });
      }
    } catch (error) {
      console.error("[BilibiliProvider] 同步登录状态失败:", error);
    }
  }

  private createPipPanel(payload: any) {
    if (this.pipPanel) {
      this.pipPanel.reveal();
      return;
    }

    this.pipPanel = window.createWebviewPanel(
      "bilibiliPipPlayer",
      payload?.currentVideo?.title || "Bilibili 播放器",
      {
        viewColumn: -2, // 在第二个窗口打开
        preserveFocus: true,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.context.extensionUri],
      },
    );

    // 设置窗口大小
    (this.pipPanel as any).webview.options = {
      ...(this.pipPanel as any).webview.options,
      enableScripts: true,
    };

    // 设置 HTML 内容
    this.pipPanel.webview.html = this.getPipHtml(payload);

    // 监听画中画窗口的消息
    this.pipPanel.webview.onDidReceiveMessage((message) => {
      // 转发消息到主窗口
      if (this.mainWebviewView) {
        this.mainWebviewView.webview.postMessage(message);
      }
    });

    // 监听窗口关闭
    this.pipPanel.onDidDispose(() => {
      this.pipPanel = null;
      // 通知主窗口画中画已关闭
      if (this.mainWebviewView) {
        this.mainWebviewView.webview.postMessage({
          command: "BILIBILI_PIP_WINDOW_CLOSED",
        });
      }
    });
  }

  private closePipPanel() {
    if (this.pipPanel) {
      this.pipPanel.dispose();
      this.pipPanel = null;
    }
  }

  private getPipHtml(payload: any): string {
    const { currentVideo, isPlaying, playlist } = payload || {};

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${currentVideo?.title || "Bilibili 播放器"}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1e1e1e;
            color: #fff;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .video-container {
            flex-shrink: 0;
            width: 100%;
            aspect-ratio: 16/9;
            background: #000;
            position: relative;
        }
        .playlist-container {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }
        .playlist-item {
            display: flex;
            gap: 10px;
            padding: 8px;
            margin-bottom: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .playlist-item:hover {
            background: rgba(255,255,255,0.2);
        }
        .playlist-item.active {
            background: rgba(251, 114, 153, 0.3);
        }
        .playlist-item img {
            width: 80px;
            height: 45px;
            object-fit: cover;
            border-radius: 4px;
        }
        .playlist-item-info {
            flex: 1;
            min-width: 0;
        }
        .playlist-item-title {
            font-size: 13px;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
        .playlist-item-author {
            font-size: 11px;
            color: #999;
            margin-top: 4px;
        }
        .controls {
            display: flex;
            gap: 10px;
            padding: 10px;
            background: rgba(0,0,0,0.5);
            justify-content: center;
        }
        .btn {
            padding: 8px 16px;
            background: #fb7299;
            border: none;
            border-radius: 4px;
            color: #fff;
            cursor: pointer;
            font-size: 13px;
        }
        .btn:hover {
            background: #ff85a7;
        }
        .btn-secondary {
            background: #666;
        }
        .btn-secondary:hover {
            background: #888;
        }
        .placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="video-container">
        <div class="placeholder">
            <p>视频播放器（画中画模式）</p>
        </div>
    </div>
    
    <div class="playlist-container" id="playlist">
        <!-- 播放列表将在这里渲染 -->
    </div>
    
    <div class="controls">
        <button class="btn" onclick="prevVideo()">⏮ 上一首</button>
        <button class="btn" onclick="togglePlay()">${isPlaying ? "⏸ 暂停" : "▶ 播放"}</button>
        <button class="btn" onclick="nextVideo()">⏭ 下一首</button>
        <button class="btn btn-secondary" onclick="closePip()">✕ 关闭</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentVideo = ${JSON.stringify(currentVideo || null)};
        let isPlaying = ${isPlaying || false};
        let playlist = ${JSON.stringify(playlist || [])};

        // 渲染播放列表
        function renderPlaylist() {
            const container = document.getElementById('playlist');
            if (!container) return;
            
            if (playlist.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">暂无播放列表</div>';
                return;
            }
            
            container.innerHTML = playlist.map(video => \`
                <div class="playlist-item \${currentVideo && currentVideo.id === video.id ? 'active' : ''}" 
                     onclick="playVideo(\${video.id})">
                    <img src="\${video.pic}" alt="\${video.title}">
                    <div class="playlist-item-info">
                        <div class="playlist-item-title">\${video.title}</div>
                        <div class="playlist-item-author">\${video.owner?.name || ''}</div>
                    </div>
                </div>
            \`).join('');
        }

        // 播放指定视频
        function playVideo(videoId) {
            const video = playlist.find(v => v.id === videoId);
            if (video) {
                currentVideo = video;
                vscode.postMessage({
                    command: 'PIP_PLAY_VIDEO',
                    payload: { videoId }
                });
                renderPlaylist();
            }
        }

        // 播放/暂停
        function togglePlay() {
            isPlaying = !isPlaying;
            vscode.postMessage({
                command: 'PIP_TOGGLE_PLAY',
                payload: { isPlaying }
            });
            // 更新按钮文字
            const btn = document.querySelector('.controls .btn:nth-child(2)');
            if (btn) {
                btn.textContent = isPlaying ? '⏸ 暂停' : '▶ 播放';
            }
        }

        // 上一首
        function prevVideo() {
            vscode.postMessage({
                command: 'PIP_PREV_VIDEO'
            });
        }

        // 下一首
        function nextVideo() {
            vscode.postMessage({
                command: 'PIP_NEXT_VIDEO'
            });
        }

        // 关闭画中画
        function closePip() {
            vscode.postMessage({
                command: 'PIP_CLOSE'
            });
        }

        // 监听来自主窗口的消息
        window.addEventListener('message', (event) => {
            const { command, payload } = event.data;
            switch (command) {
                case 'PIP_UPDATE_STATE':
                    if (payload.currentVideo) currentVideo = payload.currentVideo;
                    if (payload.isPlaying !== undefined) isPlaying = payload.isPlaying;
                    if (payload.playlist) playlist = payload.playlist;
                    renderPlaylist();
                    // 更新播放按钮
                    const btn = document.querySelector('.controls .btn:nth-child(2)');
                    if (btn) {
                        btn.textContent = isPlaying ? '⏸ 暂停' : '▶ 播放';
                    }
                    break;
            }
        });

        // 初始化
        renderPlaylist();
    </script>
</body>
</html>`;
  }

  protected async handleCustomMessage(
    message: IncomingMessage,
    webviewView: WebviewView,
  ) {
    const { command, payload, uuid } = message;
    switch (command) {
      case "BILIBILI_RECOMMEND": {
        const res = await getRecommend();
        if (res.data?.code !== 0) {
          if (res.data?.code === -101) {
            showInfo("B站 Cookie 失效或未配置", "配置 Cookie").then(
              async (selection) => {
                if (selection === "配置 Cookie") {
                  const cookie = await window.showInputBox({
                    placeHolder: "请输入B站的cookie",
                    prompt: "请输入B站的cookie（从浏览器开发者工具中获取）",
                  });
                  if (cookie) {
                    await setConfigByKey("bilibiliCookie", cookie);
                    window.showInformationMessage(
                      "Cookie 设置成功，请点击刷新按钮",
                    );
                  }
                }
              },
            );
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
      case "BILIBILI_POPULAR": {
        const { page = 1 } = payload || {};
        const res = await getPopular(page);
        if (res.data?.code !== 0) {
          if (res.data?.code === -101) {
            showInfo("B站 Cookie 失效或未配置", "配置 Cookie").then(
              async (selection) => {
                if (selection === "配置 Cookie") {
                  const cookie = await window.showInputBox({
                    placeHolder: "请输入B站的cookie",
                    prompt: "请输入B站的cookie（从浏览器开发者工具中获取）",
                  });
                  if (cookie) {
                    await setConfigByKey("bilibiliCookie", cookie);
                    window.showInformationMessage(
                      "Cookie 设置成功，请点击刷新按钮",
                    );
                  }
                }
              },
            );
          } else {
            showInfo(`获取B站热门失败: ${res.data?.message || "未知错误"}`);
          }
        }
        webviewView.webview.postMessage({
          command: "BILIBILI_POPULAR_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_LIVE": {
        const { page = 1 } = payload || {};
        const res = await getLiveList(page);
        if (res.data?.code !== 0) {
          showInfo(`获取B站直播失败: ${res.data?.message || "未知错误"}`);
        }
        webviewView.webview.postMessage({
          command: "BILIBILI_LIVE_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_FOLLOWED_LIVE": {
        const { page = 1, pageSize = 50 } = payload || {};
        const res = await getFollowedLiveList(page, pageSize);
        webviewView.webview.postMessage({
          command: "BILIBILI_FOLLOWED_LIVE_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_LIVE_PLAYURL": {
        const { roomId, qn = 10000 } = payload || {};
        const res = await getLivePlayUrl(roomId, qn);
        if (res.data?.code !== 0) {
          showInfo(`获取直播流地址失败: ${res.data?.message || "未知错误"}`);
        }
        webviewView.webview.postMessage({
          command: "BILIBILI_LIVE_PLAYURL_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_DYNAMIC": {
        const { page, offset } = payload || { page: 1 };
        const res = await getDynamic(page, offset);
        if (res.data?.code !== 0) {
          if (res.data?.code === -101) {
            showInfo("B站 Cookie 失效或未配置", "配置 Cookie").then(
              async (selection) => {
                if (selection === "配置 Cookie") {
                  const cookie = await window.showInputBox({
                    placeHolder: "请输入B站的cookie",
                    prompt: "请输入B站的cookie（从浏览器开发者工具中获取）",
                  });
                  if (cookie) {
                    await setConfigByKey("bilibiliCookie", cookie);
                    window.showInformationMessage(
                      "Cookie 设置成功，请点击刷新按钮",
                    );
                  }
                }
              },
            );
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
        const res = await getWatchLater(page, pageSize);
        if (res.data?.code !== 0) {
          if (res.data?.code === -101) {
            showInfo("B站 Cookie 失效或未配置", "配置 Cookie").then(
              async (selection) => {
                if (selection === "配置 Cookie") {
                  const cookie = await window.showInputBox({
                    placeHolder: "请输入B站的cookie",
                    prompt: "请输入B站的cookie（从浏览器开发者工具中获取）",
                  });
                  if (cookie) {
                    await setConfigByKey("bilibiliCookie", cookie);
                    window.showInformationMessage(
                      "Cookie 设置成功，请点击刷新按钮",
                    );
                  }
                }
              },
            );
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
        const res = await getFavoriteDetail(mediaId, page, pageSize);
        if (res.data?.code !== 0) {
          if (res.data?.code === -101) {
            showInfo("B站 Cookie 失效或未配置", "配置 Cookie").then(
              async (selection) => {
                if (selection === "配置 Cookie") {
                  const cookie = await window.showInputBox({
                    placeHolder: "请输入B站的cookie",
                    prompt: "请输入B站的cookie（从浏览器开发者工具中获取）",
                  });
                  if (cookie) {
                    await setConfigByKey("bilibiliCookie", cookie);
                    window.showInformationMessage(
                      "Cookie 设置成功，请点击刷新按钮",
                    );
                  }
                }
              },
            );
          } else {
            showInfo(
              `获取B站收藏夹详情失败: ${res.data?.message || "未知错误"}`,
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
      case "BILIBILI_WATCHLATER_DEL": {
        const { avid } = payload || {};
        // 从headers中获取cookie，再解析csrf
        const headers = await getBilibiliHeaders();
        const cookie = headers["Cookie"] || "";
        const csrf = cookie.match(/bili_jct=([^;]+)/)?.[1] || "";

        const res = await delWatchLater(avid, csrf);
        webviewView.webview.postMessage({
          command: "BILIBILI_WATCHLATER_DEL_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_GET_DANMAKU": {
        const { cid } = payload || {};
        const res = await getDanmaku(cid);
        webviewView.webview.postMessage({
          command: "BILIBILI_GET_DANMAKU_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_SEARCH": {
        const { keyword, page } = payload || {};
        const res = await searchAll(keyword, page || 1);
        webviewView.webview.postMessage({
          command: "BILIBILI_SEARCH_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_USER_VIDEOS": {
        const { mid, page } = payload || {};
        const res = await getUserVideos(mid, page || 1);
        webviewView.webview.postMessage({
          command: "BILIBILI_USER_VIDEOS_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_USER_CARD": {
        const { mid } = payload || {};
        const res = await getUserCard(mid);
        webviewView.webview.postMessage({
          command: "BILIBILI_USER_CARD_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_MODIFY_RELATION": {
        const { fid, act } = payload || {};
        const res = await modifyRelation(fid, act);
        webviewView.webview.postMessage({
          command: "BILIBILI_MODIFY_RELATION_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "PIP_PLAY_VIDEO":
      case "PIP_TOGGLE_PLAY":
      case "PIP_PREV_VIDEO":
      case "PIP_NEXT_VIDEO":
      case "PIP_CLOSE": {
        // 转发画中画窗口的消息到主窗口
        webviewView.webview.postMessage({
          command,
          payload,
          uuid,
        });
        break;
      }
      case "BILIBILI_GET_LOGIN_QR": {
        console.log("[BilibiliProvider] 开始生成二维码");
        try {
          const res = await generateQRCode();
          console.log("[BilibiliProvider] 生成二维码结果:", res);
          webviewView.webview.postMessage({
            command: "BILIBILI_GET_LOGIN_QR_RESULT",
            payload: res.data,
            uuid,
          } as CommandsType<any>);
        } catch (error: any) {
          console.error("[BilibiliProvider] 生成二维码失败:", error);
          webviewView.webview.postMessage({
            command: "BILIBILI_GET_LOGIN_QR_RESULT",
            payload: { code: -1, message: error.message },
            uuid,
          } as CommandsType<any>);
        }
        break;
      }
      case "BILIBILI_CHECK_LOGIN_STATUS": {
        const { qrcode_key } = payload || {};
        if (!qrcode_key) {
          webviewView.webview.postMessage({
            command: "BILIBILI_CHECK_LOGIN_STATUS_RESULT",
            payload: { code: -1, message: "缺少二维码key" },
            uuid,
          } as CommandsType<any>);
          break;
        }

        const res = await pollQRCode(qrcode_key);

        // 如果登录成功，保存cookie并获取用户信息
        if (res.data.code === 0 && res.data.data?.status === "success") {
          const cookie = res.data.data.cookie;
          if (cookie) {
            await setConfigByKey("bilibiliCookie", cookie);

            // 获取用户信息
            const userRes = await getLoginUserInfo(cookie);
            if (userRes.code === 0 && userRes.data) {
              const userInfo: UserInfo = {
                mid: userRes.data.mid,
                uname: userRes.data.uname,
                face: userRes.data.face,
                level: userRes.data.level,
              };

              webviewView.webview.postMessage({
                command: "BILIBILI_CHECK_LOGIN_STATUS_RESULT",
                payload: {
                  code: 0,
                  data: {
                    status: "success",
                    userInfo,
                  },
                },
                uuid,
              } as CommandsType<any>);

              // 发送登录状态同步消息
              webviewView.webview.postMessage({
                command: "BILIBILI_AUTH_SYNC",
                payload: {
                  isLoggedIn: true,
                  userInfo,
                },
              });
              break;
            }
          }
        }

        webviewView.webview.postMessage({
          command: "BILIBILI_CHECK_LOGIN_STATUS_RESULT",
          payload: res.data,
          uuid,
        } as CommandsType<any>);
        break;
      }
      case "BILIBILI_LOGOUT": {
        console.log("[BilibiliProvider] 收到退出登录请求");
        try {
          await setConfigByKey("bilibiliCookie", "");
          console.log("[BilibiliProvider] Cookie 已清除");
          webviewView.webview.postMessage({
            command: "BILIBILI_AUTH_SYNC",
            payload: {
              isLoggedIn: false,
              userInfo: null,
            },
          });
          console.log("[BilibiliProvider] 已发送退出登录状态同步");
        } catch (error: any) {
          console.error("[BilibiliProvider] 退出登录失败:", error);
        }
        break;
      }
    }
  }
}
