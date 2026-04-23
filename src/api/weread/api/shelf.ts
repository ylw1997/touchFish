import { get, postJSON } from "../utils/request";

/**
 * 获取书架上的书
 * @param query 可以提供额外参数来控制结果，比如
 * onlyBookid: 1 只返回bookId
 * cbcount: 1 返回上传的图书数量
 * @param cookie
 */
export async function web_shelf_sync(
  query: Record<string, any> = {},
  cookie = "",
) {
  const resp = await get("https://weread.qq.com/web/shelf/sync", query, {
    cookie: cookie,
  });
  return resp.json();
}

/**
 * 获取迷你书架数据
 * @param bookIds
 * @param cookie
 */
export async function web_shelf_syncBook(bookIds: string[] = [], cookie = "") {
  const resp = await postJSON("https://weread.qq.com/web/shelf/syncBook", {
    bookIds,
  }, {
    cookie: cookie,
  });
  return resp.json();
}

/**
 * 批量查询图书是否在书架上
 * @param bookIds
 * @param cookie
 */
export async function web_shelf_bookIds(bookIds: string[] = [], cookie = "") {
  const resp = await get("https://weread.qq.com/web/shelf/bookIds", {
    bookIds: bookIds.join(','),
  }, {
    cookie: cookie,
  })
  return resp.json()
}

/**
 * 添加书籍到书架
 * @param bookIds
 * @param cookie
 */
export async function web_shelf_addToShelf(bookIds: string[] = [], cookie = "") {
  const resp = await postJSON("https://weread.qq.com/mp/shelf/addToShelf", {
    bookIds: bookIds,
  }, {
    cookie: cookie,
  })
  return resp.json()
}

/**
 * 添加书籍到书架
 * @param bookIds
 * @param cookie
 */
export async function web_shelf_add(bookIds: string[] = [], cookie = "") {
  const resp = await postJSON("https://weread.qq.com/web/shelf/add", {
    bookIds,
  }, {
    cookie,
  })
  return resp.json()
}
