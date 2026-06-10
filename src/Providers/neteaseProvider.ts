import { ExtensionContext, WebviewView, workspace } from "vscode";
import * as vscode from "vscode";
import { MusicStatusBar } from "../core/musicStatusBar";
import {
  setGlobalNeteaseCookie,
  getLoginStatus,
  logout,
  searchSongs,
  searchSingers,
  getSongUrl,
  getSongDetail,
  getLyric,
  getRecommendPlaylists,
  getPlaylistDetail,
  getUserPlaylists,
  getDailyRecommendSongs,
  getRankLists,
  getMusicComments,
  likeSong,
  getLikedSongIds,
  getArtistDetail,
  getArtistSongs,
  getPersonalFM,
  getQrKey,
  getQrCreate,
  getQrCheck,
} from "../api/netease";
import { setConfigByKey } from "../core/config";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";

export class NeteaseProvider extends BaseWebviewProvider {
  private cookie: string = "";
  private webviewView: WebviewView | null = null;
  private currentSongName = "";
  private currentLyric = "";
  private isPlaying = false;
  private showStatusBarLyric = true;
  private statusBarShowLyric = true;

  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "netease/dist",
      devPort: 5200,
      title: "网易云音乐",
      scrollKey: "neteaseScrollPosition",
      restoreCommand: "NETEASE_RESTORE_SCROLL_POSITION",
      saveCommand: "NETEASE_SAVE_SCROLL_POSITION",
    });

    this.loadConfig();

    // 监听配置变动
    workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("touchfish.neteaseShowStatusBar") ||
        e.affectsConfiguration("touchfish.neteaseStatusBarShowLyric")
      ) {
        this.loadConfig();
        this.updateStatusBar();
      }

      if (e.affectsConfiguration("touchfish.neteaseCredential")) {
        void this.syncCredentialFromConfig(true);
      }
    });

    void this.syncCredentialFromConfig(false);
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    this.webviewView = webviewView;
    const resolved = super.resolveWebviewView(webviewView);
    void this.notifyAuthState();
    this.notifyQuality();
    return resolved;
  }

  private notifyQuality() {
    if (!this.webviewView) return;
    const config = workspace.getConfiguration("touchfish");
    const quality = config.get<number>("neteaseQuality", 128);
    this.webviewView.webview.postMessage({
      command: "NETEASE_QUALITY_SYNC",
      payload: { quality },
    });
  }

  private getCredentialFromConfig(): string {
    const config = workspace.getConfiguration("touchfish");
    return (config.get<string>("neteaseCredential") || "").trim();
  }

  private async syncCredentialFromConfig(notifyWebview: boolean) {
    this.cookie = this.getCredentialFromConfig();
    setGlobalNeteaseCookie(this.cookie);
    if (notifyWebview) {
      await this.notifyAuthState();
    }
  }

  /**
   * 通知前端登录验证状态
   */
  private async notifyAuthState() {
    if (!this.webviewView) return;

    if (!this.cookie) {
      this.webviewView.webview.postMessage({
        command: "NETEASE_AUTH_SYNC",
        payload: { isLoggedIn: false, userInfo: null },
      });
      return;
    }

    try {
      const result = await getLoginStatus();
      // Binaryify API 的 /login/status 可能包含 profile
      const profile = result?.data?.profile || null;
      const isLoggedIn = !!profile;
      
      this.webviewView.webview.postMessage({
        command: "NETEASE_AUTH_SYNC",
        payload: {
          isLoggedIn,
          userInfo: profile ? {
            musicid: String(profile.userId),
            musickey: "netease_cookie",
            nickname: profile.nickname,
            avatarUrl: profile.avatarUrl,
            avatar: profile.avatarUrl, // 兼容前端头像渲染，解决拼写不一致问题
            userId: profile.userId,
            backgroundUrl: profile.backgroundUrl,
            signature: profile.signature
          } : null,
        },
      });
    } catch (error) {
      console.error("[Netease] 同步登录状态失败:", error);
      this.webviewView.webview.postMessage({
        command: "NETEASE_AUTH_SYNC",
        payload: { isLoggedIn: false, userInfo: null },
      });
    }
  }

  private async saveCredential(cookie: string) {
    this.cookie = cookie;
    setGlobalNeteaseCookie(cookie);

    try {
      await setConfigByKey("neteaseCredential", cookie);
    } catch (err) {
      console.error("[Netease] 写入配置文件失败:", err);
    }

    await this.notifyAuthState();
  }

  private async clearCredential() {
    this.cookie = "";
    setGlobalNeteaseCookie("");

    await this.notifyAuthState();

    void setConfigByKey("neteaseCredential", "")
      .catch((err) => console.error("[Netease] clear credential failed:", err));
  }

  private loadConfig() {
    const config = workspace.getConfiguration("touchfish");
    this.showStatusBarLyric = config.get<boolean>("neteaseShowStatusBar", true);
    this.statusBarShowLyric = config.get<boolean>(
      "neteaseStatusBarShowLyric",
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
      module: "netease",
      title: content,
      artist: this.statusBarShowLyric ? this.currentSongName : undefined,
      isPlaying: this.isPlaying,
    });
  }

  public sendNextSongCommand() {
    this.webviewView?.webview.postMessage({
      command: "NETEASE_PLAY_NEXT_COMMAND",
      payload: true,
    });
  }

  public sendPlayPauseCommand() {
    this.webviewView?.webview.postMessage({
      command: "NETEASE_PLAY_PAUSE_COMMAND",
      payload: true,
    });
  }

  public pause() {
    this.webviewView?.webview.postMessage({
      command: "NETEASE_PAUSE_COMMAND",
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
        case "NETEASE_GET_QUALITY": {
          this.notifyQuality();
          break;
        }
        case "NETEASE_SET_QUALITY": {
          const { quality } = payload || {};
          if (quality !== undefined) {
            await setConfigByKey("neteaseQuality", quality);
          }
          break;
        }
        // ==================== 搜索 & 歌曲 ====================
        case "NETEASE_SEARCH": {
          const { keyword, page, limit } = payload || {};
          const result = await searchSongs(keyword, page || 1, limit || 20);
          webviewView.webview.postMessage({
            command: "NETEASE_SEARCH_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_SEARCH_SINGERS": {
          const { keyword, page, limit } = payload || {};
          const result = await searchSingers(keyword, page || 1, limit || 20);
          webviewView.webview.postMessage({
            command: "NETEASE_SEARCH_SINGERS_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_GET_SONG_URL": {
          const { id, level } = payload || {};
          const result = await getSongUrl(id, level || "standard");
          if (result && result.data && Array.isArray(result.data)) {
            result.data = result.data.map((item: any) => {
              if (item && item.url) {
                // 将 http 强转 https
                if (item.url.startsWith("http://")) {
                  item.url = item.url.replace("http://", "https://");
                }
                // 替换网易云的旧节点为 m7c/m8c 等新节点，解决 HTTPS 加载慢的问题
                item.url = item.url.replace(/(m\d+)\.music\.126\.net/, "$1c.music.126.net");
              }
              return item;
            });
          }
          webviewView.webview.postMessage({
            command: "NETEASE_GET_SONG_URL_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_GET_SONG_DETAIL": {
          const { ids } = payload || {};
          const result = await getSongDetail(ids);
          webviewView.webview.postMessage({
            command: "NETEASE_GET_SONG_DETAIL_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_GET_LYRIC": {
          const { id } = payload || {};
          const result = await getLyric(id);
          webviewView.webview.postMessage({
            command: "NETEASE_GET_LYRIC_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        // ==================== 歌单 & 排行榜 ====================
        case "NETEASE_GET_RECOMMEND_PLAYLISTS": {
          const { limit } = payload || {};
          const result = await getRecommendPlaylists(limit || 10);
          webviewView.webview.postMessage({
            command: "NETEASE_GET_RECOMMEND_PLAYLISTS_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_GET_PLAYLIST_DETAIL": {
          const { id } = payload || {};
          const result = await getPlaylistDetail(id);
          webviewView.webview.postMessage({
            command: "NETEASE_GET_PLAYLIST_DETAIL_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_GET_USER_PLAYLISTS": {
          const { uid } = payload || {};
          const result = await getUserPlaylists(uid);
          webviewView.webview.postMessage({
            command: "NETEASE_GET_USER_PLAYLISTS_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_GET_DAILY_RECOMMEND": {
          const result = await getDailyRecommendSongs();
          webviewView.webview.postMessage({
            command: "NETEASE_GET_DAILY_RECOMMEND_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_GET_PERSONAL_FM": {
          const result = await getPersonalFM();
          webviewView.webview.postMessage({
            command: "NETEASE_GET_PERSONAL_FM_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_GET_RANK_LISTS": {
          const result = await getRankLists();
          webviewView.webview.postMessage({
            command: "NETEASE_GET_RANK_LISTS_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_GET_MUSIC_COMMENTS": {
          const { id, limit } = payload || {};
          const result = await getMusicComments(id, limit || 20);
          webviewView.webview.postMessage({
            command: "NETEASE_GET_MUSIC_COMMENTS_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        // ==================== 登录管理 ====================
        case "NETEASE_SET_CREDENTIAL": {
          const { cookie } = payload || {};
          if (cookie !== undefined) {
            await this.saveCredential(cookie);
            webviewView.webview.postMessage({
              command: "NETEASE_SET_CREDENTIAL_RESULT",
              payload: { code: 0, message: "Cookie 设置成功" },
              uuid,
            });
          } else {
            webviewView.webview.postMessage({
              command: "NETEASE_SET_CREDENTIAL_RESULT",
              payload: { code: -1, message: "Cookie 不能为空" },
              uuid,
            });
          }
          break;
        }

        case "NETEASE_TRIGGER_VSCODE_INPUT": {
          void vscode.commands.executeCommand("touchfish.setNeteaseCookie");
          webviewView.webview.postMessage({
            command: "NETEASE_TRIGGER_VSCODE_INPUT_RESULT",
            payload: { code: 0, message: "已触发输入框" },
            uuid,
          });
          break;
        }

        case "NETEASE_GET_QR_CODE": {
          try {
            const keyResult = await getQrKey();
            const key = keyResult?.unikey || keyResult?.data?.unikey;
            if (!key) {
              throw new Error("获取网易云扫码 Key 失败");
            }
            
            const qrResult = await getQrCreate(key);
            const qrimg = qrResult?.data?.qrimg;
            if (!qrimg) {
              throw new Error("生成网易云二维码图片失败");
            }

            webviewView.webview.postMessage({
              command: "NETEASE_GET_QR_CODE_RESULT",
              payload: {
                code: 0,
                data: {
                  data: qrimg,
                  identifier: key,
                  type: "netease",
                },
              },
              uuid,
            });
          } catch (error: any) {
            webviewView.webview.postMessage({
              command: "NETEASE_GET_QR_CODE_RESULT",
              payload: {
                code: -1,
                message: error.message || "获取网易云扫码二维码失败",
              },
              uuid,
            });
          }
          break;
        }

        case "NETEASE_CHECK_QR_STATUS": {
          try {
            const { identifier } = payload || {};
            if (!identifier) {
              throw new Error("未提供扫码 Key");
            }

            const checkResult = await getQrCheck(identifier);
            const code = checkResult?.code;
            
            let status = "pending";
            if (code === 800) {
              status = "timeout";
            } else if (code === 801) {
              status = "pending";
            } else if (code === 802) {
              status = "scanning";
            } else if (code === 803) {
              status = "success";
              const cookie = checkResult?.cookie;
              if (cookie) {
                await this.saveCredential(cookie);
              }
            }

            // 获取用户信息如果已登录
            let userInfo = null;
            if (status === "success" && checkResult?.cookie) {
              const statusResult = await getLoginStatus();
              const profile = statusResult?.data?.profile;
              if (profile) {
                userInfo = {
                  musicid: String(profile.userId),
                  musickey: "netease_cookie",
                  nickname: profile.nickname,
                  avatar: profile.avatarUrl,
                  vip: profile.vipType > 0,
                };
              }
            }

            webviewView.webview.postMessage({
              command: "NETEASE_CHECK_QR_STATUS_RESULT",
              payload: {
                code: 0,
                data: {
                  status,
                  userInfo,
                },
              },
              uuid,
            });
          } catch (error: any) {
            webviewView.webview.postMessage({
              command: "NETEASE_CHECK_QR_STATUS_RESULT",
              payload: {
                code: -1,
                message: error.message || "检查网易云登录状态失败",
              },
              uuid,
            });
          }
          break;
        }

        case "NETEASE_LOGOUT": {
          await logout();
          await this.clearCredential();
          
          webviewView.webview.postMessage({
            command: "NETEASE_LOGOUT_RESULT",
            payload: { code: 200, data: true },
            uuid,
          });
          break;
        }

        case "NETEASE_GET_USER_STATUS": {
          // 异步触发广播通知
          void this.notifyAuthState();

          // 直接返回回包以供前端 API 层面同步 await 获取
          const result = await getLoginStatus();
          const profile = result?.data?.profile || null;
          webviewView.webview.postMessage({
            command: "NETEASE_GET_USER_STATUS_RESULT",
            payload: {
              code: 0,
              data: profile ? {
                musicid: String(profile.userId),
                musickey: "netease_cookie",
                nickname: profile.nickname,
                avatar: profile.avatarUrl,
                vip: profile.vipType > 0
              } : null
            },
            uuid,
          });
          break;
        }

        case "NETEASE_LIKE_SONG": {
          const { id, like } = payload || {};
          const result = await likeSong(id, like);
          webviewView.webview.postMessage({
            command: "NETEASE_LIKE_SONG_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_GET_LIKED_SONG_IDS": {
          const result = await getLikedSongIds();
          webviewView.webview.postMessage({
            command: "NETEASE_GET_LIKED_SONG_IDS_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_GET_SINGER_INFO": {
          const { mid } = payload || {};
          const result = await getArtistDetail(mid);
          webviewView.webview.postMessage({
            command: "NETEASE_GET_SINGER_INFO_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        case "NETEASE_GET_SINGER_SONGS": {
          const { mid, page, num } = payload || {};
          const result = await getArtistSongs(mid, page, num);
          webviewView.webview.postMessage({
            command: "NETEASE_GET_SINGER_SONGS_RESULT",
            payload: result,
            uuid,
          });
          break;
        }

        // ==================== 状态栏联动 ====================
        case "NETEASE_UPDATE_PLAYING_STATUS": {
          const { songName, lyric, isPlaying } = payload || {};
          this.currentSongName = songName || "";
          this.currentLyric = lyric || "";
          this.isPlaying = Boolean(isPlaying);
          this.updateStatusBar();
          break;
        }

        default:
          console.warn(`[Netease] 未知的命令: ${command}`);
          break;
      }
    } catch (error: any) {
      console.error(`[Netease] 处理命令 ${command} 失败:`, error);
      webviewView.webview.postMessage({
        command: `${command}_RESULT`,
        payload: {
          code: -1,
          message: error.message || "请求失败",
        },
        uuid,
      });
    }
  }
}
