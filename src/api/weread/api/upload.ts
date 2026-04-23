import { get } from "../utils/request";

/**
 * 查询书架是否已满
 */
export async function mp_shelf_shelfFull(cookie = "") {
  const resp = await get("https://weread.qq.com/mp/shelf/shelfFull", {}, {
    cookie: cookie,
  });
  return resp.json();
}
