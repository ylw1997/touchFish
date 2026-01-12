/*
 * @Description: 悬浮播放条组件
 */
import React from "react";
import {
  PlayCircleFilled,
  PauseCircleFilled,
  MenuOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { usePlayerStore } from "../store/player";

const PlayBar: React.FC = () => {
  const {
    currentVideo,
    isPlaying,
    playlist,
    isPlaylistOpen,
    togglePlay,
    togglePlaylistOpen,
    setCurrentVideo,
    removeFromPlaylist,
    clearPlaylist,
  } = usePlayerStore();

  // 没有正在播放的视频和播放列表时不显示
  if (!currentVideo && playlist.length === 0) {
    return null;
  }

  const handlePlayVideo = (video: typeof currentVideo) => {
    if (video) {
      setCurrentVideo(video);
      window.open(video.uri, "_blank");
    }
  };

  return (
    <>
      {/* 播放列表弹出层 */}
      {isPlaylistOpen && (
        <div className="playbar-playlist">
          <div className="playbar-playlist-header">
            <span className="playbar-playlist-title">
              播放列表 ({playlist.length})
            </span>
            <div className="playbar-playlist-actions">
              <span onClick={clearPlaylist} title="清空列表">
                <DeleteOutlined />
              </span>
              <span onClick={togglePlaylistOpen} title="关闭">
                <CloseOutlined />
              </span>
            </div>
          </div>
          <div className="playbar-playlist-content">
            {playlist.length === 0 ? (
              <div className="playbar-playlist-empty">暂无视频</div>
            ) : (
              playlist.map((video) => (
                <div
                  key={video.id}
                  className={`playbar-playlist-item ${
                    currentVideo?.id === video.id ? "active" : ""
                  }`}
                  onClick={() => handlePlayVideo(video)}
                >
                  <img
                    src={video.pic}
                    alt={video.title}
                    referrerPolicy="no-referrer"
                  />
                  <div className="playbar-playlist-item-info">
                    <div className="playbar-playlist-item-title">
                      {video.title}
                    </div>
                    <div className="playbar-playlist-item-author">
                      {video.owner.name}
                    </div>
                  </div>
                  <span
                    className="playbar-playlist-item-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromPlaylist(video.id);
                    }}
                  >
                    <CloseOutlined />
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 底部播放条 */}
      <div className="playbar">
        <div className="playbar-info">
          {currentVideo ? (
            <>
              <img
                className={`playbar-cover ${isPlaying ? "playing" : ""}`}
                src={currentVideo.pic}
                alt={currentVideo.title}
                referrerPolicy="no-referrer"
              />
              <div className="playbar-title" title={currentVideo.title}>
                {currentVideo.title}
              </div>
            </>
          ) : (
            <div className="playbar-title">暂无播放</div>
          )}
        </div>

        <div className="playbar-controls">
          <span
            onClick={() => {
              if (currentVideo) {
                togglePlay();
                if (!isPlaying) {
                  window.open(currentVideo.uri, "_blank");
                }
              }
            }}
            className="playbar-play-btn"
            title={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? <PauseCircleFilled /> : <PlayCircleFilled />}
          </span>
        </div>

        <div className="playbar-actions">
          <span
            onClick={togglePlaylistOpen}
            className={isPlaylistOpen ? "active" : ""}
            title="播放列表"
          >
            <MenuOutlined />
          </span>
        </div>
      </div>
    </>
  );
};

export default PlayBar;
