import * as assert from "assert";
import axios from "axios";
import { afterEach, beforeEach, describe, it } from "mocha";
import { web_note_create, web_personal_notes, NoteBusinessError } from "../api/weread/api/notes";
import { NoteWriter } from "../api/weread/noteWriter";
import { parseNoteRange, validateNoteWrite, type NoteWrite, type PersonalNote } from "../api/weread/noteTypes";

const selection: NoteWrite = { bookId: "book", chapterUid: 2, chapterIdx: 1, bookVersion: 3,
  range: "100-109", quote: "中文 & 😀", kind: "thought", content: "我的想法", isPrivate: false };
const note = (id: string, input: NoteWrite = selection): PersonalNote => ({ ...input, id });

describe("WeRead note Web protocol", () => {
  const original = axios.defaults.adapter;
  let requests: any[];
  beforeEach(() => {
    requests = [];
    axios.defaults.adapter = async (config) => {
      requests.push(config);
      const data = config.method === "get" ? config.url?.includes("bookmarklist")
        ? { updated: [{ bookmarkId: "b1", type: 1, chapterUid: 2, range: "10-12", markText: "原文" },
          { bookmarkId: "corner", type: 0, chapterUid: 2, range: "10" }] }
        : { reviews: [{ review: { reviewId: "r1", chapterUid: 2, range: "20-22", abstract: "原文", content: "想法", isPrivate: 1 } }] }
        : config.url?.includes("addBookmark") ? { succ: 1, bookmarkId: "bookmark" } : { reviewId: "thought" };
      return { data, status: 200, statusText: "OK", headers: {}, config };
    };
  });
  afterEach(() => { axios.defaults.adapter = original; });

  it("encodes bookmark text as UTF-8 Base64 and passes original coordinates/version", async () => {
    await web_note_create({ ...selection, kind: "bookmark" }, "wr_vid=12; wr_skey=fake");
    assert.equal(requests[0].url, "https://weread.qq.com/web/book/addBookmark");
    const body = JSON.parse(requests[0].data);
    assert.equal(Buffer.from(body.markText, "base64").toString("utf8"), selection.quote);
    assert.deepEqual([body.range, body.type, body.chapterIdx, body.bookVersion, body.style], ["100-109", 1, 1, 3, 1]);
    assert.equal(requests[0].timeout, 20_000);
  });
  it("submits a discussion without ratings, with plain text and explicit private visibility", async () => {
    await web_note_create({ ...selection, isPrivate: true }, "wr_skey=fake");
    assert.equal(requests[0].url, "https://weread.qq.com/web/review/add");
    assert.deepEqual(JSON.parse(requests[0].data), { bookId: "book", chapterUid: 2, bookVersion: 3,
      range: "100-109", type: 1, content: "我的想法", abstract: selection.quote, isPrivate: 1 });
    await web_note_create(selection);
    assert.ok(!("isPrivate" in JSON.parse(requests[1].data)));
  });
  it("loads complete personal notes and filters chapter bookmarks rather than corner markers", async () => {
    const result = await web_personal_notes("book", 2, "wr_vid=12");
    assert.equal(result.length, 2);
    assert.equal(result[1].isPrivate, true);
    const query = new URL(requests[1].url).searchParams;
    assert.equal(query.get("count"), "0"); assert.equal(query.get("listType"), "11");
    assert.equal(query.get("mine"), "1"); assert.equal(query.get("userVid"), "12");
  });
  it("rejects invalid selection and blank thoughts before sending anything", async () => {
    assert.equal(parseNoteRange("9-1"), null);
    assert.equal(parseNoteRange("1-9007199254740992"), null);
    assert.throws(() => validateNoteWrite({ ...selection, range: "-1-2" }));
    await assert.rejects(web_note_create({ ...selection, content: "  " }));
    assert.equal(requests.length, 0);
  });
  it("does not accept an HTTP 200 business error as a saved note", async () => {
    axios.defaults.adapter = async (config) => ({ data: { errCode: -999, errMsg: "拒绝保存" }, status: 200, statusText: "OK", headers: {}, config });
    await assert.rejects(web_note_create(selection), NoteBusinessError);
  });
});

describe("WeRead note write reconciliation", () => {
  it("shares concurrent requests and deduplicates an existing bookmark", async () => {
    let creates = 0;
    const notes: PersonalNote[] = [];
    const writer = new NoteWriter({ load: async () => [...notes], create: async (input) => {
      creates++; await Promise.resolve(); notes.push(note("new", input)); return { id: "new" };
    } });
    const input: NoteWrite = { ...selection, kind: "bookmark" };
    const results = await Promise.all([writer.write("one", input), writer.write("one", input)]);
    assert.ok(results.every((r) => r.status === "saved"));
    assert.equal((await writer.write("two", input)).status, "saved"); assert.equal(creates, 1);
  });
  it("reads back a committed write after a timeout without sending it again", async () => {
    const notes: PersonalNote[] = []; let creates = 0;
    const writer = new NoteWriter({ load: async () => [...notes], create: async (input) => {
      creates++; notes.push(note("committed", input)); throw new Error("ETIMEDOUT");
    } });
    const result = await writer.write("timeout", selection);
    assert.equal(result.status, "saved"); assert.equal(result.note?.id, "committed"); assert.equal(creates, 1);
  });
  it("keeps unresolved requests across new ids and can confirm a delayed write", async () => {
    const notes: PersonalNote[] = [note("old-identical")]; let creates = 0;
    const writer = new NoteWriter({ load: async () => [...notes], create: async () => { creates++; throw new Error("timeout"); } });
    assert.equal((await writer.write("first", selection)).status, "uncertain");
    assert.equal((await writer.write("first", selection)).status, "uncertain");
    const repeat = await writer.write("new-id", selection);
    assert.equal(repeat.trackingId, "first"); assert.equal(creates, 1);
    notes.push(note("eventually-committed"));
    assert.equal((await writer.recheck("first", "book", 2)).note?.id, "eventually-committed");
  });
  it("does not confirm a thought whose privacy differs from the submitted choice", async () => {
    const notes: PersonalNote[] = [];
    const writer = new NoteWriter({ load: async () => [...notes], create: async () => {
      notes.push(note("wrong-visibility", { ...selection, isPrivate: true })); throw new Error("timeout");
    } });
    assert.equal((await writer.write("privacy", selection)).status, "uncertain");
  });
  it("never sends a write if its baseline could not be read", async () => {
    let creates = 0;
    const writer = new NoteWriter({ load: async () => { throw new Error("offline"); }, create: async () => { creates++; return { id: "no" }; } });
    assert.equal((await writer.write("offline", selection)).status, "failed"); assert.equal(creates, 0);
  });
  it("allows a new attempt after an explicit business rejection", async () => {
    let creates = 0;
    const writer = new NoteWriter({ load: async () => [], create: async () => {
      if (++creates === 1) throw new NoteBusinessError("rejected"); return { id: "ok" };
    } });
    assert.equal((await writer.write("failed", selection)).status, "failed");
    assert.equal((await writer.write("retry", selection)).status, "saved"); assert.equal(creates, 2);
  });
});
