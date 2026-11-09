import { parseNoteRange } from "../../../src/api/weread/noteTypes";
import type { ReaderSelection } from "../../../src/api/weread/noteTypes";

const SOURCE = "data-wr-source-start";
const ignored = "script,style,title,head";

const escapeText = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#13;");

/** The Web protocol counts positions in the original HTML, including markup/entities. */
function mapOriginalHtml(html: string): string {
  let output = "", pos = 0, rawTag = "";
  let inBody = !/<body(?:\s|>)/i.test(html);
  while (pos < html.length) {
    if (html.startsWith("<!--", pos)) {
      const end = html.indexOf("-->", pos + 4);
      const next = end < 0 ? html.length : end + 3;
      output += html.slice(pos, next); pos = next; continue;
    }
    if (html[pos] === "<" && /^<\/?[a-z!\?]/i.test(html.slice(pos, pos + 3))) {
      let end = pos + 1, quote = "";
      for (; end < html.length; end++) {
        const char = html[end];
        if (quote) { if (char === quote) quote = ""; }
        else if (char === '"' || char === "'") quote = char;
        else if (char === ">") break;
      }
      const tag = html.slice(pos, end + 1);
      const name = /^<\/?([\w:-]+)/.exec(tag)?.[1].toLowerCase();
      if (name === "body") inBody = !tag.startsWith("</");
      if (name && /^(script|style|title|svg|textarea)$/.test(name)) {
        if (tag.startsWith("</")) rawTag = "";
        else if (!tag.endsWith("/>")) rawTag = name;
      }
      output += tag; pos = end + 1; continue;
    }
    let end = pos + 1;
    while (end < html.length && !(html[end] === "<" && /^(?:<\/?[a-z!\?]|<!--)/i.test(html.slice(end, end + 4)))) end++;
    const raw = html.slice(pos, end);
    if (rawTag || !inBody) output += raw;
    else {
      // Entity source width differs from its displayed width; never combine it with adjacent text.
      const tokens = /&#(?:x[\da-f]+|\d+);|&[a-z][\da-z]*;/gi;
      let cursor = 0;
      const append = (text: string, offset: number) => {
        if (!text) return;
        output += `<span ${SOURCE}="${offset}">${escapeText(text)}</span>`;
      };
      for (const match of raw.matchAll(tokens)) {
        append(raw.slice(cursor, match.index), pos + cursor);
        const decoder = document.createElement("textarea");
        decoder.innerHTML = match[0];
        append(decoder.value, pos + match.index);
        cursor = match.index + match[0].length;
      }
      append(raw.slice(cursor), pos + cursor);
    }
    pos = end;
  }
  return output;
}

/** Build the source map before replacing footnotes or adding annotation markup. */
export function prepareChapter(html: string, format: string): string {
  const doc = document.implementation.createHTMLDocument("");
  const addText = (parent: Node, text: string, offset: number | null) => {
    if (!text) return;
    if (offset === null) { parent.appendChild(doc.createTextNode(text)); return; }
    const span = doc.createElement("span");
    span.setAttribute(SOURCE, String(offset));
    span.textContent = text;
    parent.appendChild(span);
  };
  if (format === "txt") {
    let offset = 0;
    for (const match of html.matchAll(/([^\r\n]*)(\r\n|\r|\n|$)/g)) {
      if (!match[0]) continue;
      const p = doc.createElement("p");
      addText(p, match[1], offset);
      // Keep source newlines selectable, including blank lines and CRLF.
      if (match[2]) addText(p, match[2], offset + match[1].length);
      doc.body.appendChild(p);
      offset += match[0].length;
    }
    return doc.body.innerHTML.replace(/\r/g, "&#13;");
  }
  if (/^\s*&lt;(?:\?xml|html|body|div|p|h[1-6])(?:\s|&gt;)/i.test(html)) {
    html = new DOMParser().parseFromString(html, "text/html").documentElement.textContent || html;
  }
  const hasAnchors = /\bdata-wr-co\s*=/.test(html);
  const parsed = new DOMParser().parseFromString(hasAnchors ? html : mapOriginalHtml(html), "text/html");
  parsed.querySelectorAll(ignored).forEach((el) => el.remove());
  const walk = (node: Node, cursor: number | null): number | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue || "";
      if (cursor !== null && text) {
        const wrapper = parsed.createElement("span");
        wrapper.setAttribute(SOURCE, String(cursor));
        node.parentNode?.replaceChild(wrapper, node);
        wrapper.appendChild(node);
      }
      return cursor === null ? null : cursor + text.length;
    }
    if (!(node instanceof Element)) return cursor;
    const anchor = node.getAttribute("data-wr-co");
    if (anchor !== null && /^\d+$/.test(anchor) && Number.isSafeInteger(Number(anchor))) cursor = Number(anchor);
    if (node.matches("img,br,hr,video,audio,svg")) return cursor === null ? null : cursor + 1;
    for (const child of Array.from(node.childNodes)) cursor = walk(child, cursor);
    return cursor;
  };
  if (hasAnchors) walk(parsed.body, null);
  parsed.querySelectorAll("img.qqreader-footnote").forEach((img) => {
    const span = parsed.createElement("span");
    span.className = "weread-footnote-wrapper";
    span.setAttribute("data-note", img.getAttribute("alt") || img.getAttribute("title") || "");
    const icon = parsed.createElement("span");
    icon.className = "weread-footnote-icon";
    span.appendChild(icon);
    img.replaceWith(span);
  });
  return parsed.body.innerHTML.replace(/\r/g, "&#13;");
}

