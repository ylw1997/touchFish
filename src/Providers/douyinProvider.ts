import { WebviewView, ExtensionContext } from "vscode";
import * as vscode from "vscode";
import {
  diggDouyinVideo,
  getDouyinComments,
  getDouyinDanmaku,
  getDouyinFavorites,
  getDouyinFeed,
  getDouyinFollowedLiveRooms,
  getDouyinFollowing,
  getDouyinLiveFeed,
  getDouyinPlayableLiveRoom,
  resolveDouyinPlayUrl,
  getDouyinUserPosts,
  getDouyinUserProfile,
} from "../api/douyin";
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
        const data = await getDouyinFavorites(maxCursor);
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
        webviewView.webview.postMessage({ payload: data, uuid });
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
