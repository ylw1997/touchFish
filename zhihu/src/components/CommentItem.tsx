/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 14:55:56
 * @LastEditTime: 2025-08-08 17:13:30
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\components\CommentItem.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import { Avatar, Flex, List, Space, Tag, Typography } from "antd";
import React from "react";
import dayjs from "dayjs";
import type { ZhihuCommentItem } from "../../../type";
import { processCommentContent } from "../utils/textParser";
import { LikeOutlined } from "@ant-design/icons";

const { Text } = Typography;

const CommentItem: React.FC<{ comment: ZhihuCommentItem }> = ({ comment }) => {
  return (
    <List.Item style={{
      padding: '8px 0'
    }} >
      <Flex gap={10} style={{ width: '100%' }}>
        <Avatar src={comment.author.avatar_url} shape="square" />
        <div style={{ flex: 1 }}>
          <Text strong>{comment.author.name}</Text>
          <div
            dangerouslySetInnerHTML={{ __html: processCommentContent(comment.content) }}
            style={{ marginTop: '4px',lineHeight: '2' }}
          />
          <Flex style={{ marginTop: '8px' }} justify="space-between">
            <Space>
              {comment.comment_tag?.map((tag) => (
                <Tag color={tag.type === 'hot' ? 'pink' : 'blue'} key={tag.text}>
                  {tag.text}
                </Tag>
              ))}
              <Text type="secondary">
                {dayjs(comment.created_time * 1000).fromNow()}
              </Text>
            </Space>
             <Text type="secondary">
                <LikeOutlined /> {comment.like_count}
              </Text>
          </Flex>
          {comment.child_comments && comment.child_comments.length > 0 && (
            <div style={{ marginTop: '10px',borderTop:'1px solid #fdfdfd1f' }}>
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
