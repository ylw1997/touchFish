/**
 * QQ音乐 Webview Provider
 */
import { ExtensionContext, WebviewView, workspace } from "vscode";
import { MusicStatusBar } from "../core/musicStatusBar";
import {
  addSongsToPlaylist,
  checkLoginStatus,
  getGuessRecommend,
  getLyric,
  getMyFavorite,
  getMyPlaylists,
  getPlaylistDetail,
  getQQLoginQR,
  getWXLoginQR,
  getRadarRecommend,
  getRankDetail,
  getRankLists,
  getRecommendPlaylists,
  getSingerInfo,
  getSingerSongs,
  getSongDetail,
  getSongUrl,
  getUserInfo,
  onQQMusicCredentialRefreshed,
  removeSongsFromPlaylist,
  searchSingers,
  searchSongs,
  setGlobalCredential,
  type QQMusicCredential,
} from "../api/qqmusic";
import { setConfigByKey } from "../core/config";
import { CommandsType } from "../../types/commands";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";

export class QQMusicProvider extends BaseWebviewProvider {
  private credential: QQMusicCredential | null = null;
  private webviewView: WebviewView | null = null;
  private currentSongName = "";
  private currentLyric = "";
  private isPlaying = false;
  private showStatusBarLyric = true;
  private statusBarShowLyric = true;

  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "qqmusic/dist",
      devPort: 5177,
      title: "QQ音乐",
      scrollKey: "qqmusicScrollPosition",
      restoreCommand: "QQMUSIC_RESTORE_SCROLL_POSITION",
      saveCommand: "QQMUSIC_SAVE_SCROLL_POSITION",
    });

    this.loadConfig();

    workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("touchfish.qqmusicShowStatusBar") ||
        e.affectsConfiguration("touchfish.qqmusicStatusBarShowLyric")
      ) {
        this.loadConfig();
        this.updateStatusBar();
      }

      if (e.affectsConfiguration("touchfish.qqmusicCredential")) {
        void this.syncCredentialFromConfig(true);
      }
    });

    onQQMusicCredentialRefreshed((cred) => {
      void this.saveCredential(cred);
    });

    void this.syncCredentialFromConfig(false);
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    this.webviewView = webviewView;
    const resolved = super.resolveWebviewView(webviewView);
    void this.notifyAuthState();
    return resolved;
  }

  private getCredentialFromConfig(): QQMusicCredential | null {
    const config = workspace.getConfiguration("touchfish");
    const rawCredential = (config.get<string>("qqmusicCredential") || "").trim();
    if (!rawCredential) return null;

    try {
      return this.toCredential(JSON.parse(rawCredential));
    } catch {
      return null;
    }
  }

  private toCredential(raw: any): QQMusicCredential | null {
    if (!raw?.musicid || !raw?.musickey) return null;
    const musickey = String(raw.musickey);
    return {
      musicid: String(raw.musicid),
      musickey,
      refresh_key: raw.refresh_key || "",
      refresh_token: raw.refresh_token || "",
      openid: raw.openid || "",
      unionid: raw.unionid || "",
      access_token: raw.access_token || "",
      expired_at: Number(raw.expired_at || 0),
      str_musicid: raw.str_musicid || String(raw.musicid),
      login_type:
        Number(raw.login_type || raw.loginType || 0) ||
        (musickey.startsWith("W_X") ? 1 : 2),
      musickeyCreateTime: Number(raw.musickeyCreateTime || 0),
      keyExpiresIn: Number(raw.keyExpiresIn || 0),
    };
  }

  private async syncCredentialFromConfig(notifyWebview: boolean) {
    this.credential = this.getCredentialFromConfig();
    setGlobalCredential(this.credential);
    if (notifyWebview) {
      await this.notifyAuthState();
    }
  }

  private async notifyAuthState() {
    if (!this.webviewView) return;

    if (!this.credential) {
      this.webviewView.webview.postMessage({
        command: "QQMUSIC_AUTH_SYNC",
        payload: { isLoggedIn: false, userInfo: null },
      });
      return;
    }

    try {
      const result = await getUserInfo(this.credential);
      this.webviewView.webview.postMessage({
        command: "QQMUSIC_AUTH_SYNC",
        payload: {
          isLoggedIn: result.code === 0,
          userInfo: result.code === 0 ? result.data : null,
        },
      });
    } catch (error) {
      console.error("[QQMusic] 同步登录状态失败:", error);
      this.webviewView.webview.postMessage({
        command: "QQMUSIC_AUTH_SYNC",
        payload: { isLoggedIn: false, userInfo: null },
      });
    }
  }

  private async saveCredential(cred: QQMusicCredential) {
    this.credential = cred;
    setGlobalCredential(cred);

    try {
      await setConfigByKey("qqmusicCredential", JSON.stringify(cred));
    } catch (err) {
      console.error("[QQMusic] 写入配置文件失败:", err);
    }

    await this.notifyAuthState();
  }

  private async clearCredential() {
    this.credential = null;
    setGlobalCredential(null);

    // Notify the webview immediately so UI updates promptly
    await this.notifyAuthState();

    // Clear config in the background (don't block the logout response)
    void setConfigByKey("qqmusicCredential", "")
      .catch((err) => console.error("[QQMusic] clear credential failed:", err));
  }

  private loadConfig() {
    const config = workspace.getConfiguration("touchfish");
    this.showStatusBarLyric = config.get<boolean>("qqmusicShowStatusBar", true);
    this.statusBarShowLyric = config.get<boolean>(
      "qqmusicStatusBarShowLyric",
      true,
    );
  }

  private updateStatusBar() {
    if (!this.showStatusBarLyric) {
      MusicStatusBar.getInstance().hide();
      return;
    }

    if (!this.currentSongName) {
      MusicStatusBar.getInstance().hide();
      return;
    }

    const content =
      this.statusBarShowLyric && this.currentLyric.trim()
        ? this.currentLyric.trim()
        : this.currentSongName;

    MusicStatusBar.getInstance().update({
      module: "qqmusic",
      title: content,
      artist: this.statusBarShowLyric ? this.currentSongName : undefined,
      isPlaying: this.isPlaying,
    });
  }

  public sendNextSongCommand() {
    this.webviewView?.webview.postMessage({
      command: "QQMUSIC_PLAY_NEXT_COMMAND",
      payload: true,
    });
  }

  public sendPlayPauseCommand() {
    this.webviewView?.webview.postMessage({
      command: "QQMUSIC_PLAY_PAUSE_COMMAND",
      payload: true,
    });
  }

  public pause() {
    this.webviewView?.webview.postMessage({
      command: "QQMUSIC_PAUSE_COMMAND",
      payload: true,
    });
  }

  protected async handleCustomMessage(
    message: IncomingMessage,
    webviewView: WebviewView,
  ) {
    const { command, payload, uuid } = message;

    try {
      switch (command) {
        case "QQMUSIC_SEARCH": {
          const { keyword, page, num } = payload || {};
          const result = await searchSongs(keyword, page || 1, num || 20);
          webviewView.webview.postMessage({
            command: "QQMUSIC_SEARCH_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_SEARCH_SINGER": {
          const { keyword } = payload || {};
          const result = await searchSingers(keyword);
          webviewView.webview.postMessage({
            command: "QQMUSIC_SEARCH_SINGER_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_GET_SINGER_INFO": {
          const { mid } = payload || {};
          const result = await getSingerInfo(mid);
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_SINGER_INFO_RESULT",
            payload: result,
            uuid,
          } as any);
          break;
        }

        case "QQMUSIC_GET_SINGER_SONGS": {
          const { mid, page, num } = payload || {};
          const result = await getSingerSongs(mid, page || 1, num || 30);
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_SINGER_SONGS_RESULT",
            payload: result,
            uuid,
          } as any);
          break;
        }

        case "QQMUSIC_GET_SONG_URL": {
          const { mid, quality, credential } = payload || {};
          const result = await getSongUrl(mid, quality || 128, credential);
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_SONG_URL_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_GET_SONG_DETAIL": {
          const { mid } = payload || {};
          const result = await getSongDetail(mid);
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_SONG_DETAIL_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_GET_LYRIC": {
          const { mid } = payload || {};
          const result = await getLyric(mid);
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_LYRIC_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_GET_RECOMMEND_PLAYLISTS": {
          const { num } = payload || {};
          const result = await getRecommendPlaylists(num || 10);
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_RECOMMEND_PLAYLISTS_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_GET_PLAYLIST_DETAIL": {
          const { dissid, page, num } = payload || {};
          const result = await getPlaylistDetail(dissid, page || 1, num || 30);
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_PLAYLIST_DETAIL_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_GET_RANK_LISTS": {
          const result = await getRankLists();
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_RANK_LISTS_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_GET_RANK_DETAIL": {
          const { topId, page, num } = payload || {};
          const result = await getRankDetail(topId, page || 1, num || 30);
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_RANK_DETAIL_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_GET_LOGIN_QR": {
          const { type } = payload || {};
          const result =
            type === "qq" ? await getQQLoginQR() : await getWXLoginQR();
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_LOGIN_QR_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_CHECK_LOGIN_STATUS": {
          const { identifier, type } = payload || {};
          const result = await checkLoginStatus(identifier, type);

          if (result.code === 0 && result.data?.userInfo) {
            const userInfo = result.data.userInfo;
            const credential = this.toCredential(userInfo);
            if (credential) {
              await this.saveCredential(credential);

              try {
                const detailedUserInfo = await getUserInfo(credential);
                if (detailedUserInfo.code === 0 && detailedUserInfo.data) {
                  userInfo.nickname = detailedUserInfo.data.nickname;
                  userInfo.avatar = detailedUserInfo.data.avatar;
                }
              } catch (err) {
                console.error("[QQMusic] 获取用户信息失败:", err);
              }
            }
          }

          webviewView.webview.postMessage({
            command: "QQMUSIC_CHECK_LOGIN_STATUS_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_LOGIN_WITH_CREDENTIAL": {
          const { credential: cred } = payload || {};
          const loginCred = cred || payload;
          const credential = this.toCredential(loginCred);
          if (credential) {
            await this.saveCredential(credential);
          }
          const result = await getUserInfo(loginCred);
          webviewView.webview.postMessage({
            command: "QQMUSIC_LOGIN_WITH_CREDENTIAL_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_SET_CREDENTIAL": {
          const setCred = payload?.credential || payload;
          const credential = this.toCredential(setCred);
          if (credential) {
            await this.saveCredential(credential);
          }
          webviewView.webview.postMessage({
            command: "QQMUSIC_SET_CREDENTIAL_RESULT",
            payload: { code: 0, data: true },
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_LOGOUT": {
          // Clear credential immediately (synchronous)
          this.credential = null;
          setGlobalCredential(null);

          // Send result first so webview doesn't hang
          webviewView.webview.postMessage({
            command: "QQMUSIC_LOGOUT_RESULT",
            payload: { code: 0, data: true },
            uuid,
          } as CommandsType<any>);

          // Notify auth state asynchronously
          void this.notifyAuthState();

          // Clear config in background
          void setConfigByKey("qqmusicCredential", "")
            .catch((err) => console.error("[QQMusic] clear credential failed:", err));
          break;
        }

        case "QQMUSIC_GET_USER_INFO": {
          const { credential } = payload || {};
          const result = await getUserInfo(credential || this.credential);
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_USER_INFO_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_GET_MY_FAVORITE": {
          const { credential, page, num } = payload || {};
          const result = await getMyFavorite(credential, page || 1, num || 30);
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_MY_FAVORITE_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_GET_MY_PLAYLISTS": {
          const { credential } = payload || {};
          const result = await getMyPlaylists(credential);
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_MY_PLAYLISTS_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_ADD_SONGS_TO_PLAYLIST": {
          const { dirid, songIds } = payload || {};
          const result = await addSongsToPlaylist(dirid, songIds);
          webviewView.webview.postMessage({
            command: "QQMUSIC_ADD_SONGS_TO_PLAYLIST_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_REMOVE_SONGS_FROM_PLAYLIST": {
          const { dirid, songIds } = payload || {};
          const result = await removeSongsFromPlaylist(dirid, songIds);
          webviewView.webview.postMessage({
            command: "QQMUSIC_REMOVE_SONGS_FROM_PLAYLIST_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_GET_RADAR_RECOMMEND": {
          const result = await getRadarRecommend();
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_RADAR_RECOMMEND_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_GET_GUESS_RECOMMEND": {
          const result = await getGuessRecommend();
          webviewView.webview.postMessage({
            command: "QQMUSIC_GET_GUESS_RECOMMEND_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_UPDATE_PLAYING_STATUS": {
          const { songName, lyric, isPlaying } = payload || {};
          this.currentSongName = songName || "";
          this.currentLyric = lyric || "";
          this.isPlaying = Boolean(isPlaying);
          this.updateStatusBar();
          break;
        }

        default:
          console.warn(`未知的命令: ${command}`);
          break;
      }
    } catch (error: any) {
      console.error(`处理命令 ${command} 失败:`, error);
      webviewView.webview.postMessage({
        command: `${command}_RESULT`,
        payload: {
          code: -1,
          message: error.message || "请求失败",
        },
        uuid,
      } as CommandsType<any>);
    }
  }
}
