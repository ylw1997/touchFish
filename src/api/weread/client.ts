import { web_login_renewal } from "./api/login";
import { isWeReadAuthFailure } from "./auth";
import { updateCookie } from "./utils/index";

export interface WeReadAuth {
  cookie: string;
}

type RenewalResult = {
  accessToken?: string;
  vid?: string;
  refreshToken?: string;
};

type RenewalFunction = (url: string, cookie: string) => Promise<RenewalResult>;

export class WeReadClient {
  private refreshPromise: Promise<void> | null = null;

  constructor(
    private auth: WeReadAuth,
    private onCookieUpdate?: (newCookie: string) => void | Promise<void>,
    private renewCookie: RenewalFunction = web_login_renewal,
  ) {}

  setCookie(cookie: string) {
    this.auth.cookie = cookie;
  }

  /**
   * 执行请求，并在登录超时时尝试刷新 Cookie
   * @param apiFunc API 函数，接受 cookie 作为最后一个参数
   * @param args API 函数的参数列表（不含 cookie）
   */
  async execute<T>(apiFunc: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    const requestCookie = this.auth.cookie;
    let result: T;
    try {
      result = await apiFunc(...args, requestCookie);
    } catch (error: any) {
      if (!isWeReadAuthFailure(error)) throw error;
      return this.refreshAndRetry(apiFunc, args, requestCookie);
    }

    if (!isWeReadAuthFailure(result)) return result;
    return this.refreshAndRetry(apiFunc, args, requestCookie);
  }

  private async refreshAndRetry<T>(
    apiFunc: (...args: any[]) => Promise<T>,
    args: any[],
    failedCookie: string,
  ): Promise<T> {
    if (this.auth.cookie === failedCookie) {
      console.log("[WeRead] 检测到鉴权失效，尝试续期 Cookie...");
      await this.refresh();
    }
    const result = await apiFunc(...args, this.auth.cookie);
    if (isWeReadAuthFailure(result)) {
      throw new Error("微信读书登录已失效，请重新设置 Cookie");
    }
    return result;
  }

  private refresh(): Promise<void> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async performRefresh(): Promise<void> {
    try {
      const cookieAtStart = this.auth.cookie;
      const renewalData = await this.renewCookie(
        "https://weread.qq.com/",
        cookieAtStart,
      );
      if (!renewalData?.accessToken) {
        throw new Error("微信读书 Cookie 续期成功但未返回新的 wr_skey");
      }

      // 续期期间用户可能已经手动换了 Cookie，不能用旧会话的结果覆盖它。
      if (this.auth.cookie !== cookieAtStart) return;

      const newValues: Record<string, string> = {
        wr_skey: renewalData.accessToken,
      };
      if (renewalData.vid) newValues.wr_vid = renewalData.vid;
      if (renewalData.refreshToken) newValues.wr_rt = renewalData.refreshToken;

      this.auth.cookie = updateCookie(cookieAtStart, newValues);
      if (this.onCookieUpdate) {
        await this.onCookieUpdate(this.auth.cookie);
      }
      console.log("[WeRead] Cookie 续期成功");
    } catch (error: any) {
      console.error("[WeRead] Cookie 续期失败:", error.message);
      throw error;
    }
  }
}
