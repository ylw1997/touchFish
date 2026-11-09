import { ExtensionContext, WebviewView, workspace, window } from "vscode";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";
import { WeReadClient } from "../api/weread/client";
import { NoteWriter } from "../api/weread/noteWriter";
import { web_note_create, web_personal_notes } from "../api/weread/api/notes";
import { parseNoteRange, validateNoteWrite, type NoteWrite } from "../api/weread/noteTypes";
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
  private noteWriter: NoteWriter;
  private loadedChapters = new Map<string, { length: number; bookVersion?: number }>();
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
    this.noteWriter = new NoteWriter({
      load: (bookId, chapterUid) => this.client.execute(web_personal_notes, bookId, chapterUid),
      create: (input) => this.client.execute(web_note_create, input),
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
    const { command, payload, uuid } = message;
    const frame = { uuid, bookId: payload?.bookId, chapterUid: payload?.chapterUid };

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
          const chapterKey = `${bookId}:${chapterUid}`;
          if (this.loadedChapters.size >= 20 && !this.loadedChapters.has(chapterKey)) {
            this.loadedChapters.delete(this.loadedChapters.keys().next().value!);
          }
          this.loadedChapters.set(chapterKey, { length: result.html.length, bookVersion: result.bookVersion });

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
            ...frame,
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
            ...frame,
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
            ...frame,
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
            ...frame,
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
            ...frame,
            payload: result,
          });
          break;
        }

        case "WEREAD_GET_MY_NOTES": {
          const notes = await this.noteWriter.load(payload.bookId, payload.chapterUid);
          webviewView.webview.postMessage({ command: "WEREAD_MY_NOTES_DATA", ...frame, payload: { notes } });
          break;
        }

        case "WEREAD_ADD_BOOKMARK":
        case "WEREAD_ADD_THOUGHT": {
          const input: NoteWrite = { ...payload, kind: command === "WEREAD_ADD_BOOKMARK" ? "bookmark" : "thought" };
          validateNoteWrite(input);
          const chapter = this.loadedChapters.get(`${input.bookId}:${input.chapterUid}`);
          const range = parseNoteRange(input.range)!;
          if (!chapter || range[1] > chapter.length || chapter.bookVersion !== input.bookVersion) {
            throw new Error("正文或书籍版本已变化，请重新加载本章后选文");
          }
          const result = await this.noteWriter.write(uuid || "", input);
          webviewView.webview.postMessage({ command: "WEREAD_NOTE_RESULT", ...frame, payload: result });
          break;
        }

        case "WEREAD_RECHECK_NOTE": {
          const result = await this.noteWriter.recheck(uuid || "", payload.bookId, payload.chapterUid);
          webviewView.webview.postMessage({ command: "WEREAD_NOTE_RESULT", ...frame, payload: result });
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
      if (["WEREAD_ADD_BOOKMARK", "WEREAD_ADD_THOUGHT", "WEREAD_RECHECK_NOTE"].includes(command)) {
        webviewView.webview.postMessage({ command: "WEREAD_NOTE_RESULT", ...frame,
          payload: { status: command === "WEREAD_RECHECK_NOTE" ? "uncertain" : "failed", message: error.message || "保存失败" } });
        return;
      }
      if (command === "WEREAD_GET_MY_NOTES") {
        webviewView.webview.postMessage({ command: "WEREAD_MY_NOTES_ERROR", ...frame, payload: { message: error.message || "个人笔记加载失败" } });
        return;
      }
      webviewView.webview.postMessage({
        command: "WEREAD_ERROR",
        ...frame,
        payload: { message: error.message || "请求失败" },
      });
    }
  }
}
