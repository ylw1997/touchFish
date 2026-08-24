import { ExtensionContext, WebviewView, workspace, window } from "vscode";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";
import { WeReadClient } from "../api/weread/client";
import { web_shelf_sync } from "../api/weread/api/shelf";
import {
  web_book_chapter_e,
  web_book_chapterInfos,
  web_book_getProgress,
  web_book_read_init,
  web_book_read,
  web_book_underlines,
  web_book_readReviews,
} from "../api/weread/api/book";
import { setConfigByKey } from "../core/config";
import {
  web_login_begin_qr,
  web_login_poll_qr,
} from "../api/weread/api/login";
import {
  parseCookie,
  stringifyCookie,
} from "../api/weread/utils/index";

export class WereadProvider extends BaseWebviewProvider {
  private client: WeReadClient;
  private webviewView: WebviewView | null = null;
  private qrLoginUid = "";
  private qrLoginCookie = "";
  private qrLoginGeneration = 0;
  private qrPollInFlight = new Set<string>();

  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "weread/dist",
      devPort: 5183,
      title: "微信读书",
      scrollKey: "wereadScrollPosition",
      restoreCommand: "WEREAD_RESTORE_SCROLL_POSITION",
      saveCommand: "WEREAD_SAVE_SCROLL_POSITION",
    });

    const cookie =
      workspace.getConfiguration("touchfish").get<string>("wereadCookie") || "";

    this.client = new WeReadClient({ cookie }, async (newCookie) => {
      await setConfigByKey("wereadCookie", newCookie);
    });

    context.subscriptions.push(
      workspace.onDidChangeConfiguration((event) => {
        if (!event.affectsConfiguration("touchfish.wereadCookie")) return;
        const configuredCookie =
          workspace.getConfiguration("touchfish").get<string>("wereadCookie") || "";
        this.client.setCookie(configuredCookie);
      }),
    );

    const renewalTimer = setInterval(() => {
      void this.client.renewIfDue().catch((error) => {
        console.warn("[WeRead] 后台自动续期暂未成功:", error?.message || error);
      });
    }, 30 * 60 * 1000);
    context.subscriptions.push({ dispose: () => clearInterval(renewalTimer) });
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    this.webviewView = webviewView;
    void this.client.renewIfDue().catch((error) => {
      console.warn("[WeRead] 打开页面时自动续期暂未成功:", error?.message || error);
    });
    return super.resolveWebviewView(webviewView);
  }

  public openQrLogin() {
    this.webviewView?.webview.postMessage({
      command: "WEREAD_OPEN_QR_LOGIN",
    });
  }

  private postQrState(state: string, extra: Record<string, any> = {}) {
    this.webviewView?.webview.postMessage({
      command: "WEREAD_QR_LOGIN_STATE",
      payload: { state, ...extra },
    });
  }

  private async startQrLogin() {
    const result = await web_login_begin_qr();
    this.qrLoginGeneration += 1;
    this.qrLoginUid = result.uid;
    this.qrLoginCookie = stringifyCookie(result.cookies);
    this.postQrState("waiting", { qrUrl: result.qrUrl });
  }

  private async pollQrLogin(otp = "") {
    if (!this.qrLoginUid) throw new Error("请先获取微信读书登录二维码");
    const uid = this.qrLoginUid;
    const generation = this.qrLoginGeneration;
    const result = await web_login_poll_qr(
      uid,
      otp,
      this.qrLoginCookie,
    );
    if (generation !== this.qrLoginGeneration || uid !== this.qrLoginUid) return;
    const cookieValues = {
      ...parseCookie(this.qrLoginCookie),
      ...result.cookies,
    };
    this.qrLoginCookie = stringifyCookie(cookieValues);
    const data = result.data?.data || result.data || {};
    if (data.succeed === true || data.succeed === 1) {
      if (data.webLoginVid || data.vid) {
        cookieValues.wr_vid = String(data.webLoginVid || data.vid);
      }
      if (data.accessToken) cookieValues.wr_skey = String(data.accessToken);
      if (data.refreshToken) cookieValues.wr_rt = String(data.refreshToken);
      const cookie = stringifyCookie(cookieValues);
      if (!cookieValues.wr_vid || !cookieValues.wr_skey) {
        throw new Error("扫码已确认，但微信读书登录凭据不完整");
      }
      await setConfigByKey("wereadCookie", cookie);
      this.client.setCookie(cookie);
      this.qrLoginUid = "";
      this.qrLoginCookie = "";
      this.qrLoginGeneration += 1;
      await this.client.renewIfDue(0).catch(() => undefined);
      this.postQrState("complete");
      return;
    }

    const logicCode = String(data.logicCode || "");
    if (logicCode === "NEED_OTP") this.postQrState("needOtp");
    else if (logicCode === "OTP_NOT_MATCH") this.postQrState("otpMismatch");
    else if (logicCode === "LOGIN_TIMEOUT" || logicCode === "OTP_EXPIRED") {
      this.qrLoginUid = "";
      this.qrLoginCookie = "";
      this.qrLoginGeneration += 1;
      this.postQrState("expired");
    } else if (logicCode) {
      throw new Error(`微信读书扫码登录失败: ${logicCode}`);
    } else {
      this.postQrState("waiting");
    }
  }

  protected async handleCustomMessage(
    message: IncomingMessage,
    webviewView: WebviewView,
  ) {
    const { command, payload } = message;

    try {
      switch (command) {
        case "WEREAD_QR_LOGIN_START": {
          await this.startQrLogin();
          break;
        }

        case "WEREAD_QR_LOGIN_POLL": {
          const uid = this.qrLoginUid;
          if (uid && !this.qrPollInFlight.has(uid)) {
            this.qrPollInFlight.add(uid);
            try {
              await this.pollQrLogin();
            } finally {
              this.qrPollInFlight.delete(uid);
            }
          }
          break;
        }

        case "WEREAD_QR_LOGIN_SUBMIT_OTP": {
          await this.pollQrLogin(String(payload?.otp || ""));
          break;
        }

        case "WEREAD_QR_LOGIN_CANCEL": {
          this.qrLoginUid = "";
          this.qrLoginCookie = "";
          this.qrLoginGeneration += 1;
          this.postQrState("cancelled");
          break;
        }

        case "WEREAD_GET_SHELF": {
          const result = await this.client.execute(web_shelf_sync, {});
          webviewView.webview.postMessage({
            command: "WEREAD_SHELF_DATA",
            payload: result,
          });
          break;
        }

        case "WEREAD_OPEN_BOOK": {
          const { title } = payload;
          window.showInformationMessage(`正在打开: ${title}`);
          break;
        }

        case "WEREAD_GET_CHAPTER": {
          const { bookId, chapterUid, silent } = payload;
          const result = await this.client.execute(
            web_book_chapter_e,
            bookId,
            chapterUid,
          );

          // 只有非静默加载（即用户手动切章）时才上报进度并提醒
          if (!silent) {
            (async () => {
              try {
                const now = Math.floor(Date.now() / 1000);
                const pc = now - 10;
                const ps = pc - Math.floor(Math.random() * 5) - 5;
                const format = result.format || "epub";

                const initRes = await this.client.execute(
                  web_book_read_init,
                  bookId,
                  chapterUid,
                  0,
                  0,
                  pc,
                  ps,
                  format,
                );
                if (initRes && initRes.succ === 1) {
                  webviewView.webview.postMessage({
                    command: "WEREAD_SAVE_PROGRESS_SUCCESS",
                  });
                  if (initRes.readerToken) {
                    await this.client.execute(
                      web_book_read,
                      bookId,
                      chapterUid,
                      0,
                      0,
                      pc,
                      ps,
                      format,
                      initRes.readerToken,
                      60,
                    );
                  }
                }
              } catch (e) {
                console.error("[Weread] Save progress failed:", e);
              }
            })();
          }

          webviewView.webview.postMessage({
            command: "WEREAD_CHAPTER_DATA",
            payload: result,
          });
          break;
        }

        case "WEREAD_GET_CATALOG": {
          const { bookId } = payload;
          // 注意：chapterInfos 接收数组
          const result = await this.client.execute(web_book_chapterInfos, [
            bookId,
          ]);
          webviewView.webview.postMessage({
            command: "WEREAD_CATALOG_DATA",
            payload: result,
          });
          break;
        }

        case "WEREAD_GET_PROGRESS": {
          const { bookId } = payload;
          const result = await this.client.execute(
            web_book_getProgress,
            bookId,
          );
          webviewView.webview.postMessage({
            command: "WEREAD_PROGRESS_DATA",
            payload: result,
          });
          break;
        }

        case "WEREAD_GET_UNDERLINES": {
          const { bookId, chapterUid } = payload;
          const result = await this.client.execute(
            web_book_underlines,
            bookId,
            chapterUid,
          );
          webviewView.webview.postMessage({
            command: "WEREAD_UNDERLINES_DATA",
            payload: result,
          });
          break;
        }

        case "WEREAD_GET_BEST_THOUGHTS": {
          const { bookId, chapterUid, range } = payload;
          const result = await this.client.execute(
            web_book_readReviews,
            bookId,
            chapterUid,
            range,
          );
          webviewView.webview.postMessage({
            command: "WEREAD_BEST_THOUGHTS_DATA",
            payload: result,
          });
          break;
        }

        default:
          break;
      }
    } catch (error: any) {
      console.error("[Weread] 处理消息失败:", error);
      if (command.startsWith("WEREAD_QR_LOGIN")) {
        this.postQrState("error", {
          message: error.message || "微信读书扫码登录失败",
        });
      }
      webviewView.webview.postMessage({
        command: "WEREAD_ERROR",
        payload: { message: error.message || "请求失败" },
      });
    }
  }
}
