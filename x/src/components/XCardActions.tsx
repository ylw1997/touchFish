
import { Flex } from "antd";
import {
  ExportOutlined,
  HeartFilled,
  HeartOutlined,
  MessageOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { xItem } from "../../../types/x";
import React from "react";

interface XCardActionsProps {
  item: xItem;
  commentType?: "comment" | "repost";
  setCommentType: (type: "comment" | "repost" | undefined) => void;
  onToggleComments?: (id: number | string, uid: number | string, is_retweeted: boolean) => void;
  onLikeOrCancelLike?: (item: xItem, type: "like" | "cancel") => void;
  onCopyLink?: (url: string) => void;
  is_child: boolean;
}

const XCardActions: React.FC<XCardActionsProps> = ({
  item,
  commentType,
  setCommentType,
  onToggleComments,
  onLikeOrCancelLike,
  onCopyLink,
  is_child,
}) => {
  return (
    <div className="border-top-divider action-bar">
      <Flex justify="space-around" align="center">
        <span
          className="link"
          style={{
            color:
              commentType === "repost"
                ? "var(--vscode-textLink-foreground)"
                : "",
          }}
          onClick={() =>
            commentType != "repost"
              ? setCommentType("repost")
              : setCommentType(undefined)
          }
        >
          <ExportOutlined /> {item.reposts_count}
        </span>
        <span
          className="link"
          style={{
            color:
              commentType === "comment"
                ? "var(--vscode-textLink-foreground)"
                : "",
          }}
          onClick={() => {
            commentType != "comment"
              ? item.comments
                ? setCommentType(undefined)
                : setCommentType("comment")
              : setCommentType(undefined);
            if (item.user?.id !== undefined) {
              onToggleComments?.(item.id, item.user.id, is_child);
            }
          }}
        >
          <MessageOutlined /> {item.comments_count}
        </span>
        {item.attitudes_status == 1 ? (
          <span
            className="link"
            onClick={() => onLikeOrCancelLike?.(item, "cancel")}
          >
            <HeartFilled style={{ color: "red" }} /> {item.attitudes_count}
          </span>
        ) : (
          <span
            className="link"
            onClick={() => onLikeOrCancelLike?.(item, "like")}
          >
            <HeartOutlined /> {item.attitudes_count}
          </span>
        )}
        <span
          className="link"
          onClick={() => {
            onCopyLink?.(
              `https://x.com/${item.user?.screen_name_raw || item.user?.screen_name}/status/${item.mblogid}`,
            );
          }}
        >
          <ShareAltOutlined />
        </span>
      </Flex>
    </div>
  );
};

export default XCardActions;
