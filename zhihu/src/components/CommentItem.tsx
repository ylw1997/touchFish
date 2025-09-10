/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 14:55:56
 * @LastEditTime: 2025-09-10 10:13:21
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\components\CommentItem.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import { Flex, List, Space, Tag } from "antd";
import React from "react";
import dayjs from "dayjs";
import type { ZhihuCommentItem } from "../../../type";
import { processCommentContent } from "../utils/textParser";
import { LikeOutlined } from "@ant-design/icons";
import { Avatar } from "@heroui/react";

const CommentItem: React.FC<{ comment: ZhihuCommentItem }> = ({ comment }) => {
  return (
    <List.Item style={{
      padding: '8px 0'
    }} >
      <Flex gap={10} style={{ width: '100%' }}>
        <Avatar src={comment.author.avatar_url} size="sm" isBordered radius="sm" />
        <div style={{ flex: 1 }}>
          <span style={{fontWeight:'bold'}} >{comment.author.name}</span>
          <div style={{ lineHeight: '2' }} >
            {processCommentContent(comment.content)}
          </div>
          <Flex style={{ marginTop: '4px' }} justify="space-between">
            <Space>
              {comment.comment_tag?.map((tag) => (
                <Tag color={tag.type === 'hot' ? 'pink' : 'blue'} bordered={false} key={tag.text}>
                  {tag.text}
                </Tag>
              ))}
              <span>
                {dayjs(comment.created_time * 1000).fromNow()}
              </span>
            </Space>
             <span>
                <LikeOutlined /> {comment.like_count}
              </span>
          </Flex>
          {comment.child_comments && comment.child_comments.length > 0 && (
            <div style={{ marginTop: '10px',borderTop:'1px solid var(--vscode-editorWidget-border)' }}>
              <List
                dataSource={comment.child_comments}
                renderItem={(child) => <CommentItem comment={child} />}
              />
            </div>
          )}
        </div>
      </Flex>
    </List.Item>
  );
};

export default CommentItem;
