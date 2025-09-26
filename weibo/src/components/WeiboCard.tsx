import { DownOutlined, LoadingOutlined, UpOutlined } from "@ant-design/icons";
import { Card, Tag } from "antd";
import { weiboItem, weiboUser } from "../../../type";
import { renderComments } from "./Comment";
import { loaderFunc } from "../utils/loader";
import WeiboCardActions from "./WeiboCardActions";
import WeiboCardHeader from "./WeiboCardHeader";
import CommentForm from "./CommentForm";
import WeiboCardMedia from "./WeiboCardMedia";
import { useRequest } from "../hooks/useRequest";
import { WeiboApi } from "../api";
import React, { useMemo, useState } from "react";
import { parseH5WeiboText, parseWeiboText } from "../utils/textParser";

export interface weiboBaseActions {
  className?: string;
  getUserByName: (username: string) => void;
  is_child?: boolean;
  onUserClick: (userInfo: weiboUser) => void;
  onFollow?: (userInfo?: weiboUser) => void;
  cancelFollow?: (userInfo?: weiboUser) => void;
  onExpandLongWeibo?: (id: string | number) => void;
  onToggleComments?: (id: number, uid: number, is_retweeted: boolean) => void;
  showActions?: boolean;
  onCopyLink?: (url: string) => void;
  onCommentOrRepost?: (
    content: string,
    item: weiboItem,
    type: "comment" | "repost"
  ) => void;
  onLikeOrCancelLike?: (item: weiboItem, type: "like" | "cancel") => void;
  showImg?: boolean;
  onDownloadVideo?: (url: string) => void;
  onTopicClick: (topic: string) => void;
}

export interface WeiboCardProps extends weiboBaseActions {
  item: weiboItem;
  isH5?: boolean;
}

const WeiboCard: React.FC<WeiboCardProps> = ({
  item,
  is_child = false,
  onUserClick,
  onFollow,
  cancelFollow,
  onExpandLongWeibo,
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
  const apiClient = useMemo(() => new WeiboApi(request), [request]);

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
        <WeiboCardHeader
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
          ? parseWeiboText(
              { ...item, text: longText, text_raw: longText },
              getUserByName,
              onTopicClick
            )
          : isH5
          ? item.text_raw
            ? parseWeiboText(item, getUserByName, onTopicClick)
            : parseH5WeiboText(item.text, getUserByName, onTopicClick)
          : parseWeiboText(item, getUserByName, onTopicClick)}
        {item.isLongText && (
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
      <WeiboCardMedia item={item} isH5={isH5} showImg={showImg} />

      <WeiboCardActions
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
            <div style={{ margin: "8px" }}>{loaderFunc(2)}</div>
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
        <WeiboCard
          className="retweeted-status"
          item={item.retweeted_status}
          is_child={true}
          onUserClick={onUserClick}
          onFollow={onFollow}
          cancelFollow={cancelFollow}
          showActions={showActions}
          onExpandLongWeibo={onExpandLongWeibo}
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

export default React.memo(WeiboCard);
