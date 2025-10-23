/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 08:49:35
 * @LastEditTime: 2025-10-23 10:47:03
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\Feed.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import useXhsFeed from "../hooks/useXhsFeed";
import XhsFeedCard from "./XhsFeedCard";

export default function Feed() {
  const { items, loadMore, hasMore } = useXhsFeed();

  // 初次加载
  useEffect(() => {
    if (items.length === 0) loadMore(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div id="xhsScrollableDiv" style={{ height: "100vh", overflow: "auto" }}>
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
        scrollThreshold={0.95}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignContent: "flex-start",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {items.map((raw: any) => (
            <XhsFeedCard key={raw.id} data={raw} />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
}
