import { Buffer } from "buffer";
import { get, postJSON } from "../utils/request";
import { parseCookie } from "../utils/index";
import { validateNoteWrite, type NoteWrite, type PersonalNote } from "../noteTypes";

export class NoteBusinessError extends Error {}

function checkBusiness(data: any): void {
  if ((typeof data?.errCode === "number" && data.errCode !== 0) || data?.succ === 0) {
    throw new NoteBusinessError(data.errMsg || data.message || "微信读书未保存笔记，请重试");
  }
}

/** Web protocol: markText is UTF-8 Base64; thought text stays unencoded. */
export async function web_note_create(input: NoteWrite, cookie = ""): Promise<{ id?: string }> {
  validateNoteWrite(input);
  const payload: Record<string, unknown> = {
    bookId: input.bookId, chapterUid: input.chapterUid, bookVersion: input.bookVersion ?? 0,
    range: input.range, type: 1,
  };
  let url: string;
  if (input.kind === "bookmark") {
    url = "https://weread.qq.com/web/book/addBookmark";
    Object.assign(payload, { chapterIdx: input.chapterIdx ?? 0, style: 1, colorStyle: 0,
      markText: Buffer.from(input.quote, "utf8").toString("base64") });
  } else {
    url = "https://weread.qq.com/web/review/add";
    Object.assign(payload, { content: input.content, abstract: input.quote });
    if (input.isPrivate) payload.isPrivate = 1;
  }
  const data = await (await postJSON(url, payload, { cookie }, 20_000)).json();
  checkBusiness(data);
  const id = input.kind === "bookmark" ? data?.bookmarkId : data?.reviewId;
  if (typeof id === "string" && id) return { id };
  if (input.kind === "bookmark" && data?.succ === 1) return {};
  // An unexpected reply may follow a committed write. Let the writer reconcile it.
  throw new Error("微信读书未返回可确认的保存结果");
}

export async function web_personal_notes(bookId: string, chapterUid: number, cookie = ""): Promise<PersonalNote[]> {
  const userVid = parseCookie(cookie).wr_vid;
  const [bookmarks, thoughts] = await Promise.all([
    get("https://weread.qq.com/web/book/bookmarklist", { bookId, syncKey: 0 }, { cookie }, 20_000).then((r) => r.json()),
    get("https://weread.qq.com/web/review/list", {
      bookId, listType: 11, ...(userVid ? { userVid } : {}), mine: 1,
      count: 0, maxIdx: 0, listMode: 2, synckey: 0,
    }, { cookie }, 20_000).then((r) => r.json()),
  ]);
  checkBusiness(bookmarks); checkBusiness(thoughts);
  if (!Array.isArray(bookmarks?.updated) || !Array.isArray(thoughts?.reviews)) {
    throw new Error("微信读书个人笔记返回不完整，请重新加载");
  }
  const result: PersonalNote[] = [];
  for (const mark of bookmarks.updated) {
    if (mark.type !== 1 || Number(mark.chapterUid) !== chapterUid || !mark.bookmarkId || !mark.range) continue;
    result.push({ id: String(mark.bookmarkId), kind: "bookmark", bookId, chapterUid,
      range: mark.range, quote: mark.markText || "" });
  }
  for (const item of thoughts.reviews) {
    const thought = item.review || item;
    if (Number(thought.chapterUid) !== chapterUid || !thought.reviewId || !thought.range) continue;
    result.push({ id: String(thought.reviewId), kind: "thought", bookId, chapterUid,
      range: thought.range, quote: thought.abstract || "", content: thought.content || "",
      isPrivate: thought.isPrivate === 1 || thought.isPrivate === true });
  }
  return result;
}
