/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 10:20:51
 * @LastEditTime: 2025-11-05 11:05:00
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\XhsFeedCard.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description: 小红书笔记卡片组件
 */
// 【修复 1】：必须完整导入 useState
import React, { useState } from "react";
import { Avatar } from "antd";
import {
  HeartOutlined,
  HeartFilled, // 【修复 2】：必须导入 HeartFilled
  PlayCircleFilled,
  PictureOutlined,
} from "@ant-design/icons";
import "../style/xhsFeedCard.less";
import type { XhsFeedRawItem, XhsUser } from "../../../types/xhs";
import { useConfigStore } from "../store/config";

// 【修复 3】：必须在 Props 接口中声明 onLikeToggle
interface XhsFeedCardProps {
  data: XhsFeedRawItem;
  onClick?: (data: XhsFeedRawItem) => void;
  onUserClick?: (data: XhsFeedRawItem, user: XhsUser) => void;
  onLikeToggle?: (data: XhsFeedRawItem, targetStatus: boolean) => Promise<boolean>;
}

export const XhsFeedCard: React.FC<XhsFeedCardProps> = ({
  data,
  onClick,
  onUserClick,
  onLikeToggle, // 【修复 4】：必须从参数中解构出来，否则下方无法使用
}) => {
  const { showImg } = useConfigStore();
  const [forceShow, setForceShow] = React.useState(false);

  // 过滤非 note
  if ((data as any).model_type && (data as any).model_type !== "note") {
    return null;
  }
  const card: any = (data as any).note_card;
  if (!card) {
    return null;
  }

  // ===== 点赞局部状态管理 =====
  const [isLiked, setIsLiked] = useState<boolean>(!!card.interact_info?.liked);
  const [likeCountStr, setLikeCountStr] = useState<string>(card.interact_info?.liked_count || "0");
  const [likeLoading, setLikeLoading] = useState<boolean>(false);

  const user = card.user ?? {};
  const title: string = card.display_title || card.title || "未命名笔记";
  const userName: string = user.nick_name || user.nickname || "未知用户";
  const avatarUrl: string | undefined = user.avatar;
  const cover: string | undefined =
    card.cover?.url_default || card.cover?.url_pre;
  const isVideo =
    card.type === "video" || card.media_type === "video" || card.video_info;

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUserClick?.(data, user);
  };

  // ===== 独立点赞事件拦截与乐观UI更新 =====
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止冒泡，防止触发外层onClick跳转详情
    if (likeLoading || !onLikeToggle) return;

    const targetStatus = !isLiked;
    setLikeLoading(true);

    // 乐观UI先行更新
    setIsLiked(targetStatus);
    const countNum = parseInt(likeCountStr);
    if (!isNaN(countNum) && countNum.toString() === likeCountStr) {
      setLikeCountStr(targetStatus ? String(countNum + 1) : String(Math.max(0, countNum - 1)));
    }

    try {
      const success = await onLikeToggle(data, targetStatus);
      if (!success) throw new Error("点赞请求失败");
    } catch (error) {
      // 失败回滚UI
      setIsLiked(!targetStatus);
      setLikeCountStr(likeCountStr);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <div className="xhs-feed-card">
      {(showImg || forceShow) && cover ? (
        <div className="xhs-feed-card-cover" onClick={() => onClick?.(data)}>
          <img src={cover} alt={title} />
          {isVideo && <PlayCircleFilled className="xhs-feed-card-play" />}
        </div>
      ) : (
        !showImg &&
        cover && (
          <div
            className="xhs-feed-card-placeholder"
            onClick={() => setForceShow(true)}
          >
            <PictureOutlined />
            <span>点击显示图片</span>
          </div>
        )
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
         <div
            className="xhs-feed-card-like"
            onClick={handleLikeClick}
            style={{ cursor: "pointer", color: isLiked ? "#ff2442" : "inherit" }} // 适配小红书红
          >
            {isLiked ? <HeartFilled /> : <HeartOutlined />} {likeCountStr}
          </div>
        </div>
      </div>
    </div>
  );
};

export default XhsFeedCard;