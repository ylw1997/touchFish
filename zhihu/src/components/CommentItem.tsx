/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 14:55:56
 * @LastEditTime: 2025-08-08 15:29:08
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\components\CommentItem.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import { Avatar, Card, Space, Tag, Typography } from "antd";
import React from "react";
import dayjs from "dayjs";
import type { ZhihuCommentItem } from "../../../type";
import { processCommentContent } from "../utils/textParser";
import { LikeOutlined } from "@ant-design/icons";

const { Text } = Typography;

const CommentItem: React.FC<{ comment: ZhihuCommentItem }> = ({ comment }) => {
  return (
    <Card
      size="small"
      styles={{
        body: {
          paddingTop: "8px",
          paddingBottom: "8px",
        },
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <Avatar src={comment.author.avatar_url} size="small" />
        <Text strong style={{ marginLeft: "8px" }}>
          {comment.author.name}
        </Text>
        <Text type="secondary" style={{ marginLeft: "auto" }}>
         <LikeOutlined /> {comment.like_count}
        </Text>
      </div>
      <div
        dangerouslySetInnerHTML={{ __html: processCommentContent(comment.content) }}
        style={{ margin: "8px 0",lineHeight: "2" }}
      ></div>
      <Space>
        {comment.comment_tag?.map((tag) => (
          <Tag color={tag.type == "hot" ? "pink" : "blue"} key={tag.text}>
            {tag.text}
          </Tag>
        ))}
        <Text type="secondary">
          {dayjs(comment.created_time * 1000).fromNow()}
        </Text>
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
