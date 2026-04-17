/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 14:55:56
 * @LastEditTime: 2025-09-29 17:56:54
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\components\CommentItem.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Avatar, Button, Flex, List, Space, Tag } from "antd";
import React, { useState } from "react";
import dayjs from "dayjs";
import type { ZhihuCommentItem } from "../../../types/zhihu";
import { useRequest } from "../hooks/useRequest";
import { processCommentContent } from "../utils/textParser";
import { CaretRightOutlined, LikeOutlined } from "@ant-design/icons";

const CommentItem: React.FC<{ comment: ZhihuCommentItem }> = ({ comment }) => {
  const [childComments, setChildComments] = useState<ZhihuCommentItem[]>(
    comment.child_comments || [],
  );
  const [paging, setPaging] = useState<
    { is_end: boolean; next?: string } | undefined
  >(comment.paging);
  const [loading, setLoading] = useState(false);
  const { request } = useRequest();
  const [childrenLoaded, setChildrenLoaded] = useState<boolean>(false);

  const loadChildComments = async (replace = true) => {
    if (!comment.id) return;
    setLoading(true);
    try {
      // 使用 extension-host 提供的后端接口请求子评论；payload 可以为 commentId 或 paging.next（nextUrl）
      const payload = !replace && paging?.next ? paging.next : comment.id;
      const res = await request<{ data: ZhihuCommentItem[]; paging?: any }>(
        "getZhihuChildComment",
        payload,
      );

      const newChildren: ZhihuCommentItem[] = res?.data || [];
      const newPaging = res?.paging;

      if (replace) {
        setChildComments(newChildren);
        // 标记已替换加载子评论
        setChildrenLoaded(true);
      } else {
        setChildComments((prev) => [...prev, ...newChildren]);
      }
      if (newPaging)
        setPaging({ is_end: !!newPaging.is_end, next: newPaging.next });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <List.Item
      style={{
        padding: "8px 0",
      }}
    >
      <Flex gap={10} style={{ width: "100%" }}>
        <Avatar
          shape="square"
          size={38}
          src={comment.author.avatar_url}
          style={{ borderRadius: 8, flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: "bold" }}>
            {comment.author.name}
            {comment.reply_to_author ? (
              <span style={{ marginLeft: 6 }}>
                <CaretRightOutlined /> {comment.reply_to_author.name}
              </span>
            ) : null}
          </span>
          <div className="comment-content">
            {processCommentContent(comment.content)}
          </div>
          <Flex style={{ marginTop: "4px" }} justify="space-between">
            <Space>
              {comment.comment_tag?.map((tag) => (
                <Tag
                  color={tag.type === "hot" ? "pink" : "blue"}
                  bordered={false}
                  key={tag.text}
                >
                  {tag.text}
                </Tag>
              ))}
              <span>{dayjs(comment.created_time * 1000).fromNow()}</span>
            </Space>
            <span>
              <LikeOutlined /> {comment.like_count}
            </span>
          </Flex>

          {childComments && childComments.length > 0 && (
            <div
              style={{
                marginTop: "10px",
                borderTop: "1px solid var(--vscode-editorWidget-border)",
                paddingTop: 8,
              }}
            >
              <List
                dataSource={childComments}
                renderItem={(child) => <CommentItem comment={child} />}
              />
            </div>
          )}

          {/* 如果服务端声明 can_more 且还未替换加载子评论，显示“查看其他”按钮（替换当前 child_comments） */}
          {comment.can_more &&
          (comment.child_comment_count ?? 0) > 2 &&
          !childrenLoaded ? (
            <div style={{ marginTop: 8 }}>
              <Button
                color="default"
                variant="filled"
                size="middle"
                onClick={() => loadChildComments(true)}
                loading={loading}
              >
                查看其他 {comment.child_comment_count} 条回复
              </Button>
            </div>
          ) : null}

          {/* 如果有分页且未结束，显示加载更多按钮，用于追加 */}
          {paging && !paging.is_end ? (
            <div style={{ marginTop: 8 }}>
              <Button
                color="default"
                variant="filled"
                size="middle"
                onClick={() => loadChildComments(false)}
                loading={loading}
              >
                加载更多
              </Button>
            </div>
          ) : null}
        </div>
      </Flex>
    </List.Item>
  );
};

export default CommentItem;
