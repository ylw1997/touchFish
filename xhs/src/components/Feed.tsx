/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 08:49:35
 * @LastEditTime: 2025-11-03 14:54:56
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\Feed.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { useEffect, useRef, useState, useCallback } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Masonry from "react-masonry-css";
import { FloatButton } from "antd";
import { RedoOutlined, VerticalAlignTopOutlined, SearchOutlined } from "@ant-design/icons";
import useXhsFeed from "../hooks/useXhsFeed";
import { loaderFunc } from "../utils/loader";
import XhsFeedCard from "./XhsFeedCard";
import { vscode } from "../utils/vscode";
import { debounce } from "../utils/utils";
import { MASONRY_BREAKPOINTS, INFINITE_SCROLL_CONFIG, DEBOUNCE_DELAY } from "../constants";
import FeedDetailDrawer from "./FeedDetailDrawer";
import XhsSearchDrawer from "./XhsSearchDrawer";
import UserPostedDrawer from "./UserPostedDrawer";

export default function Feed() {
  const { items, loadMore, hasMore, refresh } = useXhsFeed();
  // 详情状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string >("");
  const [activeXsecToken, setActiveXsecToken] = useState<string>("");
  // 搜索弹窗状态
  const [searchOpen, setSearchOpen] = useState(false);
  // 用户主页弹窗状态
  const [userOpen, setUserOpen] = useState(false);
  const [userParams, setUserParams] = useState<{ cursor: string; user_id: string; xsec_token: string; user?: any;xsec_source?:any }>({ cursor: '', user_id: '', xsec_token: '' });
  // 目前 Drawer 内部自行通过 useRequest 获取接口，此处仅维持滚动保存逻辑
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (items.length === 0) loadMore(true);
    const scrollableNode = scrollRef.current;
    if (!scrollableNode) return;

    const handleScroll = debounce(() => {
      vscode.postMessage({
        command: "XHS_SAVE_SCROLL_POSITION",
        payload: scrollableNode.scrollTop,
      });
    }, DEBOUNCE_DELAY.SCROLL);

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const handleOpenDetail = useCallback((raw: any) => {
    if (!raw?.id) return;
    setDetailOpen(true);
    setActiveNoteId(raw.id);
    setActiveXsecToken(raw.xsec_token);
  }, []);

  const handleOpenUser = useCallback((raw: any, user: any) => {
    if (!user?.user_id) return;
    // 以当前笔记 id 作为初始 cursor，有些接口可能不认可；如果需要可置空 ''
    setUserParams({ cursor: raw.id, user_id: user.user_id, xsec_token: raw.xsec_token, user });
    setUserOpen(true);
  }, []);

  return (
    <div
      id="xhsScrollableDiv"
      ref={scrollRef}
      style={{ height: "100vh", overflow: "auto" }}
    >
      <FeedDetailDrawer
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setActiveNoteId("");
          setActiveXsecToken("");
        }}
        // 仅传递基础标识，Drawer 内部自行请求
        detail={{ note_id: activeNoteId, xsec_token: activeXsecToken }}
      />
      <XhsSearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
      {/* 使用 Antd 浮动按钮组（参考 weibo） */}
      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
        <FloatButton.BackTop
          visibilityHeight={INFINITE_SCROLL_CONFIG.BACK_TOP_VISIBILITY_HEIGHT}
          duration={INFINITE_SCROLL_CONFIG.BACK_TOP_DURATION}
          icon={<VerticalAlignTopOutlined style={{ color: "#f37fb7" }} />}
          tooltip={{ title: "回到顶部", placement: "left" }}
          target={() => scrollRef.current || window}
        />
        <FloatButton
          onClick={refresh}
          icon={<RedoOutlined style={{ color: "#b37feb" }} />}
          tooltip={{ title: "刷新", placement: "left" }}
        />
        <FloatButton
          onClick={() => setSearchOpen(true)}
          icon={<SearchOutlined style={{ color: "#faad14" }} />}
          tooltip={{ title: "搜索", placement: "left" }}
        />
      </FloatButton.Group>
      {items.length === 0 ? (
        loaderFunc()
      ) : (
        <InfiniteScroll
          dataLength={items.length}
          next={() => loadMore()}
          hasMore={hasMore}
          loader={loaderFunc()}
          endMessage={
            <div style={{ padding: 8, textAlign: "center", color: "#999" }}>
              没有更多了
            </div>
          }
          scrollableTarget="xhsScrollableDiv"
          scrollThreshold={INFINITE_SCROLL_CONFIG.THRESHOLD}
        >
          <Masonry
            breakpointCols={MASONRY_BREAKPOINTS}
            className="xhs-masonry"
            columnClassName="xhs-masonry-column"
          >
            {items.map((raw: any, index: number) => (
              <div 
                key={raw.id} 
                className="xhs-waterfall-item"
                style={{ animationDelay: `${(index % 10) * 50}ms` }}
              >
                <XhsFeedCard data={raw} onClick={handleOpenDetail} onUserClick={handleOpenUser} />
              </div>
            ))}
          </Masonry>
        </InfiniteScroll>
      )}
        <UserPostedDrawer
          open={userOpen}
          onClose={() => setUserOpen(false)}
          initParams={userParams}
          onOpenDetail={(raw) => {
            handleOpenDetail(raw);
          }}
        />
    </div>
  );
}
