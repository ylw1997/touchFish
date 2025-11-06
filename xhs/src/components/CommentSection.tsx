/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-06
 * @Description: 评论区域组件
 */
import React from "react";
import { Card, List } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { loaderFunc } from "../utils/loader";
import CommonItem from "./CommonItem";
import { INFINITE_SCROLL_CONFIG } from "../constants";

interface CommentSectionProps {
  /** 评论列表 */
  comments: any[];
  /** 是否正在加载 */
  loading: boolean;
  /** 是否还有更多 */
  hasMore: boolean;
  /** 错误信息 */
  error: string | null;
  /** 滚动容器ID */
  scrollableTarget: string;
  /** 加载更多回调 */
  onLoadMore: () => void;
  /** 用户点击回调 */
  onUserClick: (comment: any) => void;
}

/**
 * 评论区域组件
 * 负责展示评论列表和无限滚动加载
 */
export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  loading,
  hasMore,
  error,
  scrollableTarget,
  onLoadMore,
  onUserClick,
}) => {
  return (
    <Card
      size="small"
      title="评论"
      style={{ marginTop: 12, marginBottom: 16 }}
      styles={{
        body: {
          padding: "0",
        },
      }}
    >
      {loading && !comments.length && loaderFunc(2)}
      {error && (
        <div style={{ color: "#ff4d4f", padding: "8px 0" }}>
          {error}
        </div>
      )}
      {!loading && !comments.length && !error && (
        <div style={{ color: "#999", padding: "8px" }}>暂无评论</div>
      )}
      {!!comments.length && (
        <InfiniteScroll
          dataLength={comments.length}
          next={onLoadMore}
          hasMore={hasMore}
          loader={loading ? loaderFunc() : null}
          endMessage={
            <div style={{ padding: 8, textAlign: "center", color: "#999" }}>
              没有更多评论了
            </div>
          }
          scrollableTarget={scrollableTarget}
          scrollThreshold={INFINITE_SCROLL_CONFIG.THRESHOLD}
        >
          <List
            size="small"
            dataSource={comments}
            renderItem={(comment) => (
              <CommonItem
                c={comment}
                onUserClick={() => onUserClick(comment)}
              />
            )}
          />
        </InfiniteScroll>
      )}
    </Card>
  );
};

export default CommentSection;
