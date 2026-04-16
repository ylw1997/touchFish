import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Card, Tag } from "antd";
import React, { useState } from "react";

import { xItem, xUser } from "../../../types/x";
import { renderComments } from "./Comment";
import CommentForm from "./CommentForm";
import XCardActions from "./XCardActions";
import XCardHeader from "./XCardHeader";
import XCardMedia from "./XCardMedia";
import { loaderFunc } from "../utils/loader";
import { parseH5XText, parseXText } from "../utils/textParser";
import { openNewWindow } from "../utils";

export interface xBaseActions {
  className?: string;
  getUserByName: (username: string) => void;
  is_child?: boolean;
  onUserClick: (userInfo: xUser) => void;
  onFollow?: (userInfo?: xUser) => void;
  cancelFollow?: (userInfo?: xUser) => void;
  onExpandLongX?: (id: string | number) => void;
  onToggleComments?: (
    id: number | string,
    uid: number | string,
    is_retweeted: boolean,
  ) => void;
  showActions?: boolean;
  onCopyLink?: (url: string) => void;
  onCommentOrRepost?: (
    content: string,
    item: xItem,
    type: "comment" | "repost",
  ) => void;
  onLikeOrCancelLike?: (item: xItem, type: "like" | "cancel") => void;
  showImg?: boolean;
  onDownloadVideo?: (url: string) => void;
  onTopicClick: (topic: string) => void;
  onTranslate?: (item: xItem) => void;
  onClearTranslation?: (item: xItem) => void;
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
  onTranslate,
  onClearTranslation,
  isH5 = false,
}) => {
  const [commentType, setCommentType] = useState<"comment" | "repost">();
  const [isExpanded, setIsExpanded] = useState(false);

  const longText = item.longTextContent || item.text_raw || item.text;
  const hasExpandableLongText =
    !!item.isLongText &&
    !!item.longTextContent &&
    item.longTextContent !== item.text_raw &&
    ((item.text_raw && item.text_raw.length > 140) ||
      (isH5 && !item.text_raw && item.text && item.text.length > 140));

  const handleToggleLongText = () => {
    setIsExpanded((prev) => !prev);
  };

  const isPureRetweet = !!item.is_retweet && !item.is_quote;

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
        />
      }
      className={className}
    >
      {!isPureRetweet && (
        <div className="content">
          {isExpanded
            ? parseXText(
                { ...item, text: longText, text_raw: longText },
                getUserByName,
                onTopicClick,
              )
            : isH5
              ? item.text_raw
                ? parseXText(item, getUserByName, onTopicClick)
                : parseH5XText(item.text, getUserByName, onTopicClick)
              : parseXText(item, getUserByName, onTopicClick)}
          {hasExpandableLongText ? (
            <Tag
              color="blue"
              style={{ marginLeft: "8px", cursor: "pointer" }}
              className="link-tag"
              onClick={handleToggleLongText}
              bordered={false}
              icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
            >
              {isExpanded ? "收起" : "展开全文"}
            </Tag>
          ) : null}

          {/* 翻译按钮：非中文且未翻译时显示 */}
          {!item.translatedText &&
          !/[\u4e00-\u9fa5]/.test(item.text_raw || item.text || "") ? (
            <div style={{ marginTop: "4px" }}>
              {item.isTranslating ? (
                <span style={{ fontSize: "12px", opacity: 0.8 }}>
                  翻译中...
                </span>
              ) : (
                <span
                  className="link"
                  style={{ fontSize: "12px", opacity: 0.8 }}
                  onClick={() => onTranslate?.(item)}
                >
                  翻译
                </span>
              )}
            </div>
          ) : null}

          {item.translatedText ? (
            <div
              className="border-top-divider"
              style={{ marginTop: "8px", paddingTop: "8px" }}
            >
              <div
                style={{ fontSize: "12px", opacity: 0.6, marginBottom: "4px" }}
              >
                翻译结果
                <span
                  className="link"
                  style={{ marginLeft: "8px" }}
                  onClick={() => onClearTranslation?.(item)}
                >
                  还原
                </span>
              </div>
              <div style={{ color: "var(--vscode-editor-foreground)" }}>
                {item.translatedText}
              </div>
            </div>
          ) : null}

          {/* 文章预览 (X Article) */}
          {item.article && (
            <div
              className="article-preview"
              style={{
                marginTop: "12px",
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid var(--vscode-widget-border)",
                backgroundColor: "rgba(128, 128, 128, 0.08)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                overflow: "hidden",
              }}
              onClick={(e) => {
                e.stopPropagation();
                openNewWindow(`https://x.com/i/article/${item.article!.id}`);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(128, 128, 128, 0.15)";
                e.currentTarget.style.borderColor = "#1d9bf0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(128, 128, 128, 0.08)";
                e.currentTarget.style.borderColor =
                  "var(--vscode-widget-border)";
              }}
            >
              {item.article.cover_url && (
                <img
                  src={item.article.cover_url}
                  alt="article cover"
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    display: "block",
                    maxHeight: "400px",
                    objectFit: "contain",
                    backgroundColor: "rgba(0,0,0,0.05)",
                  }}
                />
              )}
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  marginBottom: "4px",
                  color: "var(--vscode-editor-foreground)",
                  lineHeight: 1.4,
                }}
              >
                {item.article.title}
              </div>
              <div
                style={{
                  fontSize: "12.5px",
                  opacity: 0.8,
                  marginBottom: "10px",
                  color: "var(--vscode-editor-foreground)",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.article.preview_text}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#1d9bf0",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: 500,
                }}
              >
                阅读全文
              </div>
            </div>
          )}
        </div>
      )}

      {!isPureRetweet && (
        <XCardMedia item={item} isH5={isH5} showImg={showImg} />
      )}

      <XCardActions
        item={item}
        commentType={commentType}
        setCommentType={setCommentType}
        onToggleComments={onToggleComments}
        onLikeOrCancelLike={onLikeOrCancelLike}
        onCopyLink={onCopyLink}
        is_child={is_child}
      />

      {commentType ? (
        <CommentForm
          item={item}
          commentType={commentType}
          onCommentOrRepost={onCommentOrRepost}
        />
      ) : null}

      {item.comments ? (
        <>
          {item.comments === "loading" ? (
            <div style={{ margin: "5px" }}>{loaderFunc(2)}</div>
          ) : (
            renderComments(
              item.comments,
              false,
              getUserByName,
              onUserClick,
              onTopicClick,
              onTranslate,
              onClearTranslation,
            )
          )}
        </>
      ) : null}

      {item.retweeted_status ? (
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
          onTranslate={onTranslate}
          onClearTranslation={onClearTranslation}
          isH5={isH5}
        />
      ) : null}
    </Card>
  );
};

export default React.memo(XCard);
