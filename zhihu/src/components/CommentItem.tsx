import { Avatar, Card, Space, Tag, Typography } from "antd";
import React from "react";
import dayjs from "dayjs";
import type { ZhihuCommentItem } from "../../../type";

const { Text } = Typography;

const CommentItem: React.FC<{ comment: ZhihuCommentItem }> = ({ comment }) => {
  return (
    <Card
      size="small"
      style={{ margin: "8px 0" }}
      styles={{
        body:{
          paddingTop: "8px", paddingBottom: "8px"
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <Avatar src={comment.author.avatar_url} size="small" />
        <Text strong style={{ marginLeft: "8px" }}>
          {comment.author.name}
        </Text>
        <Text type="secondary" style={{ marginLeft: "auto" }}>
          {dayjs(comment.created_time * 1000).fromNow()}
        </Text>
      </div>
      <div
        dangerouslySetInnerHTML={{ __html: comment.content }}
        style={{ marginTop: "8px", marginBottom: "8px" }}
      ></div>
      <Space>
        {comment.comment_tag?.map((tag) => (
          <Tag color={tag.type == "hot" ? "pink" : "blue"} key={tag.text}>
            {tag.text}
          </Tag>
        ))}
        <Text type="secondary">{comment.like_count} 赞</Text>
      </Space>

      {comment.child_comments && comment.child_comments.length > 0 && (
        <>
          {comment.child_comments.map((childComment) => (
            <CommentItem key={childComment.id} comment={childComment} />
          ))}
        </>
      )}
    </Card>
  );
};

export default CommentItem;
