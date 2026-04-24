import React, { useState, useEffect, useMemo } from 'react';
import { Spin, Empty, message, Button, FloatButton } from 'antd';
import { LeftOutlined, ReloadOutlined, DoubleLeftOutlined, DoubleRightOutlined, PlusOutlined, MinusOutlined, VerticalAlignTopOutlined } from '@ant-design/icons';
import { vscode } from './utils/vscode';
import { useFontSizeStore } from './store/fontSize';
import './style/App.less';

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
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [catalog, setCatalog] = useState<Chapter[]>([]);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [chapterContent, setChapterContent] = useState<ChapterContent | null>(null);
  const [view, setView] = useState<'shelf' | 'reader'>('shelf');
  
  const { increase, decrease } = useFontSizeStore();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { command, payload } = event.data;
      switch (command) {
        case 'WEREAD_SHELF_DATA':
          setBooks(payload.books || []);
          setLoading(false);
          break;
        case 'WEREAD_CATALOG_DATA': {
          if (payload && payload.data && payload.data[0]) {
            const chapters = payload.data[0].updated || payload.data[0].chapters || [];
            setCatalog(chapters);
            
            // 如果是新打开的书（loading 状态），自动加载第一章
            if (chapters.length > 0) {
              const firstChapter = chapters[0];
              // 这里的 currentBook 状态由于是异步的，可能还没更新，建议使用 payload 中的 bookId 或闭包处理
              // 但由于 openBook 设置了 currentBook，且本 case 在其之后触发，通常没问题
              // 稳妥起见，我们直接请求
              vscode.postMessage({ 
                command: 'WEREAD_GET_CHAPTER', 
                payload: { bookId: payload.data[0].bookId, chapterUid: firstChapter.chapterUid } 
              });
            }
          }
          break;
        }
        case 'WEREAD_CHAPTER_DATA': {
          setChapterContent(payload);
          setLoading(false);
          setView('reader');
          // 自动滚动到顶部
          const contentEl = document.querySelector('.reader-content');
          if (contentEl) contentEl.scrollTop = 0;
          break;
        }
        case 'WEREAD_ERROR':
          message.error(payload.message);
          setLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    
    // 初始化获取书架数据
    setLoading(true);
    vscode.postMessage({ command: 'WEREAD_GET_SHELF' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const openBook = (book: Book) => {
    setCurrentBook(book);
    setLoading(true);
    setCatalog([]);
    setCurrentChapterIdx(0);
    
    // 1. 先获取目录
    vscode.postMessage({ 
      command: 'WEREAD_GET_CATALOG', 
      payload: { bookId: book.bookId } 
    });
    
    // 注意：不再这里直接获取第 1 章，因为第 1 章的 UID 不一定是 1。
    // 逻辑移至 WEREAD_CATALOG_DATA 返回后执行。
  };

  const loadChapter = (idx: number) => {
    if (!currentBook || !catalog[idx]) return;
    setLoading(true);
    setCurrentChapterIdx(idx);
    vscode.postMessage({ 
      command: 'WEREAD_GET_CHAPTER', 
      payload: { bookId: currentBook.bookId, chapterUid: catalog[idx].chapterUid } 
    });
  };

  const backToShelf = () => {
    setView('shelf');
    setChapterContent(null);
  };

  const handleRefresh = () => {
    setLoading(true);
    vscode.postMessage({ command: 'WEREAD_GET_SHELF' });
  };

  // 清洗 HTML 的逻辑
  const cleanedHtml = useMemo(() => {
    if (!chapterContent?.html) return '';
    let html = chapterContent.html;

    // 1. 如果被转义了，进行反转义
    if (html.includes('&lt;')) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      html = doc.documentElement.textContent || html;
    }

    // 2. 移除 XML 声明和 doctype
    html = html.replace(/<\?xml.*\?>/gi, '');
    html = html.replace(/<!DOCTYPE.*?>/gi, '');

    // 3. 提取 body 内容
    const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
    if (bodyMatch && bodyMatch[1]) {
      html = bodyMatch[1];
    }

    // 4. 移除 head, html, title 等残留标签
    html = html.replace(/<html[^>]*>|<\/html>/gi, '');
    html = html.replace(/<head[^>]*>[\s\S]*<\/head>/gi, '');
    html = html.replace(/<title[^>]*>[\s\S]*<\/title>/gi, '');

    return html;
  }, [chapterContent]);

  return (
    <div className={`weread-app ${view}`}>
      {view === 'shelf' ? (
        <>
          <div className="header">
            <h1>书架</h1>
          </div>
          
          <div className="shelf-content">
            {loading ? (
              <div className="loading-container"><Spin size="large" /></div>
            ) : books.length > 0 ? (
              <div className="shelf-grid">
                {books.map((book: Book) => (
                  <div key={book.bookId} className="book-item" onClick={() => openBook(book)}>
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
              <div className="loading-container"><Spin /></div>
            ) : (
              <>
                <style dangerouslySetInnerHTML={{ __html: chapterContent?.style || '' }} />
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

      <FloatButton.Group
        shape="circle"
        style={{ right: 24, bottom: 24 }}
      >
        <FloatButton
          icon={<MinusOutlined style={{ color: '#52c41a' }} />}
          tooltip={<div>减小字体</div>}
          onClick={decrease}
        />
        <FloatButton
          icon={<PlusOutlined style={{ color: '#ff4d4f' }} />}
          tooltip={<div>增大字体</div>}
          onClick={increase}
        />
        {view === 'reader' && (
          <FloatButton.BackTop
            target={() => document.querySelector('.reader-content') as HTMLElement}
            visibilityHeight={400}
            icon={<VerticalAlignTopOutlined style={{ color: '#00a1d6' }} />}
            tooltip={<div>回到顶部</div>}
          />
        )}
        <FloatButton
          icon={<ReloadOutlined style={{ color: '#1890ff' }} />}
          tooltip={<div>{view === 'shelf' ? '刷新书架' : '刷新本章'}</div>}
          onClick={handleRefresh}
        />
      </FloatButton.Group>
    </div>
  );
};

export default App;
