/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-06
 * @Description: 通用用户信息卡片组件，支持简单和详细两种模式
 */
import React from "react";
import { Avatar, Button, Card, Flex, Tag } from "antd";
import {
  UserAddOutlined,
  UserDeleteOutlined,
  UsergroupAddOutlined,
  TeamOutlined,
  LikeOutlined,
} from "@ant-design/icons";

export interface UserInfo {
  user_id?: string;
  nickname?: string;
  nick_name?: string;
  avatar?: string;
  image?: string;
}

export interface UserHoverData {
  basic_info?: {
    desc?: string;
  };
  interact_info?: {
    follows?: string | number;
    fans?: string | number;
    interaction?: string | number;
  };
  extraInfo_info?: {
    fstatus?: string;
  };
}

interface UserInfoCardProps {
  /** 基础用户信息 */
  user: UserInfo;
  /** 详细用户信息（hover card） */
  hoverData?: UserHoverData | null;
  /** 是否正在加载详细信息 */
  loading?: boolean;
  /** 加载错误信息 */
  error?: string | null;
  /** 显示模式：simple 只显示头像和昵称，detailed 显示完整信息 */
  mode?: "simple" | "detailed";
  /** 是否显示关注按钮 */
  showFollowButton?: boolean;
  /** 是否已关注 */
  isFollowing?: boolean;
  /** 关注按钮加载状态 */
  followLoading?: boolean;
  /** 关注/取消关注回调 */
  onFollowToggle?: () => void;
  /** 点击用户信息回调 */
  onUserClick?: () => void;
  /** 额外样式 */
  style?: React.CSSProperties;
  /** 卡片尺寸 */
  size?: "small" | "default";
}

/**
 * 通用用户信息卡片组件
 * - simple 模式：仅显示头像、昵称和关注按钮（用于详情页）
 * - detailed 模式：显示完整信息包括粉丝数等统计（用于用户主页）
 */
export const UserInfoCard: React.FC<UserInfoCardProps> = ({
  user,
  hoverData,
  loading = false,
  error = null,
  mode = "simple",
  showFollowButton = true,
  isFollowing = false,
  followLoading = false,
  onFollowToggle,
  onUserClick,
  style,
  size = "small",
}) => {
  const nickname = user.nickname || user.nick_name || "未知用户";
  const avatar = user.avatar || user.image;
  const hasUserId = !!user.user_id;

  const follows = hoverData?.interact_info?.follows || "0";
  const fans = hoverData?.interact_info?.fans || "0";
  const interaction = hoverData?.interact_info?.interaction || "0";
  const desc = hoverData?.basic_info?.desc || "";

  // Simple 模式：横向布局，适合笔记详情页
  if (mode === "simple") {
    return (
      <Card size={size} style={style}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={12}>
            <Avatar
              src={avatar}
              size={40}
              style={{ cursor: hasUserId ? "pointer" : "default" }}
              onClick={() => hasUserId && onUserClick?.()}
            >
              {nickname?.[0]}
            </Avatar>
            <span
              style={{
                fontWeight: 600,
                fontSize: 18,
                cursor: hasUserId ? "pointer" : "default",
              }}
              onClick={() => hasUserId && onUserClick?.()}
            >
              {nickname}
            </span>
          </Flex>
          {showFollowButton && hasUserId && (
            <Button
              color={isFollowing ? "default" : "primary"}
              variant="filled"
              icon={isFollowing ? <UserDeleteOutlined /> : <UserAddOutlined />}
              loading={followLoading}
              onClick={onFollowToggle}
            >
              {isFollowing ? "取消关注" : "关注"}
            </Button>
          )}
        </Flex>
      </Card>
    );
  }

  // Detailed 模式：纵向布局，适合用户主页
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        marginBottom: 12,
        ...style,
      }}
    >
      <Avatar
        src={avatar}
        size={80}
        style={{ cursor: hasUserId ? "pointer" : "default" }}
        onClick={() => hasUserId && onUserClick?.()}
      >
        {nickname[0]}
      </Avatar>
      <div
        style={{
          fontSize: 20,
          fontWeight: "bolder",
          cursor: hasUserId ? "pointer" : "default",
        }}
        onClick={() => hasUserId && onUserClick?.()}
      >
        {nickname}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {loading && <Tag color="default">加载用户信息...</Tag>}
        {error && <Tag color="red">{error}</Tag>}
        {!loading && !error && hoverData && (
          <>
            <Tag icon={<UsergroupAddOutlined />} color="green">
              关注: {follows}
            </Tag>
            <Tag icon={<TeamOutlined />} color="orange">
              粉丝: {fans}
            </Tag>
            <Tag icon={<LikeOutlined />} color="magenta">
              获赞收藏: {interaction}
            </Tag>
          </>
        )}
      </div>
      {!loading && !error && desc && (
        <Card
          size="small"
          styles={{ body: { padding: "10px", textAlign: "center" } }}
          style={{ margin: "0 8px" }}
        >
          {desc}
        </Card>
      )}
      {showFollowButton && !loading && !error && hasUserId && (
        <Button
          color={isFollowing ? "default" : "primary"}
          variant="filled"
          icon={isFollowing ? <UserDeleteOutlined /> : <UserAddOutlined />}
          loading={followLoading}
          onClick={onFollowToggle}
        >
          {followLoading
            ? "处理中..."
            : isFollowing
            ? "取消关注"
            : "关注"}
        </Button>
      )}
    </div>
  );
};

export default UserInfoCard;
