import { ExtensionContext, WebviewView, workspace } from "vscode";
import {
  getDiscoveryFeed,
  getEpisodeDetail,
  getEpisodeList,
  getPodcastDetail,
  getTopList,
  loginWithSms,
  searchPodcasts,
  sendSmsCode,
  setGlobalCredential,
  type XiaoyuzhouCredential,
  type XiaoyuzhouUserInfo,
} from "../api/xiaoyuzhou";
import { setConfigByKey } from "../core/config";
import { CommandsType } from "../../types/commands";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";

type SavedAuthState = {
  credential: XiaoyuzhouCredential | null;
  userInfo: XiaoyuzhouUserInfo | null;
};

export class XiaoyuzhouProvider extends BaseWebviewProvider {
  private authState: SavedAuthState = { credential: null, userInfo: null };
  private webviewView: WebviewView | null = null;

  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "xiaoyuzhou/dist",
      devPort: 5178,
      title: "小宇宙",
      scrollKey: "xiaoyuzhouScrollPosition",
      restoreCommand: "XIAOYUZHOU_RESTORE_SCROLL_POSITION",
      saveCommand: "XIAOYUZHOU_SAVE_SCROLL_POSITION",
    });

    this.syncAuthFromConfig();

    workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("touchfish.xiaoyuzhouAccessToken") ||
        e.affectsConfiguration("touchfish.xiaoyuzhouRefreshToken") ||
        e.affectsConfiguration("touchfish.xiaoyuzhouUserInfo")
      ) {
        this.syncAuthFromConfig();
        void this.notifyAuthState();
      }
    });
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    this.webviewView = webviewView;
    const resolved = super.resolveWebviewView(webviewView);
    void this.notifyAuthState();
    return resolved;
  }

  private syncAuthFromConfig() {
    const config = workspace.getConfiguration("touchfish");
    const accessToken = (config.get<string>("xiaoyuzhouAccessToken") || "").trim();
    const refreshToken = (config.get<string>("xiaoyuzhouRefreshToken") || "").trim();
    const rawUserInfo = (config.get<string>("xiaoyuzhouUserInfo") || "").trim();

    let userInfo: XiaoyuzhouUserInfo | null = null;
    if (rawUserInfo) {
      try {
        userInfo = JSON.parse(rawUserInfo) as XiaoyuzhouUserInfo;
      } catch {
        userInfo = null;
      }
    }

    if (accessToken && refreshToken) {
      this.authState = {
        credential: { accessToken, refreshToken },
        userInfo,
      };
      setGlobalCredential(this.authState.credential);
      return;
    }

    this.authState = { credential: null, userInfo: null };
    setGlobalCredential(null);
  }

  private async saveAuthState(
    credential: XiaoyuzhouCredential,
    userInfo: XiaoyuzhouUserInfo | null,
  ) {
    this.authState = { credential, userInfo };
    setGlobalCredential(credential);

    await Promise.all([
      setConfigByKey("xiaoyuzhouAccessToken", credential.accessToken),
      setConfigByKey("xiaoyuzhouRefreshToken", credential.refreshToken),
      setConfigByKey(
        "xiaoyuzhouUserInfo",
        userInfo ? JSON.stringify(userInfo) : "",
      ),
    ]);
  }

  private async clearAuthState() {
    this.authState = { credential: null, userInfo: null };
    setGlobalCredential(null);

    await Promise.all([
      setConfigByKey("xiaoyuzhouAccessToken", ""),
      setConfigByKey("xiaoyuzhouRefreshToken", ""),
      setConfigByKey("xiaoyuzhouUserInfo", ""),
    ]);
  }

  private async notifyAuthState() {
    if (!this.webviewView) return;

    this.webviewView.webview.postMessage({
      command: "XIAOYUZHOU_AUTH_SYNC",
      payload: {
        isLoggedIn: Boolean(
          this.authState.credential?.accessToken &&
            this.authState.credential?.refreshToken,
        ),
        userInfo: this.authState.userInfo,
      },
    } as CommandsType<any>);
  }

  protected async handleCustomMessage(
    message: IncomingMessage,
    webviewView: WebviewView,
  ) {
    const { command, payload, uuid } = message;

    try {
      switch (command) {
        case "XIAOYUZHOU_SEND_CODE": {
          const result = await sendSmsCode(
            String(payload?.phoneNumber || ""),
            String(payload?.areaCode || "+86"),
          );
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_SEND_CODE_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "XIAOYUZHOU_LOGIN_WITH_SMS": {
          const result = await loginWithSms(
            String(payload?.phoneNumber || ""),
            String(payload?.verifyCode || ""),
            String(payload?.areaCode || "+86"),
          );

          if (result.code === 0 && result.data) {
            await this.saveAuthState(result.data.credential, result.data.userInfo);
            await this.notifyAuthState();
          }

          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_LOGIN_WITH_SMS_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "XIAOYUZHOU_GET_USER_INFO": {
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_GET_USER_INFO_RESULT",
            payload: {
              code: 0,
              data: {
                isLoggedIn: Boolean(this.authState.credential),
                userInfo: this.authState.userInfo,
              },
            },
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "XIAOYUZHOU_SET_CREDENTIAL": {
          const credential = payload?.credential || payload;
          const userInfo = payload?.userInfo || null;

          if (credential?.accessToken && credential?.refreshToken) {
            await this.saveAuthState(
              {
                accessToken: String(credential.accessToken),
                refreshToken: String(credential.refreshToken),
              },
              userInfo,
            );
            await this.notifyAuthState();
          }

          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_SET_CREDENTIAL_RESULT",
            payload: { code: 0, data: true },
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "XIAOYUZHOU_LOGOUT": {
          await this.clearAuthState();
          await this.notifyAuthState();
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_LOGOUT_RESULT",
            payload: { code: 0, data: true },
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "XIAOYUZHOU_GET_DISCOVERY_FEED": {
          const result = await getDiscoveryFeed(
            payload?.loadMoreKey,
            this.authState.credential,
          );
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_GET_DISCOVERY_FEED_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "XIAOYUZHOU_GET_TOP_LIST": {
          const result = await getTopList(
            payload?.category || "HOT",
            this.authState.credential,
          );
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_GET_TOP_LIST_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "XIAOYUZHOU_SEARCH_PODCASTS": {
          const result = await searchPodcasts(
            String(payload?.keyword || ""),
            payload?.loadMoreKey,
            this.authState.credential,
          );
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_SEARCH_PODCASTS_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "XIAOYUZHOU_GET_PODCAST_DETAIL": {
          const result = await getPodcastDetail(
            String(payload?.pid || ""),
            this.authState.credential,
          );
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_GET_PODCAST_DETAIL_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "XIAOYUZHOU_GET_EPISODE_LIST": {
          const result = await getEpisodeList(
            String(payload?.pid || ""),
            payload?.order || "desc",
            payload?.loadMoreKey,
            this.authState.credential,
          );
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_GET_EPISODE_LIST_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "XIAOYUZHOU_GET_EPISODE_DETAIL": {
          const result = await getEpisodeDetail(
            String(payload?.eid || ""),
            this.authState.credential,
          );
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_GET_EPISODE_DETAIL_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        default:
          break;
      }
    } catch (error: any) {
      webviewView.webview.postMessage({
        command: `${command}_RESULT`,
        payload: {
          code: -1,
          message: error?.message || "请求失败",
        },
        uuid,
      } as CommandsType<any>);
    }
  }
}
