/**
 * QQ音乐 Webview Provider
 */
import { WebviewView, ExtensionContext, workspace } from "vscode";
import {
  searchSongs,
  searchSingers,
  getSongUrl,
  getSongDetail,
  getLyric,
  getRecommendPlaylists,
  getPlaylistDetail,
  getRankLists,
  getRankDetail,
  getQQLoginQR,
  getWXLoginQR,
  checkLoginStatus,
  getUserInfo,
  getMyFavorite,
  getMyPlaylists,
  setGlobalCredential,
  addSongsToPlaylist,
  removeSongsFromPlaylist,
  getRadarRecommend,
  getGuessRecommend,
} from "../api/qqmusic";
import { CommandsType } from "../../types/commands";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";
import { setConfigByKey } from "../core/config";

export class QQMusicProvider extends BaseWebviewProvider {
  private credential: { musicid: string; musickey: string } | null = null;
  private static readonly CREDENTIAL_KEY = "qqmusic-credential";

  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "qqmusic/dist",
      devPort: 5177,
      title: "QQ音乐",
      scrollKey: "qqmusicScrollPosition",
      restoreCommand: "QQMUSIC_RESTORE_SCROLL_POSITION",
      saveCommand: "QQMUSIC_SAVE_SCROLL_POSITION",
    });

    // 从 configuration 恢复凭证
    const config = workspace.getConfiguration("touchfish");
    const configId = config.get<string>("qqmusicMusicid");
    const configKey = config.get<string>("qqmusicMusickey");

    if (configId && configKey) {
      const cred = { musicid: configId, musickey: configKey };
      this.credential = cred;
      setGlobalCredential(cred);
      console.log(`[QQMusic] 从 configuration 恢复凭证: musicid=${configId}`);
    }
  }

  /** 保存凭证到配置文件 */
  private async saveCredential(cred: { musicid: string; musickey: string }) {
    this.credential = cred;
    setGlobalCredential(cred);
    
    try {
      await setConfigByKey("qqmusicMusicid", cred.musicid);
      await setConfigByKey("qqmusicMusickey", cred.musickey);
    } catch (err) {
      console.error("[QQMusic] 写入配置文件失败:", err);
    }
    
    console.log(`[QQMusic] 凭证已保存: musicid=${cred.musicid}`);
  }

  /** 清除凭证 */
  private async clearCredential() {
    this.credential = null;
    setGlobalCredential(null);
    
    try {
      await setConfigByKey("qqmusicMusicid", "");
      await setConfigByKey("qqmusicMusickey", "");
    } catch (err) {
      console.error("[QQMusic] 清除配置文件失败:", err);
    }
    
    console.log(`[QQMusic] 凭证已清除`);
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    return super.resolveWebviewView(webviewView);
  }

  protected async handleCustomMessage(
    message: IncomingMessage,
    webviewView: WebviewView
  ) {
    const { command, payload, uuid } = message;

    try {
      switch (command) {
        // ==================== 搜索 ====================
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
          const { keyword, page, num } = payload || {};
          const result = await searchSingers(keyword, page || 1, num || 20);
          webviewView.webview.postMessage({
            command: "QQMUSIC_SEARCH_SINGER_RESULT",
            payload: result,
            uuid,
          } as CommandsType<any>);
          break;
        }

        // ==================== 歌曲 ====================
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

        // ==================== 歌单 ====================
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

        // ==================== 排行榜 ====================
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

        // ==================== 登录 ====================
        case "QQMUSIC_GET_LOGIN_QR": {
          const { type } = payload || {};
          if (type === "qq") {
            const result = await getQQLoginQR();
            webviewView.webview.postMessage({
              command: "QQMUSIC_GET_LOGIN_QR_RESULT",
              payload: result,
              uuid,
            } as CommandsType<any>);
          } else {
            // 微信登录
            const result = await getWXLoginQR();
            webviewView.webview.postMessage({
              command: "QQMUSIC_GET_LOGIN_QR_RESULT",
              payload: result,
              uuid,
            } as CommandsType<any>);
          }
          break;
        }

        case "QQMUSIC_CHECK_LOGIN_STATUS": {
          const { identifier, type } = payload || {};
          const result = await checkLoginStatus(identifier, type);
          // 如果登录成功，保存 credential 到全局
          if (result.code === 0 && result.data?.userInfo) {
            this.saveCredential({
              musicid: result.data.userInfo.musicid,
              musickey: result.data.userInfo.musickey,
            });

            // 登录成功后，使用 GetLoginUserInfo 获取真实的称呼和头像
            try {
              const detailedUserInfo = await getUserInfo({
                musicid: result.data.userInfo.musicid,
                musickey: result.data.userInfo.musickey,
              });
              if (detailedUserInfo.code === 0 && detailedUserInfo.data) {
                result.data.userInfo.nickname = detailedUserInfo.data.nickname;
                result.data.userInfo.avatar = detailedUserInfo.data.avatar;
              }
            } catch (err) {
              console.error("[QQMusic] 获取用户信息失败:", err);
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
          const loginCred = cred || payload; // handle both { credential: {...} } and direct {...}
          if (loginCred?.musicid && loginCred?.musickey) {
            this.saveCredential({
              musicid: loginCred.musicid,
              musickey: loginCred.musickey,
            });
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
          console.log("[QQMusic] 收到 QQMUSIC_SET_CREDENTIAL Payload:", JSON.stringify(payload));
          console.log("[QQMusic] 收到 QQMUSIC_SET_CREDENTIAL setCred:", JSON.stringify(setCred));
          if (setCred?.musicid && setCred?.musickey) {
            this.saveCredential({
              musicid: setCred.musicid.toString(), // Force string just in case
              musickey: setCred.musickey,
            });
          }
          webviewView.webview.postMessage({
            command: "QQMUSIC_SET_CREDENTIAL_RESULT",
            payload: { code: 0, data: true },
            uuid,
          } as CommandsType<any>);
          break;
        }

        case "QQMUSIC_LOGOUT": {
          this.clearCredential();
          webviewView.webview.postMessage({
            command: "QQMUSIC_LOGOUT_RESULT",
            payload: { code: 0, data: true },
            uuid,
          } as CommandsType<any>);
          break;
        }

        // ==================== 用户 ====================
        case "QQMUSIC_GET_USER_INFO": {
          const { credential } = payload || {};
          const result = await getUserInfo(credential);
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
