import {get, postJSON} from "../utils/request";
import {calcHash, currentTime, getAppId, sign, timestamp} from "../utils/index";
import {chk, dH, dS, dT} from "../utils/decrypt";
import {sha256} from "../utils/encode";

const UserAgentForWeb = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36";

/**
 * 获取图书详情
 * @param bookId
 * @param cookie
 */
export async function web_book_info(bookId: string, cookie = "") {
  const resp = await get("https://weread.qq.com/web/book/info", {
    bookId: bookId,
  }, {
    cookie: cookie,
  });
  return resp.json();
}

/**
 * 获取图书详情
 * 不需要登录
 */
export async function web_book_publicinfos(bookIds: string[]) {
  const resp = await postJSON("https://weread.qq.com/web/book/publicinfos", {
    bookIds,
  })
  try {
    return resp.json()
  } catch (e) {
    console.log(e)
    console.log(resp)
    throw e
  }
}

export async function web_book_search(cookie = "") {
  const resp = await get("https://weread.qq.com/web/book/search", {}, {cookie})
  return resp.json()
}

/**
 * 获取图书的章节信息
 * @param bookIds
 * @param cookie
 */
export async function web_book_chapterInfos(bookIds: string[], cookie = "") {
  const resp = await postJSON("https://weread.qq.com/web/book/chapterInfos", {
    bookIds,
  }, {
    cookie: cookie,
  });
  return resp.json();
}

/**
 * 获取进度信息
 * @param bookId
 * @param cookie
 */
export async function web_book_getProgress(bookId: string, cookie = "") {
  const resp = await get("https://weread.qq.com/web/book/getProgress", {
    bookId,
  }, {
    cookie: cookie,
  });
  return resp.json();
}

/**
 * 开始阅读
 * @param bookId
 * @param chapterUid
 * @param percent
 * @param chapterOffset
 * @param pc
 * @param ps
 * @param format
 * @param cookie
 */
export async function web_book_read_init(
  bookId: string,
  chapterUid: number,
  percent = 0,
  chapterOffset = 0,
  pc: number,
  ps: number,
  format = "epub",
  cookie = "",
) {
  const payload: Record<string, string | number> = {
    "appId": getAppId(UserAgentForWeb),
    "b": calcHash(bookId),
    "c": calcHash(chapterUid || 0),
    "ci": chapterUid || 0,
    "co": chapterOffset,
    "ct": currentTime(),
    "dy": 0,
    "fm": format,
    "pc": calcHash(pc),
    "pr": percent,
    "ps": calcHash(ps),
    "sm": "",
  }
  payload.s = sign(payload)

  const resp = await postJSON("https://weread.qq.com/web/book/read", payload, {
    cookie: cookie,
  });
  return resp.json()
}

/**
 * 上传进度
 * @param bookId
 * @param chapterUid
 * @param percent
 * @param chapterOffset
 * @param pc
 * @param ps
 * @param format
 * @param readerToken
 * @param cookie
 * @param rt
 */
export async function web_book_read(
    bookId: string,
    chapterUid: number,
    percent = 0,
    chapterOffset = 0,
    pc: number,
    ps: number,
    format = "epub",
    readerToken = "",
    cookie = "",
    rt = 60,
) {
  const ts = timestamp()
  const rnd = Math.floor(1000 * Math.random())

  const payload: Record<string, string | number> = {
    "appId": getAppId(UserAgentForWeb),
    "b": calcHash(bookId),
    "c": calcHash(chapterUid || 0),
    "ci": chapterUid || 0,
    "co": chapterOffset,
    "ct": currentTime(),
    "dy": 0,
    "fm": format,
    "pc": calcHash(pc),
    "pr": percent,
    "ps": calcHash(ps),
    "sm": "",
    rt: rt, // 最大只能为 60
    ts: ts,
    rn: rnd,
    sg: sha256("" + ts + rnd + readerToken),
  }
  payload.s = sign(payload)

  const resp = await postJSON("https://weread.qq.com/web/book/read", payload, {
    cookie: cookie,
  });
  return resp.json()
}

export async function web_book_bookmarklist(bookId: string, cookie = "") {
  const resp = await get("https://weread.qq.com/web/book/bookmarklist", {
    bookId: bookId,
  }, {
    cookie: cookie,
  });
  return resp.json();
}

export async function web_book_chapter_e0(
  bookId: string,
  chapterUid: number,
  cookie = "",
) {
  const payload: Record<string, any> = {
    "b": calcHash(bookId),
    "c": calcHash(chapterUid),
    "r": Math.pow(Math.floor(10_000 * Math.random()), 2),
    "st": 0,
    "ct": currentTime(),
    "ps": "a2b325707a19e580g0186a2",
    "pc": "430321207a19e581g013ab0",
  };
  payload.s = sign(payload);

  const resp = await postJSON(
    "https://weread.qq.com/web/book/chapter/e_0",
    payload,
    {
      cookie: cookie,
    },
  );
  const data = await resp.text();
  return data && "string" === typeof data ? chk(data) : "";
}

