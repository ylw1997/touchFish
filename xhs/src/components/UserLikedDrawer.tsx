import React, { useState, useEffect, useCallback, useRef } from "react";
import { Empty, Spin } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import Masonry from "react-masonry-css";
import XhsFeedCard from "./XhsFeedCard";
import FeedDetailDrawer from "./FeedDetailDrawer";
import BaseDrawer from "./BaseDrawer";
import { useRequest } from "../hooks/useRequest";
import { createXhsApi } from "../api";
import { INFINITE_SCROLL_CONFIG } from "../constants";
import { loaderFunc } from "../utils/loader";
import type { XhsFeedRawItem } from "../../../types/xhs";

interface UserLikedDrawerProps {
  userId: string | undefined;
  visible: boolean;
  onClose: () => void;
}

export const UserLikedDrawer: React.FC<UserLikedDrawerProps> = ({
  userId,
  visible,
  onClose,
}) => {
  const [items, setItems] = useState<XhsFeedRawItem[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [cursor, setCursor] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { request, messageApi } = useRequest();
  const apiRef = useRef(createXhsApi(request));
  const cursorRef = useRef(cursor);

  // 详情弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);

  useEffect(() => {
    if (visible && userId) {
      setItems([]);
      setCursor("");
      cursorRef.current = "";
      setHasMore(true);
      fetchLikedNotes(true, "");
    }
  }, [visible, userId]);

  const fetchLikedNotes = useCallback(
    async (reset: boolean = false, nextCursor?: string) => {
      if (!userId) return;
      const useCursor = reset
        ? nextCursor ?? ""
        : nextCursor ?? cursorRef.current;
      setLoading(true);
      try {
        const res: any = await apiRef.current.getLikedNotes({
          user_id: userId,
          cursor: useCursor,
          num: 30,
        });
        const incoming: XhsFeedRawItem[] = res?.items || [];
        setItems((prev) => (reset ? incoming : [...prev, ...incoming]));
        const newCursor = res?.cursor || "";
        setCursor(newCursor);
        cursorRef.current = newCursor;
        setHasMore(!!res?.has_more);
      } catch (e: any) {
        messageApi.error(e.message || "获取点赞列表失败");
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    fetchLikedNotes(false, cursorRef.current);
  }, [fetchLikedNotes, hasMore, loading]);

  const handleLikeToggle = useCallback(
    async (raw: any, targetStatus: boolean) => {
      if (!raw?.id) return false;
      try {
        const payload = { note_oid: raw.id };
        if (targetStatus) {
          await request("XHS_NOTE_LIKE", payload);
        } else {
          await request("XHS_NOTE_DISLIKE", payload);
        }
        return true;
      } catch (e: any) {
        messageApi.error(e.message || "点赞操作失败");
        return false;
      }
    },
    [request, messageApi],
  );

  return (
    <>
      <BaseDrawer
        open={visible}
        onClose={onClose}
        title="历史赞过"
        scrollableId="xhsLikedScrollableDiv"
      >
        {loading && items.length === 0 ? (
          <div style={{ padding: "20px 0" }}>{loaderFunc()}</div>
        ) : items.length > 0 ? (
          <InfiniteScroll
            dataLength={items.length}
            next={loadMore}
            hasMore={hasMore && !loading}
            loader={loaderFunc()}
            endMessage={
              <div style={{ padding: 8, textAlign: "center", color: "#999" }}>
                没有更多了
              </div>
            }
            scrollableTarget="xhsLikedScrollableDiv"
            scrollThreshold={INFINITE_SCROLL_CONFIG.THRESHOLD}
          >
            <Masonry
              breakpointCols={{
                default: 2,
                1500: 5,
                1200: 4,
                900: 3,
                600: 2,
                300: 1,
              }}
              className="xhs-masonry"
              columnClassName="xhs-masonry-column"
            >
              {items.map((raw: any, index: number) => (
                <div
                  key={raw.id + index}
                  className="xhs-waterfall-item"
                  style={{ animationDelay: `${(index % 10) * 50}ms` }}
                >
                  <XhsFeedCard
                    data={raw}
                    onClick={(data) => {
                      setSelectedNote(data);
                      setDetailOpen(true);
                    }}
                    onLikeToggle={handleLikeToggle}
                  />
                </div>
              ))}
            </Masonry>
          </InfiniteScroll>
        ) : (
          <Empty
            description="暂无点赞记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </BaseDrawer>
      {selectedNote && (
        <FeedDetailDrawer
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          detail={{
            note_id: selectedNote.id || selectedNote.note_id,
            xsec_token: selectedNote.xsec_token,
          }}
        />
      )}
    </>
  );
};

export default UserLikedDrawer;
