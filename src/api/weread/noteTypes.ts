/** Coordinates are UTF-16 offsets in the original chapter, with an exclusive end. */
export interface ReaderSelection {
  bookId: string;
  chapterUid: number;
  chapterIdx?: number;
  bookVersion?: number;
  range: string;
  quote: string;
}

export interface PersonalNote {
  id: string;
  kind: "bookmark" | "thought";
  bookId: string;
  chapterUid: number;
  range: string;
  quote: string;
  content?: string;
  isPrivate?: boolean;
}

export interface NoteWrite extends ReaderSelection {
  kind: PersonalNote["kind"];
  content?: string;
  isPrivate?: boolean;
}

export interface NoteWriteResult {
  status: "saved" | "failed" | "uncertain";
  message?: string;
  note?: PersonalNote;
  trackingId?: string;
}

export function parseNoteRange(range: string): [number, number] | null {
  if (!/^\d+-\d+$/.test(range)) return null;
  const [start, end] = range.split("-").map(Number);
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) && end > start
    ? [start, end]
    : null;
}

export function validateNoteWrite(input: NoteWrite): void {
  if (!input || typeof input.bookId !== "string" || !input.bookId.trim() ||
      !Number.isSafeInteger(input.chapterUid) || input.chapterUid < 0 ||
      typeof input.range !== "string" || !parseNoteRange(input.range) ||
      typeof input.quote !== "string" || !input.quote.trim() ||
      !["bookmark", "thought"].includes(input.kind)) {
    throw new Error("选文位置无效，请重新选择正文");
  }
  if (input.bookVersion !== undefined &&
      (!Number.isSafeInteger(input.bookVersion) || input.bookVersion < 0)) {
    throw new Error("书籍版本无效，请重新加载本章");
  }
  if (input.kind === "thought" &&
      (typeof input.content !== "string" || !input.content.trim() || typeof input.isPrivate !== "boolean")) {
    throw new Error("请输入想法并选择可见性");
  }
}