export interface ChapterMark { range: string; personal?: boolean; id?: string }

/** Split at all boundaries so overlapping personal and popular marks survive. */
export function decorateChapter(html: string, marks: ChapterMark[]): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const ranges = marks.flatMap((mark) => {
    const range = parseNoteRange(mark.range);
    return range ? [{ ...mark, start: range[0], end: range[1] }] : [];
  });
  for (const span of doc.querySelectorAll<HTMLElement>(`[${SOURCE}]`)) {
    const text = span.textContent || "", start = Number(span.getAttribute(SOURCE));
    const overlap = ranges.filter((r) => r.end > start && r.start < start + text.length);
    if (!overlap.length) continue;
    const boundaries = [...new Set([0, text.length, ...overlap.flatMap((r) =>
      [Math.max(0, r.start - start), Math.min(text.length, r.end - start)])])].sort((a, b) => a - b);
    span.replaceChildren();
    for (let i = 0; i < boundaries.length - 1; i++) {
      const a = boundaries[i], b = boundaries[i + 1];
      const active = overlap.filter((r) => r.start < start + b && r.end > start + a);
      const part = doc.createElement("span");
      part.textContent = text.slice(a, b);
      const hot = active.find((r) => !r.personal);
      if (hot) { part.classList.add("hot-underline"); part.setAttribute("data-range", hot.range); }
      const own = active.filter((r) => r.personal);
      if (own.length) { part.classList.add("personal-underline"); part.setAttribute("data-note-ids", own.map((r) => r.id).join(" ")); }
      span.appendChild(part);
    }
  }
  return doc.body.innerHTML.replace(/\r/g, "&#13;");
}

export function selectionFromRange(
  root: HTMLElement, range: Range, identity: Omit<ReaderSelection, "range" | "quote">,
): ReaderSelection | null {
  if (range.collapsed || !root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  let start: number | undefined, end = 0, quote = "";
  for (const span of root.querySelectorAll<HTMLElement>(`[${SOURCE}]`)) {
    if (!range.intersectsNode(span)) continue;
    const part = document.createRange();
    part.selectNodeContents(span);
    if (range.compareBoundaryPoints(Range.START_TO_START, part) > 0) part.setStart(range.startContainer, range.startOffset);
    if (range.compareBoundaryPoints(Range.END_TO_END, part) < 0) part.setEnd(range.endContainer, range.endOffset);
    const text = part.toString();
    if (!text) continue;
    const prefix = document.createRange();
    prefix.selectNodeContents(span);
    prefix.setEnd(part.startContainer, part.startOffset);
    const a = Number(span.getAttribute(SOURCE)) + prefix.toString().length;
    if (start !== undefined && a < end) return null;
    start ??= a;
    end = a + text.length;
    quote += text;
  }
  // Unmapped text inside the selection must never be silently discarded.
  if (start === undefined || end <= start || !quote.trim() || quote !== range.toString()) return null;
  return { ...identity, range: `${start}-${end}`, quote };
}
