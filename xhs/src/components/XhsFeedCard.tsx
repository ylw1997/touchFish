/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 10:20:51
 * @LastEditTime: 2025-10-31 16:38:04
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\XhsFeedCard.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import React from 'react';
import { Avatar } from 'antd';
import { HeartOutlined, PlayCircleFilled } from '@ant-design/icons';
import '../style/xhsFeedCard.less';
import { XhsFeedRawItem } from '../../../type';

interface XhsFeedCardProps {
  data: XhsFeedRawItem;
  onClick?: (data: XhsFeedRawItem) => void;
}

export const XhsFeedCard: React.FC<XhsFeedCardProps> = ({ data, onClick }) => {
  // 过滤非 note
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
  const avatarUrl: string | undefined = user.avatar;
  const likedCount: string = card.interact_info?.liked_count || '0';
  const cover: string | undefined = card.cover?.url_default || card.cover?.url_pre;
  const isVideo = card.type === 'video' || card.media_type === 'video' || card.video_info;

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[xhs user]', user);
    onClick?.(data);
  };

  return (
    <div className="xhs-feed-card">
      {cover && (
        <div className="xhs-feed-card-cover" onClick={() => onClick?.(data)}>
          <img src={cover} alt={title} />
          {isVideo && (
            <PlayCircleFilled className="xhs-feed-card-play" />
          )}
        </div>
      )}
      <div className="xhs-feed-card-info">
        <div className="xhs-feed-card-desc" onClick={() => onClick?.(data)}>
          {title}
        </div>
        <div className="xhs-feed-card-meta">
          <div className="xhs-feed-card-user" onClick={handleUserClick}>
            <Avatar src={avatarUrl} size={20} />
            <span className="xhs-feed-card-username">{userName}</span>
          </div>
          <div className="xhs-feed-card-like">
            <HeartOutlined /> {likedCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default XhsFeedCard;
