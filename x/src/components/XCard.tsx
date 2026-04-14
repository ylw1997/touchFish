import { DownOutlined, LoadingOutlined, UpOutlined } from "@ant-design/icons";
import { Card, Tag } from "antd";
import { xItem, xUser } from "../../../types/x";
import { renderComments } from "./Comment";
import { loaderFunc } from "../utils/loader";
import XCardActions from "./XCardActions";
import XCardHeader from "./XCardHeader";
import CommentForm from "./CommentForm";
import XCardMedia from "./XCardMedia";
import { useRequest } from "../hooks/useRequest";
import { XApi } from "../api";
import React, { useMemo, useState } from "react";
import { parseH5XText, parseXText } from "../utils/textParser";

export interface xBaseActions {
  className?: string;
  getUserByName: (username: string) => void;
  is_child?: boolean;
  onUserClick: (userInfo: xUser) => void;
  onFollow?: (userInfo?: xUser) => void;
  cancelFollow?: (userInfo?: xUser) => void;
  onExpandLongX?: (id: string | number) => void;
  onToggleComments?: (id: number, uid: number, is_retweeted: boolean) => void;
  showActions?: boolean;
  onCopyLink?: (url: string) => void;
  onCommentOrRepost?: (
    content: string,
    item: xItem,
    type: "comment" | "repost"
  ) => void;
  onLikeOrCancelLike?: (item: xItem, type: "like" | "cancel") => void;
  showImg?: boolean;
  onDownloadVideo?: (url: string) => void;
  onTopicClick: (topic: string) => void;
}

export interface XCardProps extends xBaseActions {
  item: xItem;
  isH5?: boolean;
}

const XCard: React.FC<XCardProps> = ({
  item,
  is_child = false,
  onUserClick,
  onFollow,
  cancelFollow,
  onExpandLongX,
  onToggleComments,
  showActions,
  className,
  onCopyLink,
  onCommentOrRepost,
  onLikeOrCancelLike,
  showImg,
  getUserByName,
  onTopicClick,
  isH5 = false, // 是否是H5端
}) => {
  const [commentType, setCommentType] = useState<"comment" | "repost">();

  const [isExpanded, setIsExpanded] = useState(false);
  const [longText, setLongText] = useState("");
  const [isLoadingLongText, setIsLoadingLongText] = useState(false);
  const { request } = useRequest();
  const apiClient = useMemo(() => new XApi(request), [request]);

  const handleToggleLongText = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    if (longText) {
      setIsExpanded(true);
      return;
    }

    setIsLoadingLongText(true);
    try {
      const result = await apiClient.getLongText(
        isH5 ? item.bid : item.mblogid
      );
      setLongText(result.data.longTextContent);
      setIsExpanded(true);
    } catch (error) {
      console.error("Failed to fetch long text", error);
    } finally {
      setIsLoadingLongText(false);
    }
  };

  return (
    <Card
      key={item.id}
      title={
        <XCardHeader
          item={item}
          onUserClick={onUserClick}
          showActions={showActions}
          onFollow={onFollow}
          cancelFollow={cancelFollow}
          onCopyLink={onCopyLink}
        />
      }
      className={className}
    >
      <div className="content">
        {isExpanded
          ? parseXText(
              { ...item, text: longText, text_raw: longText },
              getUserByName,
              onTopicClick
            )
          : isH5
          ? item.text_raw
            ? parseXText(item, getUserByName, onTopicClick)
            : parseH5XText(item.text, getUserByName, onTopicClick)
          : parseXText(item, getUserByName, onTopicClick)}
        {item.isLongText &&
          ((item.text_raw && item.text_raw.length > 140) ||
            (isH5 && !item.text_raw && item.text && item.text.length > 140)) && (
          <Tag
            color="blue"
            style={{ marginLeft: "8px", cursor: "pointer" }}
            className="link-tag"
            onClick={handleToggleLongText}
            bordered={false}
            icon={
              isLoadingLongText ? (
                <LoadingOutlined />
              ) : isExpanded ? (
                <UpOutlined />
              ) : (
                <DownOutlined />
              )
            }
          >
            {isLoadingLongText ? "加载中..." : isExpanded ? "收起" : "展开全文"}
          </Tag>
        )}
      </div>
      <XCardMedia item={item} isH5={isH5} showImg={showImg} />

      <XCardActions
        item={item}
        commentType={commentType}
        setCommentType={setCommentType}
        onToggleComments={onToggleComments}
        onLikeOrCancelLike={onLikeOrCancelLike}
        is_child={is_child}
      />
      {commentType && (
        <CommentForm
          item={item}
          commentType={commentType}
          onCommentOrRepost={onCommentOrRepost}
        />
      )}
      {item.comments && (
        <>
          {item.comments === "loading" ? (
            <div style={{ margin: "5px" }}>{loaderFunc(2)}</div>
          ) : (
            renderComments(
              item.comments,
              false,
              getUserByName,
              onUserClick,
              onTopicClick
            )
          )}
        </>
      )}
      {item.retweeted_status && (
        <XCard
          className="retweeted-status"
          item={item.retweeted_status}
          is_child={true}
          onUserClick={onUserClick}
          onFollow={onFollow}
          cancelFollow={cancelFollow}
          showActions={showActions}
          onExpandLongX={onExpandLongX}
          onToggleComments={onToggleComments}
          onCopyLink={onCopyLink}
          onCommentOrRepost={onCommentOrRepost}
          onLikeOrCancelLike={onLikeOrCancelLike}
          showImg={showImg}
          getUserByName={getUserByName}
          onTopicClick={onTopicClick}
        />
      )}
    </Card>
  );
};

export default React.memo(XCard);
