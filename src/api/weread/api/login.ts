import {get, postJSON} from "../utils/request";

/**
 * 获取uid
 */
export async function web_login_getuid() {
  const resp = await postJSON("https://weread.qq.com/web/login/getuid");
  return resp.json();
}

/**
 * 生成登录链接
 * @param uid
 */
export function web_confirm(uid: string) {
  return `https://weread.qq.com/web/confirm?pf=2&uid=${uid}`;
}

/**
 * 查询用户扫码信息
 * @param uid
 */
export async function web_login_getinfo(uid: string) {
  const resp = await postJSON("https://weread.qq.com/web/login/getinfo", {
    uid,
  });
  return resp.json();
}

/**
 * 使用扫码信息进行登录
 * @param info
 */
export async function web_login_weblogin(info: Record<string, any> = {}) {
  delete info.redirect_uri;
  delete info.expireMode;
  delete info.pf;

  info.fp = "";
  const resp = await postJSON("https://weread.qq.com/web/login/weblogin", info);
  return resp.json();
}

/**
 * 初始化会话
 * @param info
 */
export async function web_login_session_init(info: Record<string, any> = {}) {
  const params = {
    vid: info.vid,
    pf: 0,
    skey: info.accessToken,
    rt: info.refreshToken,
  };
  const resp = await postJSON(
    "https://weread.qq.com/web/login/session/init",
    params,
  );
  return resp.json();
}

/**
 * 刷新skey
 * @param url 原请求路径
 * @param cookie
 */
export async function web_login_renewal(url: string, cookie: string = "") {
  const resp = await postJSON("https://weread.qq.com/web/login/renewal", {
    rq: encodeURIComponent(url),
  }, {
    cookie,
  });

  const data = await resp.json();
  if (data.succ === 1) {
    return resp.getSetCookie().reduce(
      (entry: Record<string, string>, cookie: string) => {
        const item = cookie.split(";")[0];
        const [name, value] = item.split("=");
        if (name === "wr_vid") {
          entry.vid = value;
        } else if (name === "wr_skey") {
          entry.accessToken = value;
        } else if (name === "wr_rt") {
          entry.refreshToken = value;
        }
        return entry;
      },
      {},
    );
  } else {
    // { errCode: -12013, errMsg: "微信登录授权已过期，继续购买需跳转到微信重新登录" }
    // { errCode: -2013, errLog: "C6LyBKI", errMsg: "鉴权失败" }
    if (data.errCode !== -12013) {
      console.warn('/web/login/renewal接口失败', data, cookie)
    }
    throw Error(data.errMsg);
  }
}

/**
 * 通知后台前端已登录
 */
export async function web_login_notify(cookie: string = "") {
  const resp = await get("https://weread.qq.com/web/login/notify", {}, {cookie})
  return resp.json()
}
