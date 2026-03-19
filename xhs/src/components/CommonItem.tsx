/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-31 14:01:36
 * @LastEditTime: 2025-11-20 15:26:09
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\CommonItem.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description: 评论项组件
 */
import React from "react";
import {
  HeartOutlined,
  MessageOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import { List, Avatar, Space, Tag, Image, Button } from "antd";
import { extractXhsImageUrl, formatTimestamp } from "../utils/utils";
import ImagePreviewToolbar from "./ImagePreviewToolbar";

interface CommentUser {
  user_id?: string;
  nickname?: string;
  image?: string;
  avatar?: string;
}

interface CommentPicture {
  info_list?: Array<{
    image_scene?: string;
    url?: string;
  }>;
  url_default?: string;
  url_pre?: string;
  url?: string;
}

interface Comment {
  id: string;
  user_info?: CommentUser;
  content?: string;
  create_time?: number;
  pictures?: CommentPicture[];
  show_tags?: string[];
  like_count?: string | number;
  sub_comment_count?: string | number;
  ip_location?: string;
  sub_comments?: Comment[]; // 子评论
  // 新增的可选运行时状态字段（后端不返回，前端注入）
  sub_comment_has_more?: boolean;
  sub_comment_cursor?: string;
  sub_loading?: boolean;
  sub_error?: string | null;
}

interface CommonItemProps {
  c: Comment;
  onUserClick?: (userInfo: CommentUser) => void;
  onExpandSubComments?: () => void;
  [key: string]: any;
}

const CommonItem: React.FC<CommonItemProps> = ({
  c,
  onUserClick,
  onExpandSubComments,
  ...arg
}) => {
  return (
    <List.Item key={c.id} {...arg}>
      <div style={{ display: "flex", width: "100%", gap: 8 }}>
        <Avatar
          src={c.user_info?.image}
          size={32}
          style={{ cursor: c.user_info?.user_id ? "pointer" : "default" }}
          onClick={() => {
            if (!c.user_info?.user_id) return;
            onUserClick?.(c.user_info);
          }}
        >
          {c.user_info?.nickname?.[0]}
        </Avatar>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontWeight: "bolder",
                cursor: c.user_info?.user_id ? "pointer" : "default",
              }}
              onClick={() => {
                if (!c.user_info?.user_id) return;
                onUserClick?.(c.user_info);
              }}
            >
              {c.user_info?.nickname}
            </span>
            <span
              style={{
                color: "#999",
                fontSize: "calc(var(--app-font-size) - 2px)",
              }}
            >
              {formatTimestamp(c.create_time)}
            </span>
          </div>

          <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
            {c.content}
          </div>
          {Array.isArray(c.pictures) && c.pictures.length > 0 && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Image.PreviewGroup
                preview={{
                  toolbarRender: (
                    _,
                    {
                      transform: { scale },
                      actions: {
                        onZoomOut,
                        onZoomIn,
                        onRotateLeft,
                        onRotateRight,
                      },
                      current,
                    }
                  ) => (
                    <ImagePreviewToolbar
                      imageUrl={extractXhsImageUrl(c.pictures![current])}
                      imageIndex={current}
                      fileNamePrefix={`comment_${c.id}`}
                      scale={scale}
                      onRotateLeft={onRotateLeft}
                      onRotateRight={onRotateRight}
                      onZoomIn={onZoomIn}
                      onZoomOut={onZoomOut}
                    />
                  ),
                }}
              >
                {c.pictures.map((pic, idx) => {
                  const url = extractXhsImageUrl(pic);
                  if (!url) return null;
                  return (
                    <Image
                      key={idx}
                      src={url}
                      alt={`${c.id}_${idx}`}
                      style={{
                        maxHeight: 240,
                        maxWidth: 240,
                        borderRadius: 6,
                        objectFit: "cover",
                      }}
                    />
                  );
                })}
              </Image.PreviewGroup>
            </div>
          )}

          <Space size={4} style={{ marginTop: 4 }} wrap>
            {c.show_tags?.includes("is_author") && (
              <Tag color="green">
                <UserOutlined /> 作者
              </Tag>
            )}
            {c.like_count && (
              <Tag color="pink">
                <HeartOutlined /> {c.like_count}
              </Tag>
            )}
            {c.sub_comment_count && Number(c.sub_comment_count) > 0 && (
              <Tag color="blue">
                <MessageOutlined /> {c.sub_comment_count}
              </Tag>
            )}
            {c.ip_location && (
              <Tag color="purple">
                <EnvironmentOutlined /> {c.ip_location}
              </Tag>
            )}
          </Space>
          {c.sub_comments && c.sub_comments.length > 0 && (
            <List
              dataSource={c.sub_comments}
              renderItem={(subComment) => (
                <CommonItem
                  c={subComment}
                  onUserClick={onUserClick}
                  style={{
                    padding: "5px 0",
                  }}
                />
              )}
              style={{ marginTop: 12 }}
            />
          )}
          {/* 展开子评论按钮放在子评论列表之后 */}
          {c.sub_comments && c.sub_comment_has_more && (
            <Button
              color="default"
              variant="filled"
              size="small"
              icon={<CommentOutlined />}
              loading={c.sub_loading}
              onClick={onExpandSubComments}
            >
              {c.sub_error
                ? c.sub_error
                : c.sub_loading
                ? "加载中..."
                : `展开 ${
                    Number(c.sub_comment_count) - c.sub_comments.length
                  } 条评论`}
            </Button>
          )}
        </div>
      </div>
    </List.Item>
  );
};

export default CommonItem;
