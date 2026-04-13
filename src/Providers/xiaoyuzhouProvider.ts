import { ExtensionContext, WebviewView, workspace } from "vscode";
import {
  getGlobalCredential,
  getDiscoveryFeed,
  getEpisodeDetail,
  getEpisodeList,
  getPilotDiscoveryList,
  getPodcastDetail,
  getSubscriptions,
  getTopList,
  loginWithSms,
  searchPodcasts,
  sendSmsCode,
  setGlobalCredential,
  type XiaoyuzhouCredential,
  type XiaoyuzhouUserInfo,
} from "../api/xiaoyuzhou";
import { getDeviceId } from "../api/xiaoyuzhouShared";
import { setConfigByKey } from "../core/config";
import { CommandsType } from "../../types/commands";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";

type SavedAuthState = {
  credential: XiaoyuzhouCredential | null;
  userInfo: XiaoyuzhouUserInfo | null;
  deviceId: string | null;
};

export class XiaoyuzhouProvider extends BaseWebviewProvider {
  private authState: SavedAuthState = { credential: null, userInfo: null, deviceId: null };
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
        e.affectsConfiguration("touchfish.xiaoyuzhouUserInfo") ||
        e.affectsConfiguration("touchfish.xiaoyuzhouDeviceId")
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
    const savedDeviceId = (config.get<string>("xiaoyuzhouDeviceId") || "").trim();

    let userInfo: XiaoyuzhouUserInfo | null = null;
    if (rawUserInfo) {
      try {
        userInfo = JSON.parse(rawUserInfo) as XiaoyuzhouUserInfo;
      } catch {
        userInfo = null;
      }
    }

    // 确定 deviceId：优先使用保存的，其次基于 token 生成
    let deviceId: string | null = null;
    if (savedDeviceId) {
      deviceId = savedDeviceId;
    } else if (refreshToken || accessToken) {
      deviceId = getDeviceId(refreshToken || accessToken);
    }

    if (accessToken && refreshToken) {
      this.authState = {
        credential: { accessToken, refreshToken },
        userInfo,
        deviceId,
      };
      setGlobalCredential(this.authState.credential);
      return;
    }

    this.authState = { credential: null, userInfo: null, deviceId: null };
    setGlobalCredential(null);
  }

  private async saveAuthState(
    credential: XiaoyuzhouCredential,
    userInfo: XiaoyuzhouUserInfo | null,
  ) {
    // 生成或复用 deviceId
    const deviceId = this.authState.deviceId || getDeviceId(credential.refreshToken);

    this.authState = { credential, userInfo, deviceId };
    setGlobalCredential(credential);

    await Promise.all([
      setConfigByKey("xiaoyuzhouAccessToken", credential.accessToken),
      setConfigByKey("xiaoyuzhouRefreshToken", credential.refreshToken),
      setConfigByKey(
        "xiaoyuzhouUserInfo",
        userInfo ? JSON.stringify(userInfo) : "",
      ),
      setConfigByKey("xiaoyuzhouDeviceId", deviceId),
    ]);
  }

  private async clearAuthState() {
    console.log("[xiaoyuzhouProvider] Clearing auth state...");

    // 先清除内存状态
    this.authState = { credential: null, userInfo: null, deviceId: null };
    setGlobalCredential(null);
    console.log("[xiaoyuzhouProvider] Memory state cleared");

    // 获取当前配置用于对比
    const configBefore = workspace.getConfiguration("touchfish");
    const accessTokenBefore = configBefore.get<string>("xiaoyuzhouAccessToken");
    console.log("[xiaoyuzhouProvider] Before clear - has accessToken:", !!accessTokenBefore);

    try {
      console.log("[xiaoyuzhouProvider] Calling setConfigByKey to clear tokens...");
      await Promise.all([
        setConfigByKey("xiaoyuzhouAccessToken", ""),
        setConfigByKey("xiaoyuzhouRefreshToken", ""),
        setConfigByKey("xiaoyuzhouUserInfo", ""),
        setConfigByKey("xiaoyuzhouDeviceId", ""),
      ]);
      console.log("[xiaoyuzhouProvider] setConfigByKey calls completed");

      // 验证配置是否被清除
      const configAfter = workspace.getConfiguration("touchfish");
      const accessTokenAfter = configAfter.get<string>("xiaoyuzhouAccessToken");
      const refreshTokenAfter = configAfter.get<string>("xiaoyuzhouRefreshToken");

      console.log("[xiaoyuzhouProvider] After clear - accessToken exists:", !!accessTokenAfter);
      console.log("[xiaoyuzhouProvider] After clear - refreshToken exists:", !!refreshTokenAfter);

      if (accessTokenAfter || refreshTokenAfter) {
        console.error("[xiaoyuzhouProvider] ERROR: Tokens still exist after clearing!");
      } else {
        console.log("[xiaoyuzhouProvider] Tokens cleared successfully");
      }
    } catch (error) {
      console.error("[xiaoyuzhouProvider] Failed to clear auth state:", error);
      throw error;
    }
  }

  private async persistRefreshedCredential() {
    const latestCredential = getGlobalCredential();
    if (
      !latestCredential ||
      !this.authState.credential ||
      (latestCredential.accessToken === this.authState.credential.accessToken &&
        latestCredential.refreshToken === this.authState.credential.refreshToken)
    ) {
      return;
    }

    await this.saveAuthState(latestCredential, this.authState.userInfo);
    await this.notifyAuthState();
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
    console.log(`[xiaoyuzhouProvider] Received message: ${command}, uuid: ${uuid}`);

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
          try {
            console.log("[xiaoyuzhou] Handling logout command...");
            await this.clearAuthState();
            await this.notifyAuthState();
            webviewView.webview.postMessage({
              command: "XIAOYUZHOU_LOGOUT_RESULT",
              payload: { code: 0, data: true },
              uuid,
            } as CommandsType<any>);
            console.log("[xiaoyuzhou] Logout command completed");
          } catch (error) {
            console.error("[xiaoyuzhou] Logout failed:", error);
            webviewView.webview.postMessage({
              command: "XIAOYUZHOU_LOGOUT_RESULT",
              payload: { code: -1, message: String(error), data: false },
              uuid,
            } as CommandsType<any>);
          }
          break;
        }

        case "XIAOYUZHOU_GET_DISCOVERY_FEED": {
          const result = await getDiscoveryFeed(
            payload?.loadMoreKey,
            this.authState.credential,
          );
          await this.persistRefreshedCredential();
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_GET_DISCOVERY_FEED_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "XIAOYUZHOU_GET_PILOT_DISCOVERY_LIST": {
          const result = await getPilotDiscoveryList(this.authState.credential);
          await this.persistRefreshedCredential();
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_GET_PILOT_DISCOVERY_LIST_RESULT",
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
          await this.persistRefreshedCredential();
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
          await this.persistRefreshedCredential();
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
          await this.persistRefreshedCredential();
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
          await this.persistRefreshedCredential();
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
          await this.persistRefreshedCredential();
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_GET_EPISODE_DETAIL_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "XIAOYUZHOU_GET_SUBSCRIPTIONS": {
          const result = await getSubscriptions(
            payload?.loadMoreKey || null,
            this.authState.credential,
          );
          await this.persistRefreshedCredential();
          webviewView.webview.postMessage({
            command: "XIAOYUZHOU_GET_SUBSCRIPTIONS_RESULT",
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
