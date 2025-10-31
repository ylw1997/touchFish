/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 10:20:51
 * @LastEditTime: 2025-10-31 15:31:54
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\XhsFeedCard.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Avatar, Card, Flex } from "antd";
import React from "react";
import { XhsFeedRawItem } from "../hooks/useXhsFeed";
import Meta from "antd/es/card/Meta";
import { HeartOutlined } from "@ant-design/icons";

interface XhsFeedCardProps {
  data: XhsFeedRawItem;
  onClick?: (data: XhsFeedRawItem) => void;
}

export const XhsFeedCard: React.FC<XhsFeedCardProps> = ({ data, onClick }) => {
  // 某些搜索结果可能包含 rec_query 或其它类型，需过滤
  if ((data as any).model_type && (data as any).model_type !== 'note') {
    return null;
  }
  const card: any = (data as any).note_card;
  if (!card) {
    return null;
  }
  const user = card.user ?? {};
  const title: string = card.display_title || card.title || '未命名笔记';
  const userName: string = user.nick_name || user.nickname || '未知用户';
  const avatar: string | undefined = user.avatar;
  const likedCount: string = card.interact_info?.liked_count || '0';
  const cover: string | undefined = card.cover?.url_default || card.cover?.url_pre;

  return (
    <Card
      hoverable
      onClick={() => onClick?.(data)}
      styles={{ body: { padding: 8 } }}
      cover={
        cover ? (
          <img
            alt={title}
            src={cover}
            style={{
              objectFit: 'cover',
              width: '100%',
              minHeight: 160,
              maxHeight: 320,
            }}
          />
        ) : undefined
      }
    >
      <Meta
        title={<div style={{ fontWeight: 'bold', fontSize: 14 }}>{title}</div>}
        description={
          <Flex align="center" justify="space-between" style={{ fontSize: 13 }}>
            <Flex align="center">
              <Avatar src={avatar} size={26} style={{ marginRight: 6 }} />
              <span>{userName}</span>
            </Flex>
            <span>
              <HeartOutlined /> {likedCount}
            </span>
          </Flex>
        }
      />
    </Card>
  );
};

export default XhsFeedCard;
