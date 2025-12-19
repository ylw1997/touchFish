/*
 * @Author: YangLiwei
 * @Date: 2025-11-20
 * @Description: Display current user info
 */
import React from "react";
import BaseDrawer from "./BaseDrawer";
import UserInfoCard from "./UserInfoCard";

interface MyInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  userInfo: any;
}

const MyInfoDrawer: React.FC<MyInfoDrawerProps> = ({
  open,
  onClose,
  userInfo,
}) => {
  if (!userInfo) return null;

  const nickname = userInfo.nickname || "未知用户";
  const user = {
    nickname: nickname,
    avatar: userInfo.images,
    user_id: userInfo.user_id,
    red_id: userInfo.red_id,
  };

  const hoverData = {
    basic_info: {
      desc: userInfo.desc || "暂无简介",
    },
    extraInfo_info: {
      fstatus: "none", // Self, so no follow status needed really, or treat as self
    },
  };

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={`我的主页 - ${nickname}`}
      scrollableId="xhsMyInfoScrollable"
    >
      <UserInfoCard
        user={user}
        hoverData={hoverData}
        mode="detailed"
        showFollowButton={false} // Don't follow self
      />
      <div style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
        {/* Placeholder for future features like "My Posts" if xsec_token becomes available */}
        (暂不支持查看我的发布)
      </div>
    </BaseDrawer>
  );
};

export default MyInfoDrawer;
