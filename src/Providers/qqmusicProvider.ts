/**
 * QQ音乐 Webview Provider
 */
import {
  WebviewView,
  ExtensionContext,
  workspace,
  StatusBarItem,
  StatusBarAlignment,
  window,
} from "vscode";
import {
  searchSongs,
  searchSingers,
  getSingerInfo,
  getSingerSongs,
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
  private statusBarItem: StatusBarItem | undefined;
  private nextSongButton: StatusBarItem | undefined;
  private playPauseButton: StatusBarItem | undefined;
  private currentSongName: string = "";
  private currentLyric: string = "";
  private isPlaying: boolean = false;
  private showStatusBarLyric: boolean = true;
  private statusBarShowLyric: boolean = true;

  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "qqmusic/dist",
      devPort: 5177,
      title: "QQ音乐",
      scrollKey: "qqmusicScrollPosition",
      restoreCommand: "QQMUSIC_RESTORE_SCROLL_POSITION",
      saveCommand: "QQMUSIC_SAVE_SCROLL_POSITION",
    });

    // 初始化状态栏
    this.initStatusBar();

    // 读取配置
    this.loadConfig();

    // 监听配置变化
    workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("touchfish.qqmusicShowStatusBar") ||
        e.affectsConfiguration("touchfish.qqmusicStatusBarShowLyric")
      ) {
        this.loadConfig();
        this.updateStatusBar();
      }
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

  /** 加载配置 */
  private loadConfig() {
    const config = workspace.getConfiguration("touchfish");
    this.showStatusBarLyric = config.get<boolean>("qqmusicShowStatusBar", true);
    this.statusBarShowLyric = config.get<boolean>(
      "qqmusicStatusBarShowLyric",
      true,
    );
  }

  /** 计算文本的视觉宽度（中文字符计为2） */
  private getVisualWidth(str: string): number {
    let width = 0;
    for (const char of str) {
      // 中文字符、全角字符计为2
      if (
        /[\u4e00-\u9fa5\uff00-\uffef\u3000-\u303f\u3040-\u309f\u30a0-\u30ff]/.test(
          char,
        )
      ) {
        width += 2;
      } else {
        width += 1;
      }
    }
    return width;
  }

  /** 按视觉宽度截断文本 */
  private truncateByWidth(str: string, maxWidth: number): string {
    let width = 0;
    let result = "";
    for (const char of str) {
      const charWidth =
        /[\u4e00-\u9fa5\uff00-\uffef\u3000-\u303f\u3040-\u309f\u30a0-\u30ff]/.test(
          char,
        )
          ? 2
          : 1;
      if (width + charWidth > maxWidth) {
        return result + "..";
      }
      width += charWidth;
      result += char;
    }
    return result;
  }

  /** 初始化状态栏 */
  private initStatusBar() {
    // 主状态栏项 - 显示歌曲信息和歌词
    this.statusBarItem = window.createStatusBarItem(
      StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.text = "$(play-circle) QQ音乐";
    this.statusBarItem.tooltip = "点击打开 QQ音乐";
    this.statusBarItem.command = "touchfish.openQQMusic";
    this.statusBarItem.show();

    // 暂停/播放按钮
    this.playPauseButton = window.createStatusBarItem(
      StatusBarAlignment.Left,
      99,
    );
    this.playPauseButton.text = "$(debug-start)";
    this.playPauseButton.tooltip = "播放/暂停";
    this.playPauseButton.command = "touchfish.qqmusic.playPause";
    this.playPauseButton.hide();

    // 下一首按钮
    this.nextSongButton = window.createStatusBarItem(
      StatusBarAlignment.Left,
      98,
    );
    this.nextSongButton.text = "$(chevron-right)";
    this.nextSongButton.tooltip = "下一首";
    this.nextSongButton.command = "touchfish.qqmusic.nextSong";
    this.nextSongButton.hide(); // 初始隐藏，等有歌曲播放时再显示
  }

  /** 更新状态栏显示 */
  private updateStatusBar() {
    if (!this.statusBarItem) return;

    // 如果关闭状态栏显示，隐藏所有
    if (!this.showStatusBarLyric) {
      this.statusBarItem.hide();
      this.playPauseButton?.hide();
      this.nextSongButton?.hide();
      return;
    }

    // 显示主状态栏
    this.statusBarItem.show();

    if (!this.currentSongName) {
      this.statusBarItem.text = "$(music) QQ音乐";
      this.statusBarItem.tooltip = "点击打开 QQ音乐";
      this.statusBarItem.command = "touchfish.openQQMusic";
      this.playPauseButton?.hide();
      this.nextSongButton?.hide();
      return;
    }

    // 主状态栏：固定音乐图标 + 歌词/歌名
    // 采用简单策略：固定显示15个字符，不足不补，超出截断
    const musicIcon = "$(music)";

    let content = "";

    // 有歌词时优先显示歌词，否则显示歌名（根据配置）
    if (
      this.statusBarShowLyric &&
      this.currentLyric &&
      this.currentLyric.trim()
    ) {
      content = this.currentLyric.trim();
    } else {
      content = this.currentSongName;
    }

    // 组合文本（不填充空格，接受轻微宽度差异）
    const displayText = `${musicIcon} ${content}`;

    this.statusBarItem.text = displayText;
    this.statusBarItem.tooltip = `${this.currentSongName}${this.currentLyric ? "\n歌词: " + this.currentLyric : ""}\n\n点击: 打开QQ音乐面板`;
    this.statusBarItem.command = "touchfish.openQQMusic";

    // 显示控制按钮
    this.playPauseButton!.text = this.isPlaying
      ? "$(debug-pause)"
      : "$(debug-start)";
    this.playPauseButton!.tooltip = this.isPlaying ? "暂停" : "播放";
    this.playPauseButton?.show();
    this.nextSongButton?.show();
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    super.resolveWebviewView(webviewView);
    this.webviewView = webviewView;
  }

  private webviewView: WebviewView | undefined;

  /** 发送下一首命令到 webview */
  public sendNextSongCommand() {
    if (this.webviewView) {
      this.webviewView.webview.postMessage({
        command: "QQMUSIC_PLAY_NEXT_COMMAND",
        payload: true,
      });
    }
  }

  /** 发送暂停/播放命令到 webview */
  public sendPlayPauseCommand() {
    if (this.webviewView) {
      this.webviewView.webview.postMessage({
        command: "QQMUSIC_PLAY_PAUSE_COMMAND",
        payload: true,
      });
    }
  }

  protected async handleCustomMessage(
    message: IncomingMessage,
    webviewView: WebviewView,
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
          console.log(
            "[QQMusic] 收到 QQMUSIC_SET_CREDENTIAL Payload:",
            JSON.stringify(payload),
          );
          console.log(
            "[QQMusic] 收到 QQMUSIC_SET_CREDENTIAL setCred:",
            JSON.stringify(setCred),
          );
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

        // ==================== 播放状态同步到状态栏 ====================
        case "QQMUSIC_UPDATE_PLAYING_STATUS": {
          const { songName, lyric, isPlaying } = payload || {};
          this.currentSongName = songName || "";
          this.currentLyric = lyric || "";
          this.isPlaying = isPlaying || false;
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
