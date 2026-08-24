import { WebviewView, ExtensionContext } from "vscode";
import * as vscode from "vscode";
import {
  DOUYIN_UA,
  diggDouyinVideo,
  getDouyinComments,
  getDouyinDanmaku,
  getDouyinFeed,
  getDouyinFollowedLiveRooms,
  getDouyinFollowing,
  getDouyinLiveFeed,
  getDouyinPlayableLiveRoom,
  resolveDouyinPlayUrl,
  getDouyinUserPosts,
  getDouyinUserProfile,
  getDouyinHeaders,
} from "../api/douyin";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";
import { DouyinLiveDanmakuSession } from "../api/douyinLiveDanmaku";
import { DouyinMediaProxy } from "../api/douyinMediaProxy";
import { DouyinBrowserFavorites } from "../api/douyinBrowserFavorites";

interface DouyinMessage<T = any> {
  command: string;
  payload?: T;
  uuid?: string;
}

export class DouyinProvider extends BaseWebviewProvider {
  private _webviewView?: WebviewView;
  private liveDanmakuSession?: DouyinLiveDanmakuSession;
  private readonly mediaProxy: DouyinMediaProxy;
  private readonly browserFavorites = new DouyinBrowserFavorites();

  private async reportMediaCapability(payload: unknown) {
    const { h264, aac } = (payload || {}) as { h264?: boolean; aac?: boolean };
    const warningKey = "touchfish.douyinCodecWarningVersion";
    if (h264 && aac) {
      await this.context.globalState.update(warningKey, undefined);
      return;
    }

    if (this.context.globalState.get<string>(warningKey) === vscode.version) return;
    await this.context.globalState.update(warningKey, vscode.version);

    const action = await vscode.window.showWarningMessage(
      `检测到 VS Code ${vscode.version} 缺少 H.264/AAC 媒体解码支持，抖音视频和直播可能无法播放。VS Code 升级后会重新覆盖 ffmpeg.dll。`,
      "查看解决方法",
    );
    if (action !== "查看解决方法") return;
    await vscode.env.openExternal(
      vscode.Uri.parse(
        "https://github.com/ylw1997/touchFish#%EF%B8%8F-%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9",
      ),
    );
  }

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
    this.mediaProxy = new DouyinMediaProxy(() =>
      getDouyinHeaders({ "User-Agent": DOUYIN_UA }),
    );
    context.subscriptions.push(this.mediaProxy);
    context.subscriptions.push(this.browserFavorites);
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    this._webviewView = webviewView;
    webviewView.onDidDispose(() => {
      this.liveDanmakuSession?.stop();
      this.liveDanmakuSession = undefined;
    });
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
      case "DY_REPORT_MEDIA_CAPABILITY": {
        await this.reportMediaCapability(payload);
        break;
      }
      case "DY_GET_HOME_FEED": {
        const { refresh_index, view_count } = (payload || {}) as {
          refresh_index?: number;
          view_count?: number;
        };
        const data = await getDouyinFeed(refresh_index || 1, view_count || 0);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "DY_GET_FAVORITES": {
        const maxCursor = (payload && (payload as any).max_cursor) || 0;
        const cookie =
          vscode.workspace
            .getConfiguration("touchfish")
            .get<string>("douyinCookie") || "";
        const data = await this.browserFavorites.get(maxCursor, cookie);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "DY_GET_COMMENTS": {
        const { aweme_id, cursor } = (payload || {}) as { aweme_id: string; cursor: number };
        if (!aweme_id) {
          throw new Error("视频 ID 不能为空");
        }
        const data = await getDouyinComments(aweme_id, cursor || 0);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "DY_GET_DANMAKU": {
        const { aweme_id, duration, start } = (payload || {}) as {
          aweme_id: string;
          duration: number;
          start: number;
        };
        if (!aweme_id || !duration) {
          throw new Error("弹幕请求缺少视频信息");
        }
        const data = await getDouyinDanmaku(aweme_id, duration, start || 0);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "DY_RESOLVE_PLAY_URL": {
        const { url } = (payload || {}) as { url: string };
        if (!url) throw new Error("播放地址不能为空");
        const data = await resolveDouyinPlayUrl(url);
        const proxiedUrl = await this.mediaProxy.createUrl(data.url);
        webviewView.webview.postMessage({ payload: { url: proxiedUrl }, uuid });
        break;
      }
      case "DY_GET_FOLLOWING": {
        const maxCursor = (payload && (payload as any).max_cursor) || 0;
        const data = await getDouyinFollowing(maxCursor);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "DY_GET_USER_POSTS": {
        const { sec_user_id, max_cursor } = (payload || {}) as {
          sec_user_id: string;
          max_cursor?: number;
        };
        if (!sec_user_id) {
          throw new Error("作者 ID 不能为空");
        }
        const data = await getDouyinUserPosts(sec_user_id, max_cursor || 0);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "DY_GET_USER_PROFILE": {
        const { sec_user_id } = (payload || {}) as { sec_user_id: string };
        if (!sec_user_id) throw new Error("作者 ID 不能为空");
        const data = await getDouyinUserProfile(sec_user_id);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "DY_GET_LIVE_FEED": {
        const { max_time } = (payload || {}) as { max_time?: number };
        const data = await getDouyinLiveFeed(max_time || 0);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "DY_GET_FOLLOWED_LIVE": {
        const data = await getDouyinFollowedLiveRooms();
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "DY_GET_PLAYABLE_LIVE": {
        const { web_rid } = (payload || {}) as { web_rid: string };
        if (!web_rid) throw new Error("直播间 ID 不能为空");
        const data = await getDouyinPlayableLiveRoom(web_rid);
        webviewView.webview.postMessage({ payload: data, uuid });
        break;
      }
      case "DY_START_LIVE_DANMAKU": {
        const { room_id, web_rid } = (payload || {}) as {
          room_id: string;
          web_rid: string;
        };
        if (!room_id || !web_rid) throw new Error("直播弹幕缺少房间信息");
        this.liveDanmakuSession?.stop();
        const cookie =
          vscode.workspace
            .getConfiguration("touchfish")
            .get<string>("douyinCookie") || "";
        this.liveDanmakuSession = new DouyinLiveDanmakuSession(
          room_id,
          web_rid,
          cookie,
          (item) => {
            webviewView.webview.postMessage({
              command: "DY_LIVE_DANMAKU",
              payload: item,
            });
          },
          (status) => {
            webviewView.webview.postMessage({
              command: "DY_LIVE_DANMAKU_STATUS",
              payload: { status },
            });
          },
        );
        void this.liveDanmakuSession.start();
        webviewView.webview.postMessage({ payload: { started: true }, uuid });
        break;
      }
      case "DY_STOP_LIVE_DANMAKU": {
        this.liveDanmakuSession?.stop();
        this.liveDanmakuSession = undefined;
        webviewView.webview.postMessage({ payload: { stopped: true }, uuid });
        break;
      }
      case "DY_LIKE_VIDEO": {
        const { aweme_id, type } = (payload || {}) as { aweme_id: string; type: number };
        if (!aweme_id) {
          throw new Error("视频 ID 不能为空");
        }
        const data = await diggDouyinVideo(aweme_id, type);
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
