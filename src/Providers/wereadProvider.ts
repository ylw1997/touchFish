import { ExtensionContext, WebviewView, workspace, window } from "vscode";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";
import { WeReadClient } from "../api/weread/client";
import { web_shelf_sync } from "../api/weread/api/shelf";
import { web_book_chapter_e, web_book_chapterInfos, web_book_getProgress, web_book_read_init, web_book_read } from "../api/weread/api/book";
import { setConfigByKey } from "../core/config";

export class WereadProvider extends BaseWebviewProvider {
  private client: WeReadClient;
  private webviewView: WebviewView | null = null;

  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "weread/dist",
      devPort: 5183,
      title: "微信读书",
      scrollKey: "wereadScrollPosition",
      restoreCommand: "WEREAD_RESTORE_SCROLL_POSITION",
      saveCommand: "WEREAD_SAVE_SCROLL_POSITION",
    });

    const cookie = workspace.getConfiguration("touchfish").get<string>("wereadCookie") || "";
    
    this.client = new WeReadClient({ cookie }, (newCookie) => {
      void setConfigByKey("wereadCookie", newCookie);
    });
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    this.webviewView = webviewView;
    return super.resolveWebviewView(webviewView);
  }

  protected async handleCustomMessage(message: IncomingMessage, webviewView: WebviewView) {
    const { command, payload } = message;

    try {
      switch (command) {
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
          const result = await this.client.execute(web_book_chapter_e, bookId, chapterUid);
          
          // 只有非静默加载（即用户手动切章）时才上报进度并提醒
          if (!silent) {
            (async () => {
              try {
                const now = Math.floor(Date.now() / 1000);
                const pc = now - 10;
                const ps = pc - Math.floor(Math.random() * 5) - 5;
                const format = result.format || "epub";

                const initRes = await this.client.execute(web_book_read_init, bookId, chapterUid, 0, 0, pc, ps, format);
                if (initRes && initRes.succ === 1) {
                  webviewView.webview.postMessage({
                    command: "WEREAD_SAVE_PROGRESS_SUCCESS",
                  });
                  if (initRes.readerToken) {
                    await this.client.execute(web_book_read, bookId, chapterUid, 0, 0, pc, ps, format, initRes.readerToken, 60);
                  }
                }
              } catch (e) {
                console.error('[Weread] Save progress failed:', e);
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
          const result = await this.client.execute(web_book_chapterInfos, [bookId]);
          webviewView.webview.postMessage({
            command: "WEREAD_CATALOG_DATA",
            payload: result,
          });
          break;
        }

        case "WEREAD_GET_PROGRESS": {
          const { bookId } = payload;
          const result = await this.client.execute(web_book_getProgress, bookId);
          webviewView.webview.postMessage({
            command: "WEREAD_PROGRESS_DATA",
            payload: result,
          });
          break;
        }

        default:
          break;
      }
    } catch (error: any) {
      console.error("[Weread] 处理消息失败:", error);
      webviewView.webview.postMessage({
        command: "WEREAD_ERROR",
        payload: { message: error.message || "请求失败" },
      });
    }
  }
}
