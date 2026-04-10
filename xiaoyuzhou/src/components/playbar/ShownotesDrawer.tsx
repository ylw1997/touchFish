import React from "react";
import { Drawer, Empty, Spin } from "antd";
import { usePlayerStore } from "../../store/player";
import { getImageUrl } from "../../hooks/useXiaoyuzhou";

interface ShownotesDrawerProps {
  open: boolean;
  onClose: () => void;
  episode: any | null;
}

export const ShownotesDrawer: React.FC<ShownotesDrawerProps> = ({
  open,
  onClose,
  episode,
}) => {
  if (!episode) return null;

  const getPodcastName = (episode: any): string => {
    return (
      episode?.podcast?.title ||
      episode?.podcast?.author ||
      episode?.author ||
      "未知播客"
    );
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "时长未知";
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;

    if (hours > 0) {
      return `${hours}小时 ${remainMins}分钟`;
    }

    return `${mins} 分钟`;
  };

  return (
    <Drawer
      title="单集详情"
      placement="bottom"
      height="82%"
      open={open}
      onClose={onClose}
    >
      <div style={{ padding: "0 0 60px" }}>
        {/* 头部信息 */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 24,
            padding: "0 0 16px",
            borderBottom: "1px solid var(--vscode-chat-requestBorder)",
          }}
        >
          <img
            src={getImageUrl(episode) || "https://assets.xiaoyuzhoufm.com/favicon.ico"}
            alt={episode.title}
            style={{
              width: 120,
              height: 120,
              borderRadius: 12,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {episode.title}
            </h2>
            <p
              style={{
                margin: "0 0 8px",
                opacity: 0.7,
                fontSize: 14,
              }}
            >
              {getPodcastName(episode)}
            </p>
            <p
              style={{
                margin: 0,
                opacity: 0.5,
                fontSize: 13,
              }}
            >
              {formatDuration(episode.duration)}
            </p>
          </div>
        </div>

        {/* 描述 */}
        {(episode.description || episode.brief) && (
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: "0 0 12px",
              }}
            >
              简介
            </h3>
            <p
              style={{
                lineHeight: 1.7,
                opacity: 0.88,
                fontSize: 14,
                margin: 0,
              }}
            >
              {episode.description || episode.brief}
            </p>
          </div>
        )}

        {/* Shownotes */}
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              margin: "0 0 12px",
            }}
          >
            Shownotes
          </h3>
          {episode.shownotes ? (
            <div
              className="xy-html"
              dangerouslySetInnerHTML={{ __html: episode.shownotes }}
              style={{
                lineHeight: 1.8,
                fontSize: 14,
              }}
            />
          ) : (
            <Empty description="暂无 Shownotes" />
          )}
        </div>
      </div>
    </Drawer>
  );
};
