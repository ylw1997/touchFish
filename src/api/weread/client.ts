import { web_login_renewal } from "./api/login";
import { updateCookie } from "./utils/index";

export interface WeReadAuth {
  cookie: string;
}

export class WeReadClient {
  constructor(private auth: WeReadAuth, private onCookieUpdate?: (newCookie: string) => void) {}

  /**
   * 执行请求，并在登录超时时尝试刷新 Cookie
   * @param apiFunc API 函数，接受 cookie 作为最后一个参数
   * @param args API 函数的参数列表（不含 cookie）
   */
  async execute<T>(apiFunc: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    try {
      const result = await apiFunc(...args, this.auth.cookie);
      
      // 检查是否登录超时
      if (this.isLoginTimeout(result)) {
        console.log("🔄 检测到登录超时，尝试刷新 Cookie...");
        await this.refresh();
        // 刷新后重试原始请求
        return await apiFunc(...args, this.auth.cookie);
      }
      
      return result;
    } catch (error: any) {
      // 某些接口可能在底层直接 throw 错误
      if (error.message && (error.message.includes("超时") || error.message.includes("鉴权"))) {
         console.log("🔄 捕获到鉴权错误，尝试刷新 Cookie...");
         await this.refresh();
         return await apiFunc(...args, this.auth.cookie);
      }
      throw error;
    }
  }

  private isLoginTimeout(result: any): boolean {
    if (!result) return false;
    // 微信读书典型的超时错误码
    return result.errCode === -2012 || result.errCode === -2013 || result.errCode === -12013;
  }

  private async refresh() {
    try {
      // 使用当前 Cookie 调用续期接口
      // 注意：renewal 接口需要一个 url 参数，通常传入主页或当前请求路径
      const renewalData = await web_login_renewal("https://weread.qq.com/", this.auth.cookie);
      
      if (renewalData && renewalData.accessToken) {
        const newValues: Record<string, string> = {
          wr_skey: renewalData.accessToken,
        };
        if (renewalData.vid) newValues.wr_vid = renewalData.vid;
        if (renewalData.refreshToken) newValues.wr_rt = renewalData.refreshToken;

        // 更新 Cookie
        this.auth.cookie = updateCookie(this.auth.cookie, newValues);
        
        console.log("✅ Cookie 刷新成功");
        if (this.onCookieUpdate) {
          this.onCookieUpdate(this.auth.cookie);
        }
      }
    } catch (error: any) {
      console.error("❌ Cookie 刷新失败:", error.message);
      throw error;
    }
  }
}
