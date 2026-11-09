import { NoteBusinessError } from "./api/notes";
import { isWeReadAuthFailure } from "./auth";
import { validateNoteWrite, type NoteWrite, type NoteWriteResult, type PersonalNote } from "./noteTypes";

interface NoteTransport {
  load(bookId: string, chapterUid: number): Promise<PersonalNote[]>;
  create(input: NoteWrite): Promise<{ id?: string }>;
}
interface WriteRecord {
  input: NoteWrite;
  before: Set<string>;
  result: NoteWriteResult;
  pending?: Promise<NoteWriteResult>;
}

/** Keeps uncertain writes across webview remounts; a timeout is never a retry signal. */
export class NoteWriter {
  private records = new Map<string, WriteRecord>();
  constructor(private readonly transport: NoteTransport) {}

  load(bookId: string, chapterUid: number) { return this.transport.load(bookId, chapterUid); }

  async write(uuid: string, input: NoteWrite): Promise<NoteWriteResult> {
    validateNoteWrite(input);
    if (!uuid || uuid.length > 100) throw new Error("笔记请求标识无效");
    const previous = this.records.get(uuid);
    if (previous) {
      if (JSON.stringify(previous.input) !== JSON.stringify(input)) throw new Error("笔记请求标识已被使用");
      return previous.pending || previous.result;
    }
    for (const [id, record] of this.records) {
      if (record.result.status === "uncertain" && record.input.bookId === input.bookId &&
          record.input.chapterUid === input.chapterUid && record.input.range === input.range &&
          record.input.kind === input.kind) {
        return { ...record.result, trackingId: id, message: "该选文有一条保存结果待确认的笔记，请先核对" };
      }
    }
    if (this.records.size >= 500) {
      for (const [id, record] of this.records) {
        if (!record.pending && record.result.status !== "uncertain") this.records.delete(id);
        if (this.records.size < 500) break;
      }
      if (this.records.size >= 500) throw new Error("请先核对待确认的笔记，再继续保存");
    }
    const record: WriteRecord = { input: { ...input }, before: new Set(), result: { status: "uncertain" } };
    this.records.set(uuid, record);
    // Register before any asynchronous work so concurrent clicks share this operation.
    record.pending = this.perform(record).finally(() => { record.pending = undefined; });
    return record.pending;
  }

  async recheck(uuid: string, bookId: string, chapterUid: number): Promise<NoteWriteResult> {
    const record = this.records.get(uuid);
    if (!record || record.input.bookId !== bookId || record.input.chapterUid !== chapterUid) {
      return { status: "uncertain", message: "无法确认此笔记，请先在微信读书中核对，避免重复提交" };
    }
    if (record.pending) return record.pending;
    if (record.result.status !== "uncertain") return record.result;
    return this.reconcile(record);
  }

  private async perform(record: WriteRecord): Promise<NoteWriteResult> {
    const input = record.input;
    try {
      const before = await this.load(input.bookId, input.chapterUid);
      record.before = new Set(before.map((note) => note.id));
      const existing = before.find((note) => note.kind === "bookmark" && note.range === input.range);
      if (input.kind === "bookmark" && existing) return record.result = { status: "saved", note: existing };
    } catch (error: any) {
      return record.result = { status: "failed", message: error.message || "个人笔记未加载，尚未提交" };
    }
    try {
      const saved = await this.transport.create(input);
      if (saved.id) {
        return record.result = { status: "saved", note: { ...input, id: saved.id } };
      }
      // A successful bookmark response can omit its id; obtain it from the snapshot.
      return await this.reconcile(record);
    } catch (error: any) {
      const status = error?.response?.status;
      if (error instanceof NoteBusinessError || isWeReadAuthFailure(error) || (typeof status === "number" && status >= 400 && status < 500)) {
        return record.result = { status: "failed", message: error.message || "微信读书未保存笔记" };
      }
      return this.reconcile(record);
    }
  }

  private async reconcile(record: WriteRecord): Promise<NoteWriteResult> {
    try {
      const input = record.input;
      const notes = await this.load(input.bookId, input.chapterUid);
      const saved = notes.find((note) => !record.before.has(note.id) && note.kind === input.kind &&
        note.range === input.range && note.quote === input.quote &&
        (input.kind === "bookmark" || (note.content === input.content && note.isPrivate === input.isPrivate)));
      if (saved) return record.result = { status: "saved", note: saved };
    } catch { /* A failed read cannot prove that a write failed. */ }
    return record.result = { status: "uncertain", message: "保存结果待确认，请先重新核对或在微信读书查看，避免重复提交" };
  }
}