export async function web_book_chapter_e1(
  bookId: string,
  chapterUid: number,
  cookie = "",
) {
  const payload: Record<string, any> = {
    "b": calcHash(bookId),
    "c": calcHash(chapterUid),
    "r": Math.pow(Math.floor(10_000 * Math.random()), 2),
    "st": 0,
    "ct": currentTime(),
    "ps": "a2b325707a19e580g0186a2",
    "pc": "430321207a19e581g013ab0",
  };
  payload.s = sign(payload);

  const resp = await postJSON(
    "https://weread.qq.com/web/book/chapter/e_1",
    payload,
    {
      cookie: cookie,
    },
  );
  const data = await resp.text();
  return data && "string" === typeof data ? chk(data) : "";
}

export async function web_book_chapter_e2(
  bookId: string,
  chapterUid: number,
  cookie = "",
) {
  const payload: Record<string, any> = {
    "b": calcHash(bookId),
    "c": calcHash(chapterUid),
    "r": Math.pow(Math.floor(10_000 * Math.random()), 2),
    "st": 1,
    "ct": currentTime(),
    "ps": "a2b325707a19e580g0186a2",
    "pc": "430321207a19e581g013ab0",
  };
  payload.s = sign(payload);

  const resp = await postJSON(
    "https://weread.qq.com/web/book/chapter/e_2",
    payload,
    {
      cookie: cookie,
    },
  );
  const data = await resp.text();
  return data && "string" === typeof data ? chk(data) : "";
}

export async function web_book_chapter_e3(
  bookId: string,
  chapterUid: number,
  cookie = "",
) {
  const payload: Record<string, any> = {
    "b": calcHash(bookId),
    "c": calcHash(chapterUid),
    "r": Math.pow(Math.floor(10_000 * Math.random()), 2),
    "st": 0,
    "ct": currentTime(),
    "ps": "a2b325707a19e580g0186a2",
    "pc": "430321207a19e581g013ab0",
  };
  payload.s = sign(payload);

  const resp = await postJSON(
    "https://weread.qq.com/web/book/chapter/e_3",
    payload,
    {
      cookie: cookie,
    },
  );
  const data = await resp.text();
  return data && "string" === typeof data ? chk(data) : "";
}

export async function web_book_chapter_t0(
  bookId: string,
  chapterUid: number,
  cookie = "",
) {
  const payload: Record<string, any> = {
    "b": calcHash(bookId),
    "c": calcHash(chapterUid),
    "r": Math.pow(Math.floor(10_000 * Math.random()), 2),
    "st": 0,
    "ct": currentTime(),
    "ps": "a2b325707a19e580g0186a2",
    "pc": "430321207a19e581g013ab0",
  };
  payload.s = sign(payload);

  const resp = await postJSON(
    "https://weread.qq.com/web/book/chapter/t_0",
    payload,
    {
      cookie: cookie,
    },
  );
  const data = await resp.text();
  return data && "string" === typeof data ? chk(data) : "";
}

export async function web_book_chapter_t1(
  bookId: string,
  chapterUid: number,
  cookie = "",
) {
  const payload: Record<string, any> = {
    "b": calcHash(bookId),
    "c": calcHash(chapterUid),
    "r": Math.pow(Math.floor(10_000 * Math.random()), 2),
    "st": 1,
    "ct": currentTime(),
    "ps": "a2b325707a19e580g0186a2",
    "pc": "430321207a19e581g013ab0",
  };
  payload.s = sign(payload);

  const resp = await postJSON(
    "https://weread.qq.com/web/book/chapter/t_1",
    payload,
    {
      cookie: cookie,
    },
  );
  const data = await resp.text();
  return data && "string" === typeof data ? chk(data) : "";
}

/**
 * 获取章节内容 (最小化实现：解密并返回原始 HTML/TXT 内容)
 * @param bookId
 * @param chapterUid
 * @param cookie
 */
export async function web_book_chapter_e(
  bookId: string,
  chapterUid: number,
  cookie = "",
): Promise<{ html: string; style: string }> {
  const { format } = await web_book_info(bookId, cookie);
  if (format === "epub" || format === "pdf") {
    const results = await Promise.all([
      web_book_chapter_e0(bookId, chapterUid, cookie),
      web_book_chapter_e1(bookId, chapterUid, cookie),
      web_book_chapter_e2(bookId, chapterUid, cookie),
      web_book_chapter_e3(bookId, chapterUid, cookie),
    ]);
    
    if (results[0] && results[1] && results[3]) {
        const style = dS(results[2]);
        const html = dH(results[0] + results[1] + results[3]);
        return { html, style };
    }
    throw Error(`解密失败(${bookId})`);
  } else if (format === "txt") {
    const results = await Promise.all([
      web_book_chapter_t0(bookId, chapterUid, cookie),
      web_book_chapter_t1(bookId, chapterUid, cookie),
    ]);
    if (results[0] && results[1]) {
        const html = dT(results[0] + results[1]);
        return { html, style: "" };
    }
    throw Error(`解密失败(${bookId})`);
  } else {
    throw Error(`暂不支持${format}格式(${bookId})`);
  }
}
