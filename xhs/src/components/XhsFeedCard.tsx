/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 10:20:51
 * @LastEditTime: 2025-10-24 14:14:21
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\XhsFeedCard.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Avatar, Card, Flex } from "antd";
import React from "react";
import { XhsFeedRawItem } from "../hooks/useXhsFeed";
import Meta from "antd/es/card/Meta";

interface XhsFeedCardProps {
  data: XhsFeedRawItem;
  onClick?: (data: XhsFeedRawItem) => void;
}

export const XhsFeedCard: React.FC<XhsFeedCardProps> = ({ data, onClick }) => {
  const card = data.note_card;
  const user = card.user;
  const title: string = card.display_title;
  const userName: string = user.nick_name;
  const avatar: string = user.avatar;
  const likedCount: string = card.interact_info?.liked_count;
  const cover: string = card.cover.url_default;
  return (
    <Card
      hoverable
      onClick={() => onClick?.(data)}
      styles={{
        body: {
          padding: 8,
        },
      }}
      cover={
        <img
          alt={title}
          src={cover}
          style={{
            objectFit: "cover",
            width: "100%",
            minHeight: 160,
            maxHeight: 320,
          }}
        />
      }
    >
      <Meta
        title={<div style={{ fontWeight: "bold", fontSize: 14 }}>{title}</div>}
        description={
          <Flex align="center" justify="space-between"
            style={{
              fontSize: 13,
            }}
          >
            <Flex align="center">
              <Avatar src={avatar} size={26} style={{ marginRight: 6 }} />
              <span>{userName}</span>
            </Flex>
            <span>{`👍 ${likedCount}`}</span>
          </Flex>
        }
      />
    </Card>
  );
};

export default XhsFeedCard;
