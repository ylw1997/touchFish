import {get, postJSON} from "../utils/request";

/**
 * 获取账户余额
 * @param pf 平台
 * @param cookie
 */
export async function web_pay_balance(pf = "ios", cookie = "") {
    const resp = await postJSON("https://weread.qq.com/web/pay/balance", {
        pf,
    }, {
        cookie: cookie,
    });
    return resp.json();
}

/**
 * 获取账户会员卡信息
 * @param pf 平台
 * @param cookie
 */
export async function web_pay_memberCardSummary(pf = "ios", cookie = "") {
    const resp = await get("https://weread.qq.com/web/pay/memberCardSummary", {
        pf,
    }, {
        cookie: cookie,
    });
    return resp.json();
}
