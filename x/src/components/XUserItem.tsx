import React from "react";
import { Avatar } from "antd";
import YImg from "./YImg";
import { xUser } from "../../../types/x";

interface XUserItemProps extends xUser {
  showUser?: (item: xUser) => void;
}

export const XUserItem: React.FC<XUserItemProps> = ({ showUser, ...item }) => {
  // 综合昵称显示逻辑，确保至少有文字显示
  const displayName = item.screen_name || item.name || "Unknown User";

  return (
    <div
      className="x-user-item-card"
      onClick={() => showUser?.(item as any)}
      style={{
        display: "flex",
        padding: "12px",
        gap: "12px",
        cursor: "pointer",
        borderBottom: "1px solid var(--vscode-chat-requestBorder)",
        transition: "all 0.2s ease",
        width: "100%",
        boxSizing: "border-box"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--vscode-list-hoverBackground)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* 1. 左侧头像，固定宽度 */}
      <div style={{ flexShrink: 0 }}>
        <Avatar
          size={48}
          src={item.avatar_hd ? <YImg useImg src={item.avatar_hd} /> : null}
          style={{ border: "1px solid var(--vscode-chat-requestBorder)" }}
        />
      </div>

      {/* 2. 右侧信息，自适应宽度 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          minWidth: 0, // 关键：允许子元素在 flex 容器中正常收缩，避免溢出
        }}
      >
        {/* 昵称与 ID */}
        <div
          style={{
            color: "var(--vscode-foreground)",
            fontWeight: "bold",
            fontSize: "14px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%"
          }}
        >
          {displayName}
        </div>

        {/* 个人简介 */}
        {item.descText && (
          <div
            style={{
              fontSize: "12px",
              color: "var(--vscode-descriptionForeground)",
              opacity: 0.8,
              lineHeight: "1.5",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-all"
            }}
          >
            {item.descText}
          </div>
        )}

        {/* 认证/位置信息等副信息 */}
        {item.verified_reason && (
          <div
            style={{
              fontSize: "11px",
              color: "var(--vscode-textLink-foreground)",
              marginTop: "2px"
            }}
          >
            {item.verified_reason}
          </div>
        )}
      </div>
    </div>
  );
};
