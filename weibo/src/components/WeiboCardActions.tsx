
import { Flex } from "antd";
import {
  ExportOutlined,
  HeartFilled,
  HeartOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { weiboItem } from "../../../types/weibo";
import React from "react";

interface WeiboCardActionsProps {
  item: weiboItem;
  commentType?: "comment" | "repost";
  setCommentType: (type: "comment" | "repost" | undefined) => void;
  onToggleComments?: (id: number, uid: number, is_retweeted: boolean) => void;
  onLikeOrCancelLike?: (item: weiboItem, type: "like" | "cancel") => void;
  is_child: boolean;
}

const WeiboCardActions: React.FC<WeiboCardActionsProps> = ({
  item,
  commentType,
  setCommentType,
  onToggleComments,
  onLikeOrCancelLike,
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
      </Flex>
    </div>
  );
};

export default WeiboCardActions;
