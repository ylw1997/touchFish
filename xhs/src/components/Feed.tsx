/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 08:49:35
 * @LastEditTime: 2025-10-23 15:06:00
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\Feed.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { useEffect, useRef, useState, useCallback } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import useXhsFeed from "../hooks/useXhsFeed";
import { createXhsApi } from '../api';
import { useRequest } from '../hooks/useRequest';
import XhsFeedCard from "./XhsFeedCard";
import { vscode } from "../utils/vscode";
import FeedDetailDrawer from './FeedDetailDrawer';

// 统一使用封装的 vscode.postMessage，浏览器环境自动降级为 console.log

// 简单防抖
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let timer: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export default function Feed() {
  const { items, loadMore, hasMore } = useXhsFeed();
  // 详情状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { request } = useRequest();
  const apiRef = useRef(createXhsApi(request));
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 初次加载
  useEffect(() => {
    if (items.length === 0) loadMore(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const scrollableNode = scrollRef.current;
    if (!scrollableNode) return;

    const handleScroll = debounce(() => {
      vscode.postMessage({
        command: "XHS_SAVE_SCROLL_POSITION",
        payload: scrollableNode.scrollTop,
      });
    }, 500);

    const messageHandler = (ev: MessageEvent<any>) => {
      if (ev.type !== "message" || !ev.data?.command) return;
      if (ev.data.command === "XHS_RESTORE_SCROLL_POSITION") {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = ev.data.payload;
        }
      }
    };

    scrollableNode.addEventListener("scroll", handleScroll);
    window.addEventListener("message", messageHandler);

    return () => {
      scrollableNode.removeEventListener("scroll", handleScroll);
      window.removeEventListener("message", messageHandler);
    };
  }, []);

  // 恢复滚动位置消息监听
  useEffect(() => {
    function messageHandler(ev: MessageEvent<any>) {
      if (!ev.data?.command) return;
      if (ev.data.command === "XHS_RESTORE_SCROLL_POSITION") {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = ev.data.payload || 0;
        }
      }
    }
    window.addEventListener("message", messageHandler);
    // 主动请求一次恢复，避免 Provider 发送早于监听注册
    console.log("[xhs] requesting restore");
    vscode.postMessage({ command: "XHS_REQUEST_RESTORE_SCROLL" });
    return () => window.removeEventListener("message", messageHandler);
  }, []);

  const handleOpenDetail = useCallback(async (raw: any) => {
    // raw.id 为 source_note_id, raw.xsec_token
    if (!raw?.id) return;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await apiRef.current.getFeedDetail({
        source_note_id: raw.id,
        xsec_token: raw.xsec_token || raw.note_card?.user?.xsec_token || '',
      });
      setDetailData(data);
    } catch (e: any) {
      console.error('[xhs] get detail error', e);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  return (
    <div
      id="xhsScrollableDiv"
      ref={scrollRef}
      style={{ height: "100vh", overflow: "auto" }}
    >
      <FeedDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        detail={detailData}
        onClose={() => {
          setDetailOpen(false);
          setDetailData(null);
        }}
      />
      <InfiniteScroll
        dataLength={items.length}
        next={() => loadMore()}
        hasMore={hasMore}
        loader={
          <div style={{ padding: 8, textAlign: "center", color: "#999" }}>
            加载中...
          </div>
        }
        endMessage={
          <div style={{ padding: 8, textAlign: "center", color: "#999" }}>
            没有更多了
          </div>
        }
        scrollableTarget="xhsScrollableDiv"
        scrollThreshold={0.9}
      >
        <div className="xhs-waterfall">
          {items.map((raw: any) => (
            <div key={raw.id} className="xhs-waterfall-item">
              <XhsFeedCard data={raw} onClick={handleOpenDetail} />
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
}
