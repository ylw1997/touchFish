import { get } from "../utils/request";

/**
 * 查询用户信息
 * @param vid
 * @param cookie
 */
export async function web_user(vid: number | string, cookie = "") {
    const resp = await get("https://weread.qq.com/web/user", {
        userVid: vid,
    }, {
        cookie: cookie,
    });
    return resp.json();
}
