import React, { useState, useEffect, useMemo, useRef } from "react";
import { Spin, Empty, Button, FloatButton, Drawer, App as AntdApp } from "antd";
import {
  LeftOutlined,
  ReloadOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  PlusOutlined,
  MinusOutlined,
  VerticalAlignTopOutlined,
  UnorderedListOutlined,
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
  const { increase, decrease } = useFontSizeStore();

  const catalogRef = useRef<Chapter[]>([]);
  const pendingUidRef = useRef<number | null>(null);
  const hasReceivedProgressRef = useRef<boolean>(false);

  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { command, payload } = event.data;
      switch (command) {
        case "WEREAD_SHELF_DATA":
          setBooks(payload.books || []);
          setLoading(false);
          break;
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
                // 如果进度包还没到，千万不要急着加载第一章，等进度包来触发
                console.log(
                  "[Weread] Catalog arrived but progress pending, waiting for progress data...",
                );
              } else {
                // 进度包已经到了（且没匹配上）或者是真的没进度，此时才加载第一章
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
            console.log(
              "[Weread] Catalog exists in ref, matching progress:",
              chapterUid,
              "found idx:",
              idx,
            );
            if (idx !== -1) {
              loadChapterWithBookId(
                payload.bookId || payload.book?.bookId,
                idx,
                currentCatalog,
                true,
              ); // 进度同步，静默
            }
          } else {
            console.log(
              "[Weread] Catalog not ready, setting pendingProgress:",
              chapterUid,
            );
            pendingUidRef.current = chapterUid; // 同步更新 Ref，解决竞态
          }
          break;
        }
        case "WEREAD_SAVE_PROGRESS_SUCCESS": {
          console.log("[Weread] Received save progress success message");
          message.success("进度已保存");
          break;
        }
        case "WEREAD_CHAPTER_DATA": {
          setChapterContent(payload);
          setLoading(false);
          setView("reader");
          // 自动滚动到顶部
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

    // 初始化获取书架数据
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

    // 1. 获取进度 (优先)
    hasReceivedProgressRef.current = false;
    vscode.postMessage({
      command: "WEREAD_GET_PROGRESS",
      payload: { bookId: book.bookId },
    });

    // 2. 获取目录
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
    vscode.postMessage({
      command: "WEREAD_GET_CHAPTER",
      payload: { bookId, chapterUid: chapters[idx].chapterUid, silent },
    });
    setCatalogVisible(false);
  };

  const backToShelf = () => {
    setView("shelf");
    setChapterContent(null);
  };

  const handleRefresh = () => {
    setLoading(true);
    vscode.postMessage({ command: "WEREAD_GET_SHELF" });
  };

  // 清洗 HTML 的逻辑
  const cleanedHtml = useMemo(() => {
    if (!chapterContent?.html) return "";
    let html = chapterContent.html;

    // 1. 如果被转义了，进行反转义
    if (html.includes("&lt;")) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      html = doc.documentElement.textContent || html;
    }

    // 2. 移除 XML 声明和 doctype
    html = html.replace(/<\?xml.*\?>/gi, "");
    html = html.replace(/<!DOCTYPE.*?>/gi, "");

    // 3. 提取 body 内容
    const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
    if (bodyMatch && bodyMatch[1]) {
      html = bodyMatch[1];
    }

    // 针对 TXT 格式进行智能分段处理
    if (chapterContent.format === "txt") {
      const paragraphs = html.split(/\r?\n/).filter((p) => p.trim() !== "");
      return paragraphs.map((p) => `<p>${p}</p>`).join("");
    }

    // 针对 EPUB/PDF 的 HTML 清理
    html = html.replace(/<html[^>]*>/gi, "");
    html = html.replace(/<\/html>/gi, "");
    html = html.replace(/<body[^>]*>/gi, "");
    html = html.replace(/<\/body>/gi, "");
    html = html.replace(/<head[^>]*>[\s\S]*<\/head>/gi, "");
    html = html.replace(/<title[^>]*>[\s\S]*<\/title>/gi, "");

    return html;
  }, [chapterContent]);

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
          <div className="reader-content">
            {loading ? (
              <div className="loading-container">
                <Spin />
              </div>
            ) : (
              <>
                <style
                  dangerouslySetInnerHTML={{
                    __html: chapterContent?.style || "",
                  }}
                />
                <div className="chapter-header">
                  {catalog[currentChapterIdx]?.title}
                </div>
                <div
                  className="xhtml-content"
                  dangerouslySetInnerHTML={{ __html: cleanedHtml }}
                />

                {/* 翻页控制 */}
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
              </>
            )}
          </div>
        </div>
      )}

      <Drawer
        title="书籍目录"
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
              // 自动跳转到当前章节
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
