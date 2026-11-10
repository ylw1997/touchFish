import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, App, Button, Input, Modal, Radio, Space } from "antd";
import { vscode } from "../utils/vscode";
import type { NoteWrite, NoteWriteResult, PersonalNote, ReaderSelection } from "../../../src/api/weread/noteTypes";
import { decorateChapter, prepareChapter, selectionFromRange } from "./chapter";

export type NavigationGuard = (next: () => void) => void;
interface Props {
  bookId: string;
  chapterUid: number;
  chapterIdx?: number;
  bookVersion?: number;
  html: string;
  format: string;
  underlines: { range: string }[];
  onGuardChange: (guard: NavigationGuard | null) => void;
  onReadPopular?: (range: string) => void;
}
const newId = () => crypto.randomUUID();

export function ReaderAnnotations(props: Props) {
  const { bookId, chapterUid, chapterIdx, bookVersion, html, format, underlines, onGuardChange } = props;
  const { message, modal } = App.useApp();
  const root = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [selection, setSelection] = useState<ReaderSelection | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "uncertain">("idle");
  const [checking, setChecking] = useState(false);
  const [readNote, setReadNote] = useState<PersonalNote[] | null>(null);
  const [readHotRange, setReadHotRange] = useState<string | null>(null);
  const writeId = useRef<string | null>(null);
  const notesId = useRef<string | null>(null);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uncertainTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(true);
  const prepared = useMemo(() => prepareChapter(html, format), [html, format]);
  const decorated = useMemo(() => decorateChapter(prepared, [
    ...underlines,
    ...notes.map((note) => ({ range: note.range, personal: true, id: note.id })),
  ]), [prepared, underlines, notes]);
  const markup = useMemo(() => ({ __html: decorated }), [decorated]);

  const clearSelection = () => { setSelection(null); setPosition(null); window.getSelection()?.removeAllRanges(); };
  const loadNotes = () => {
    notesId.current = newId();
    vscode.postMessage({ command: "WEREAD_GET_MY_NOTES", uuid: notesId.current, payload: { bookId, chapterUid } });
  };

  useEffect(() => {
    active.current = true;
    loadNotes();
    const handle = (event: MessageEvent) => {
      const data = event.data;
      if (!active.current || data.bookId !== bookId || data.chapterUid !== chapterUid) return;
      if (data.command === "WEREAD_MY_NOTES_DATA" && data.uuid === notesId.current) {
        setNotes(data.payload.notes || []);
      }
      if (data.command === "WEREAD_MY_NOTES_ERROR" && data.uuid === notesId.current) {
        message.warning(data.payload.message || "个人笔记暂未加载，可刷新重试");
      }
      if (data.command !== "WEREAD_NOTE_RESULT" || data.uuid !== writeId.current) return;
      if (writeTimer.current) clearTimeout(writeTimer.current);
      writeTimer.current = null;
      if (uncertainTimer.current) clearTimeout(uncertainTimer.current);
      setChecking(false);
      const result = data.payload as NoteWriteResult;
      if (result.status === "saved") {
        setStatus("idle"); setEditing(false); setContent(""); clearSelection();
        message.success("已保存到微信读书");
        if (result.note) setNotes((current) => [...current.filter((note) => note.id !== result.note!.id), result.note!]);
        loadNotes();
      } else if (result.status === "uncertain") {
        if (result.trackingId) writeId.current = result.trackingId;
        setStatus("uncertain");
        message.warning(result.message || "保存结果待确认，请核对后再操作");
      } else {
        setStatus("idle");
        message.error(result.message || "保存失败，输入内容已保留");
      }
    };
    window.addEventListener("message", handle);
    return () => {
      active.current = false;
      window.removeEventListener("message", handle);
      if (writeTimer.current) clearTimeout(writeTimer.current);
      if (uncertainTimer.current) clearTimeout(uncertainTimer.current);
    };
  // Each instance belongs to one immutable chapter; callbacks use that identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterUid]);

  useEffect(() => {
    const guard: NavigationGuard = (next) => {
      if (status === "saving") { message.info("正在保存笔记，请稍候"); return; }
      if (content.trim() || status === "uncertain") {
        modal.confirm({
          title: "离开当前章节？",
          content: status === "uncertain" ? "保存结果仍待确认。离开后请先在微信读书核对，避免重复提交。" : "尚未提交的想法会被丢弃。",
          okText: "离开", cancelText: "继续编辑", onOk: next,
        });
      } else next();
    };
    onGuardChange(guard);
    return () => onGuardChange(null);
  }, [content, status, onGuardChange, modal, message]);

  useEffect(() => {
    const select = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(".weread-selection-toolbar,.ant-modal")) return;
      if (editing || status !== "idle") return;
      const selected = window.getSelection();
      if (!selected?.rangeCount || !root.current) return;
      const range = selected.getRangeAt(0);
      const snapshot = selectionFromRange(root.current, range, { bookId, chapterUid, chapterIdx, bookVersion });
      if (!snapshot) { setSelection(null); setPosition(null); return; }
      const rect = range.getBoundingClientRect();
      setSelection(snapshot);
      setPosition({ top: Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 56)), left: Math.max(8, Math.min(rect.left, window.innerWidth - 208)) });
    };
    const hide = () => { if (!editing && status === "idle") setPosition(null); };
    document.addEventListener("mouseup", select);
    document.addEventListener("keyup", select);
    document.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("mouseup", select); document.removeEventListener("keyup", select);
      document.removeEventListener("scroll", hide, true); window.removeEventListener("resize", hide);
    };
  }, [bookId, chapterUid, chapterIdx, bookVersion, editing, status]);

  const save = (kind: NoteWrite["kind"]) => {
    // A ref closes the gap before React commits the disabled button state.
    if (!selection || status !== "idle" || writeTimer.current) return;
    const uuid = newId(); writeId.current = uuid;
    setStatus("saving");
    writeTimer.current = setTimeout(() => {
      writeTimer.current = null;
      if (active.current) setStatus("uncertain");
    }, 35_000);
    vscode.postMessage({
      command: kind === "bookmark" ? "WEREAD_ADD_BOOKMARK" : "WEREAD_ADD_THOUGHT", uuid,
      payload: { ...selection, kind, content: kind === "thought" ? content : undefined, isPrivate },
    });
  };
  const recheck = () => {
    if (!writeId.current || checking) return;
    setChecking(true);
    uncertainTimer.current = setTimeout(() => { if (active.current) setChecking(false); }, 25_000);
    vscode.postMessage({ command: "WEREAD_RECHECK_NOTE", uuid: writeId.current, payload: { bookId, chapterUid } });
  };
  const closeEditor = () => {
    if (status === "saving") return;
    if (status === "uncertain") { message.info("请先核对保存结果，避免重复提交"); return; }
    if (!content.trim()) { setEditing(false); return; }
    modal.confirm({ title: "丢弃未提交的想法？", okText: "丢弃", cancelText: "继续编辑", onOk: () => { setEditing(false); setContent(""); } });
  };

  return <>
    <div ref={root} className={`xhtml-content ${format === "txt" ? "chapter-txt" : ""}`}
      onClick={(event) => {
        if (window.getSelection()?.toString()) { event.stopPropagation(); return; }
        const target = event.target as HTMLElement;
        const mark = target.closest<HTMLElement>("[data-note-ids]");
        if (mark && !target.closest(".weread-footnote-wrapper")) {
          event.stopPropagation();
          const ids = mark.dataset.noteIds?.split(" ") || [];
          setReadNote(notes.filter((note) => ids.includes(note.id)));
          setReadHotRange(target.closest(".hot-underline")?.getAttribute("data-range") || null);
        }
      }} dangerouslySetInnerHTML={markup} />
    {selection && position && !editing && <div className="weread-selection-toolbar" role="toolbar" aria-label="选文操作"
      style={position} onMouseDown={(event) => event.preventDefault()}>
      <Button disabled={status !== "idle"} loading={status === "saving"} onClick={() => save("bookmark")}>划线</Button>
      <Button disabled={status !== "idle"} onClick={() => { if (!content) setIsPrivate(false); setEditing(true); setPosition(null); }}>写想法</Button>
    </div>}
    {status === "uncertain" && !editing && <div className="weread-note-status">
      <Alert type="warning" message="保存结果待确认" description="请先核对，避免重复创建笔记。"
        action={<Button loading={checking} onClick={recheck}>重新核对</Button>} />
    </div>}
    <Modal title="写想法" open={editing} onCancel={closeEditor} maskClosable={false}
      confirmLoading={status === "saving"} okText="提交到微信读书" cancelText="取消"
      okButtonProps={{ disabled: !content.trim() || status !== "idle" }} onOk={() => save("thought")}>
      <blockquote className="weread-note-quote">{selection?.quote}</blockquote>
      <Input.TextArea aria-label="想法内容" placeholder="写下你的想法" autoSize={{ minRows: 4, maxRows: 12 }}
        value={content} disabled={status !== "idle"} onChange={(event) => setContent(event.target.value)} />
      <Radio.Group aria-label="想法可见性" value={isPrivate} disabled={status !== "idle"}
        onChange={(event) => setIsPrivate(event.target.value)} className="weread-note-visibility">
        <Radio value={false}>公开</Radio><Radio value={true}>仅自己可见</Radio>
      </Radio.Group>
      {status === "uncertain" && <Alert type="warning" message="保存结果待确认，输入已保留"
        action={<Button loading={checking} onClick={recheck}>重新核对</Button>} />}
    </Modal>
    <Modal title="我的笔记" open={readNote !== null} footer={null} onCancel={() => setReadNote(null)}>
      {readHotRange && <Button onClick={() => { setReadNote(null); props.onReadPopular?.(readHotRange); }}>查看这段的热门想法</Button>}
      <Space direction="vertical" style={{ width: "100%" }}>{readNote?.map((note) => <div key={note.id}>
        <blockquote className="weread-note-quote">{note.quote}</blockquote>
        {note.content && <p style={{ whiteSpace: "pre-wrap" }}>{note.content}</p>}
        <small>{note.kind === "bookmark" ? "划线" : note.isPrivate ? "仅自己可见" : "公开想法"}</small>
      </div>)}</Space>
    </Modal>
  </>;
}
