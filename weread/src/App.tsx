import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Spin,
  Empty,
  Button,
  FloatButton,
  Drawer,
  Popover,
  App as AntdApp,
} from "antd";
import {
  LeftOutlined,
  ReloadOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  PlusOutlined,
  MinusOutlined,
  VerticalAlignTopOutlined,
  UnorderedListOutlined,
  LikeOutlined,
} from "@ant-design/icons";
import { vscode } from "./utils/vscode";
import { useFontSizeStore } from "./store/fontSize";
import "./style/App.less";

interface Book {
  bookId: string;
  title: string;
  cover: string;
}

interface Chapter {
  chapterUid: number;
  title: string;
  level: number;
}

interface ChapterContent {
  html: string;
  style: string;
  format: string;
}

interface Thought {
  reviewId: string;
  abstract: string;
  content: string;
  user: {
    name: string;
    avatar: string;
  };
  range?: string;
  chapterUid?: number;
  likeCount?: number;
}

interface Underline {
  range: string;
  count: number;
  type: number;
}

const App: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [catalog, setCatalog] = useState<Chapter[]>([]);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [chapterContent, setChapterContent] = useState<ChapterContent | null>(
    null,
  );
  const [view, setView] = useState<"shelf" | "reader">("shelf");
  const [catalogVisible, setCatalogVisible] = useState(false);
  const [underlines, setUnderlines] = useState<Underline[]>([]);
  const [bestThoughts, setBestThoughts] = useState<Thought[]>([]);
  const [bestThoughtsVisible, setBestThoughtsVisible] = useState(false);
  const [bestThoughtsLoading, setBestThoughtsLoading] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const { increase, decrease } = useFontSizeStore();
  const { fontSize } = useFontSizeStore();

  const catalogRef = useRef<Chapter[]>([]);
  const currentBookRef = useRef<Book | null>(null);
  const pendingUidRef = useRef<number | null>(null);
  const hasReceivedProgressRef = useRef<boolean>(false);

  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);

  useEffect(() => {
    currentBookRef.current = currentBook;
  }, [currentBook]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { command, payload } = event.data;
      switch (command) {
        case "WEREAD_SHELF_DATA":
          setBooks(payload.books || []);
          setLoading(false);
          break;
        case "WEREAD_UNDERLINES_DATA": {
          console.log(
            "[Weread] Underlines received:",
            payload.underlines?.length,
            payload.underlines,
          );
          setUnderlines(payload.underlines || []);
          break;
        }
        case "WEREAD_BEST_THOUGHTS_DATA": {
          const reviews = payload.reviews || [];
          const formatted = reviews.flatMap((r: any) =>
            (r.pageReviews || []).map((pr: any) => ({
              reviewId: pr.review.reviewId,
              abstract: pr.review.abstract,
              content: pr.review.content,
              user: {
                name: pr.review.author.name,
                avatar: pr.review.author.avatar,
              },
              likeCount: pr.likesCount || 0,
            })),
          );
          setBestThoughts(formatted);
          setBestThoughtsLoading(false);
          setBestThoughtsVisible(true);
          break;
        }
        case "WEREAD_CATALOG_DATA": {
          if (payload && payload.data && payload.data[0]) {
            const chapters =
              payload.data[0].updated || payload.data[0].chapters || [];
            console.log(
              "[Weread] Catalog received:",
              chapters.length,
              "chapters",
            );
            setCatalog(chapters);

            // 如果没进度或进度匹配失败
            if (chapters.length > 0) {
              const pUid = pendingUidRef.current;
              const idx =
                pUid !== null
                  ? chapters.findIndex(
                      (c: any) => String(c.chapterUid) === String(pUid),
                    )
                  : -1;

              if (pUid !== null && idx !== -1) {
                console.log(
                  "[Weread] Catalog arrived, matching pending progress:",
                  pUid,
                  "found idx:",
                  idx,
                );
                loadChapterWithBookId(
                  payload.data[0].bookId,
                  idx,
                  chapters,
                  true,
                );
                pendingUidRef.current = null;
              } else if (!hasReceivedProgressRef.current) {
                console.log(
                  "[Weread] Catalog arrived but progress pending, waiting for progress data...",
                );
              } else {
                console.log(
                  "[Weread] Loading first chapter (no progress match or really no progress)",
                );
                loadChapterWithBookId(
                  payload.data[0].bookId,
                  0,
                  chapters,
                  true,
                );
              }
            }
          }
          break;
        }
        case "WEREAD_PROGRESS_DATA": {
          console.log("[Weread] Progress data received:", payload);
          hasReceivedProgressRef.current = true;
          const chapterUid = payload?.book?.chapterUid;
          const currentCatalog = catalogRef.current;

          if (currentCatalog.length > 0) {
            const idx = currentCatalog.findIndex(
              (c) => String(c.chapterUid) === String(chapterUid),
            );
            if (idx !== -1) {
              loadChapterWithBookId(
                payload.bookId || payload.book?.bookId,
                idx,
                currentCatalog,
                true,
              );
            }
          } else {
            pendingUidRef.current = chapterUid;
          }
          break;
        }
        case "WEREAD_SAVE_PROGRESS_SUCCESS": {
          message.success("进度已保存");
          break;
        }
        case "WEREAD_CHAPTER_DATA": {
          console.log(
            "[Weread] Chapter content received:",
            payload.format,
            payload,
          );
          setChapterContent(payload);
          setLoading(false);
          setView("reader");
          const contentEl = document.querySelector(".reader-content");
          if (contentEl) contentEl.scrollTop = 0;
          break;
        }
        case "WEREAD_ERROR":
          message.error(payload.message);
          setLoading(false);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    setLoading(true);
    vscode.postMessage({ command: "WEREAD_GET_SHELF" });

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const openBook = (book: Book) => {
    setCurrentBook(book);
    setView("reader");
    setLoading(true);
    setCatalog([]);
    setCurrentChapterIdx(0);
    pendingUidRef.current = null;
    hasReceivedProgressRef.current = false;

    vscode.postMessage({
      command: "WEREAD_GET_PROGRESS",
      payload: { bookId: book.bookId },
    });

    vscode.postMessage({
      command: "WEREAD_GET_CATALOG",
      payload: { bookId: book.bookId },
    });
  };

  const loadChapter = (idx: number) => {
    if (!currentBook || !catalog[idx]) return;
    loadChapterWithBookId(currentBook.bookId, idx, catalog);
  };

  const loadChapterWithBookId = (
    bookId: string,
    idx: number,
    chapters: Chapter[],
    silent = false,
  ) => {
    setLoading(true);
    setCurrentChapterIdx(idx);
    const chapter = chapters[idx];

    vscode.postMessage({
      command: "WEREAD_GET_CHAPTER",
      payload: { bookId, chapterUid: chapter.chapterUid, silent },
    });

    vscode.postMessage({
      command: "WEREAD_GET_UNDERLINES",
      payload: { bookId, chapterUid: chapter.chapterUid },
    });

    setCatalogVisible(false);
  };

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const underlineEl = target.closest(".hot-underline") as HTMLElement;
    if (underlineEl) {
      const rect = underlineEl.getBoundingClientRect();
      setPopoverPos({
        top: rect.top + rect.height,
        left: rect.left,
      });
      setBestThoughtsLoading(true);
      setBestThoughtsVisible(true);
      setBestThoughts([]);

      const range = underlineEl.getAttribute("data-range");
      if (range && currentBook && currentChapterIdx !== -1) {
        vscode.postMessage({
          command: "WEREAD_GET_BEST_THOUGHTS",
          payload: {
            bookId: currentBook.bookId,
            chapterUid: catalog[currentChapterIdx].chapterUid,
            range,
          },
        });
      }
    }
  };

  const backToShelf = () => {
    setView("shelf");
    setChapterContent(null);
  };

  const handleRefresh = () => {
    if (view === "shelf") {
      setLoading(true);
      vscode.postMessage({ command: "WEREAD_GET_SHELF" });
    } else if (currentBook && catalog[currentChapterIdx]) {
      loadChapter(currentChapterIdx);
    }
  };

  const cleanedHtml = useMemo(() => {
    if (!chapterContent?.html) return "";
    let html = chapterContent.html;

    if (html.includes("&lt;")) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      html = doc.documentElement.textContent || html;
    }

    const injectUnderlines = (rawHtml: string, underlines: Underline[]) => {
      if (!underlines.length) return rawHtml;

      const sorted = [...underlines].sort((a, b) => {
        const startA = parseInt(a.range.split("-")[0]);
        const startB = parseInt(b.range.split("-")[0]);
        return startB - startA;
      });

      let result = rawHtml;
      sorted.forEach((u) => {
        const [start, end] = u.range.split("-").map(Number);
        if (isNaN(start) || isNaN(end)) return;

        const before = result.slice(0, start);
        const middle = result.slice(start, end);
        const after = result.slice(end);

        result = `${before}<span class="hot-underline" data-range="${u.range}">${middle}</span>${after}`;
      });

      return result;
    };

    if (chapterContent.format === "txt") {
      const paragraphs = html.split(/\r?\n/).filter((p) => p.trim() !== "");
      return injectUnderlines(paragraphs.join("\n"), underlines)
        .split("\n")
        .map((p) => `<p>${p}</p>`)
        .join("");
    }

    console.log("[Weread] Injecting to HTML source index mode...");
    let injected = injectUnderlines(html, underlines);

    // 注入完成后，必须剥离所有外部包装标签，否则 dangerouslySetInnerHTML 会因为包含 html/body 而失效
    injected = injected
      .replace(/<\?xml.*\?>/gi, "")
      .replace(/<!DOCTYPE.*?>/gi, "")
      .replace(/<html[^>]*>/gi, "")
      .replace(/<\/html>/gi, "")
      .replace(/<head[^>]*>[\s\S]*<\/head>/gi, "")
      .replace(/<body[^>]*>/gi, "")
      .replace(/<\/body>/gi, "");

    return injected;
  }, [chapterContent, underlines]);

  return (
    <div className={`weread-app ${view}`}>
      {view === "shelf" ? (
        <>
          <div className="header">
            <h1>书架</h1>
          </div>
          <div className="shelf-content">
            {loading ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : books.length > 0 ? (
              <div className="shelf-grid">
                {books.map((book: Book) => (
                  <div
                    key={book.bookId}
                    className="book-item"
                    onClick={() => openBook(book)}
                  >
                    <div className="book-cover">
                      <img src={book.cover} alt={book.title} />
                    </div>
                    <div className="book-info">
                      <span className="book-title">{book.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="书架空空如也" />
            )}
          </div>
        </>
      ) : (
        <div className="reader-view">
          <div className="reader-header">
            <Button type="text" icon={<LeftOutlined />} onClick={backToShelf} />
            <span className="reader-title">{currentBook?.title}</span>
          </div>
          <div className="reader-content" onClick={handleContentClick}>
            {loading ? (
              <div className="loading-container">
                <Spin />
              </div>
            ) : (
              chapterContent && (
                <div
                  className="content-body"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  <style>{chapterContent.style || ""}</style>
                  <div className="chapter-header">
                    {catalog[currentChapterIdx]?.title}
                  </div>
                  <div
                    className="xhtml-content"
                    dangerouslySetInnerHTML={{ __html: cleanedHtml }}
                  />
                  <div className="reader-footer">
                    <Button
                      disabled={currentChapterIdx <= 0}
                      icon={<DoubleLeftOutlined />}
                      onClick={() => loadChapter(currentChapterIdx - 1)}
                    >
                      上一章
                    </Button>
                    <Button
                      disabled={currentChapterIdx >= catalog.length - 1}
                      icon={<DoubleRightOutlined />}
                      onClick={() => loadChapter(currentChapterIdx + 1)}
                    >
                      下一章
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      <Drawer
        title="目录"
        placement="left"
        onClose={() => setCatalogVisible(false)}
        open={catalogVisible}
        width={300}
        className="catalog-drawer"
        styles={{ body: { padding: 0 } }}
      >
        <div className="catalog-list">
          {catalog.map((chapter, index) => (
            <div
              key={chapter.chapterUid}
              id={`chapter-${index}`}
              className={`catalog-item ${currentChapterIdx === index ? "active" : ""} level-${chapter.level}`}
              onClick={() => loadChapter(index)}
            >
              {chapter.title}
            </div>
          ))}
        </div>
      </Drawer>

      <Popover
        open={bestThoughtsVisible}
        onOpenChange={(visible) => {
          if (!visible) {
            setBestThoughtsVisible(false);
            setPopoverPos(null);
          }
        }}
        trigger="click"
        placement="bottomLeft"
        content={
          <div
            style={{
              maxWidth: "300px",
              minWidth: "150px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {bestThoughtsLoading ? (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <Spin size="small" />
              </div>
            ) : bestThoughts.length > 0 ? (
              bestThoughts.map((thought) => (
                <div
                  key={thought.reviewId}
                  style={{
                    marginBottom: "12px",
                    padding: "8px",
                    borderBottom: "1px solid var(--vscode-chat-requestBorder)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <img
                      src={thought.user.avatar}
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "calc(var(--app-font-size) - 1px)",
                        fontWeight: 600,
                      }}
                    >
                      {thought.user.name}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "calc(var(--app-font-size) - 1px)",
                      color: "var(--vscode-editor-foreground)",
                      marginBottom: "4px",
                    }}
                  >
                    {thought.content}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "var(--vscode-descriptionForeground)",
                      fontSize: "11px",
                    }}
                  >
                    <LikeOutlined /> {thought.likeCount}
                  </div>
                </div>
              ))
            ) : (
              <Empty
                description="暂无热门想法"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        }
      >
        <div
          style={{
            position: "fixed",
            top: popoverPos ? popoverPos.top : -999,
            left: popoverPos ? popoverPos.left : -999,
            width: "1px",
            height: "1px",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
      </Popover>

      <Drawer
        title="热门想法"
        placement="right"
        onClose={() => setBestThoughtsVisible(false)}
        open={false} // 改用 Popover 后这里不再显示
        width={350}
        styles={{ body: { padding: "16px" } }}
      >
        <div className="best-thoughts-list">
          {bestThoughts.length > 0 ? (
            bestThoughts.map((thought) => (
              <div
                key={thought.reviewId}
                className="thought-item"
                style={{
                  marginBottom: "24px",
                  borderBottom: "1px solid var(--vscode-chat-requestBorder)",
                  paddingBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <img
                    src={thought.user.avatar}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "calc(var(--app-font-size) - 1px)",
                    }}
                  >
                    {thought.user.name}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    lineHeight: "1.6",
                    color: "var(--vscode-editor-foreground)",
                  }}
                >
                  {thought.content}
                </div>
              </div>
            ))
          ) : (
            <Empty description="暂无更多想法" />
          )}
        </div>
      </Drawer>

      <FloatButton.Group shape="circle" style={{ right: 24, bottom: 24 }}>
        <FloatButton
          icon={<MinusOutlined style={{ color: "#52c41a" }} />}
          tooltip={<div>减小字体</div>}
          onClick={decrease}
        />
        <FloatButton
          icon={<PlusOutlined style={{ color: "#ff4d4f" }} />}
          tooltip={<div>增大字体</div>}
          onClick={increase}
        />
        {view === "reader" && (
          <FloatButton.BackTop
            target={() =>
              document.querySelector(".reader-content") as HTMLElement
            }
            visibilityHeight={400}
            icon={<VerticalAlignTopOutlined style={{ color: "#00a1d6" }} />}
            tooltip={<div>回到顶部</div>}
          />
        )}
        <FloatButton
          icon={<ReloadOutlined style={{ color: "#1890ff" }} />}
          tooltip={<div>{view === "shelf" ? "刷新书架" : "刷新本章"}</div>}
          onClick={handleRefresh}
        />
        {view === "reader" && (
          <FloatButton
            icon={<UnorderedListOutlined style={{ color: "#faad14" }} />}
            tooltip={<div>查看目录</div>}
            onClick={() => {
              setCatalogVisible(true);
              setTimeout(() => {
                const activeItem = document.getElementById(
                  `chapter-${currentChapterIdx}`,
                );
                if (activeItem) {
                  activeItem.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }
              }, 100);
            }}
          />
        )}
      </FloatButton.Group>
    </div>
  );
};

export default App;
