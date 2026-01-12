/*
 * @Description: 悬浮播放条组件
 */
import React, { useRef, useEffect, useMemo, useCallback } from "react";
import {
  PlayCircleFilled,
  PauseCircleFilled,
  MenuOutlined,
  CloseOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { usePlayerStore } from "../store/player";
import { useRequest } from "../hooks/useRequest";
import { BilibiliApi } from "../api";

const PlayBar: React.FC = () => {
  const {
    currentVideo,
    videoUrl,
    isPlaying,
    playlist,
    isPlaylistOpen,
    togglePlay,
    togglePlaylistOpen,
    setCurrentVideo,
    setVideoUrl,
    setIsPlaying,
    removeFromPlaylist,
    clearPlaylist,
  } = usePlayerStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const { request } = useRequest();
  const apiClient = useMemo(() => new BilibiliApi(request), [request]);

  // 获取视频播放链接
  const fetchPlayUrl = useCallback(
    async (bvid: string, cid: number) => {
      setIsLoading(true);
      try {
        const result = await apiClient.getPlayUrl(bvid, cid);
        if (result.code === 0 && result.data?.durl?.[0]?.url) {
          setVideoUrl(result.data.durl[0].url);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, setVideoUrl]
  );

  // 当currentVideo变化时，获取播放链接
  useEffect(() => {
    if (currentVideo && !videoUrl) {
      fetchPlayUrl(currentVideo.bvid, currentVideo.cid);
    }
  }, [currentVideo, videoUrl, fetchPlayUrl]);

  // 同步播放状态与video元素
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, videoUrl]);

  // 没有正在播放的视频和播放列表时不显示
  if (!currentVideo && playlist.length === 0) {
    return null;
  }

  const handlePlayVideo = async (video: typeof currentVideo) => {
    if (video) {
      setCurrentVideo(video);
    }
  };

  const handlePlayPause = () => {
    if (currentVideo) {
      if (!videoUrl && !isLoading) {
        fetchPlayUrl(currentVideo.bvid, currentVideo.cid);
      }
      togglePlay();
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
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
              {isLoading ? (
                <div className="playbar-video-loading">
                  <LoadingOutlined spin />
                </div>
              ) : videoUrl ? (
                <video
                  ref={videoRef}
                  className="playbar-video"
                  src={videoUrl}
                  onEnded={handleVideoEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <img
                  className={`playbar-cover ${isPlaying ? "playing" : ""}`}
                  src={currentVideo.pic}
                  alt={currentVideo.title}
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="playbar-text-info">
                <div className="playbar-title" title={currentVideo.title}>
                  {currentVideo.title}
                </div>
                <div className="playbar-author" title={currentVideo.owner.name}>
                  {currentVideo.owner.name}
                </div>
              </div>
            </>
          ) : (
            <div className="playbar-title">暂无播放</div>
          )}
        </div>

        <div className="playbar-controls">
          <span
            onClick={handlePlayPause}
            className="playbar-play-btn"
            title={isPlaying ? "暂停" : "播放"}
          >
            {isLoading ? (
              <LoadingOutlined spin />
            ) : isPlaying ? (
              <PauseCircleFilled />
            ) : (
              <PlayCircleFilled />
            )}
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
