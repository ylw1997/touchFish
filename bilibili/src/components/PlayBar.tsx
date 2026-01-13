/*
 * @Description: 悬浮播放条组件
 */
import React, { useRef, useEffect, useMemo, useCallback } from "react";
import {
  UnorderedListOutlined,
  CloseOutlined,
  DeleteOutlined,
  LoadingOutlined,
  PauseOutlined,
  CaretRightOutlined,
  PlayCircleFilled,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import { usePlayerStore } from "../store/player";
import { useRequest } from "../hooks/useRequest";
import { BilibiliApi } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import ArtPlayerComponent from "./ArtPlayerComponent";
import Artplayer from "artplayer";

const PlayBar: React.FC = () => {
  const {
    currentVideo,
    videoUrl,
    isPlaying,
    playlist,
    isPlaylistOpen,
    isExpanded,
    togglePlay,
    togglePlaylistOpen,
    toggleExpand,
    setCurrentVideo,
    setVideoUrl,
    setIsPlaying,
    removeFromPlaylist,
    clearPlaylist,
    playNext,
  } = usePlayerStore();

  const videoRef = useRef<Artplayer | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [danmakuData, setDanmakuData] = React.useState<string>("");

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
          // 获取弹幕
          try {
            const danmakuRes = await apiClient.getDanmaku(cid);
            if (danmakuRes.code === 0) {
              setDanmakuData(danmakuRes.data);
            }
          } catch (e) {
            console.error("获取弹幕失败", e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, setVideoUrl]
  );

  // 当currentVideo变化时，获取播放链接，并清理旧播放器
  useEffect(() => {
    if (currentVideo && !videoUrl) {
      fetchPlayUrl(currentVideo.bvid, currentVideo.cid);
    }
    return () => {
      // 强制销毁旧播放器实例
      if (videoRef.current && videoRef.current.destroy) {
        try {
          videoRef.current.pause();
          videoRef.current.destroy(true);
        } catch {
          // ignore
        }
        videoRef.current = null;
      }
    };
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

  const handlePlayVideo = async (video: typeof currentVideo) => {
    if (video) {
      // 先清除旧的播放链接和弹幕，确保旧播放器销毁
      setVideoUrl(null);
      setDanmakuData("");
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
    // 自动播放下一个
    playNext();
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentVideo) {
      toggleExpand();
    }
  };

  // 使用 useCallback 包裹回调函数，避免 PlayBar 重渲染导致 Artplayer 重复初始化
  const handleArtInstance = useCallback((art: Artplayer) => {
    videoRef.current = art;
  }, []);

  const handleArtPlay = useCallback(() => {
    setIsPlaying(true);
  }, [setIsPlaying]);

  const handleArtPause = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  const style = useMemo(
    () =>
      ({
        width: "100%",
        height: "100%",
        pointerEvents: isExpanded ? "auto" : "none", // 收起时禁用鼠标交互
      } as React.CSSProperties),
    [isExpanded]
  );

  // 当展开/收起状态变化时，重新计算 Artplayer 尺寸
  useEffect(() => {
    if (videoRef.current) {
      // 延迟执行以确保 DOM 已更新
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.autoSize();
        }
      }, 100);
    }
  }, [isExpanded]);

  return (
    <>
      {/* 底部播放条 */}
      <div
        className={`playbar ${isExpanded ? "playbar-expanded" : ""} ${
          isPlaylistOpen ? "playbar-playlist-open" : ""
        }`}
      >
        {/* 播放列表区域 - 在 playbar 内部向下展开 */}
        <AnimatePresence>
          {isPlaylistOpen && (
            <motion.div
              className="playbar-playlist-inner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部控制区域 */}
        <div className="playbar-bottom">
          {/* 单一视频容器 - 收起时在左侧，展开时在上方 */}
          <div
            className="playbar-video-wrapper"
            onClick={(e) => {
              // 收起状态：点击展开；展开状态：让事件传递到 ArtPlayer 处理暂停
              if (!isExpanded && currentVideo) {
                e.stopPropagation();
                toggleExpand();
              }
            }}
          >
            {isLoading ? (
              <div className="playbar-video-loading">
                <LoadingOutlined spin />
              </div>
            ) : videoUrl ? (
              <div
                className="playbar-video"
                style={{ width: "100%", height: "100%" }}
              >
                <ArtPlayerComponent
                  key={videoUrl}
                  url={videoUrl}
                  danmakuData={danmakuData}
                  getInstance={handleArtInstance}
                  onPlay={handleArtPlay}
                  onPause={handleArtPause}
                  onEnded={handleVideoEnded}
                  style={style}
                  controls={isExpanded}
                />
              </div>
            ) : currentVideo ? (
              <img
                className="playbar-video"
                src={currentVideo.pic}
                alt={currentVideo.title}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="playbar-video-loading">
                <PlayCircleFilled style={{ fontSize: 24, opacity: 0.5 }} />
              </div>
            )}
          </div>
          {/* 展开模式下的收起按钮 */}
          {isExpanded && (
            <span
              onClick={handleExpandClick}
              className={`playbar-list-btn`}
              title="收起"
            >
              <FullscreenExitOutlined />
            </span>
          )}
          <div className="playbar-info" onClick={handleExpandClick}>
            {currentVideo ? (
              <div className="playbar-text-info">
                <div className="playbar-title" title={currentVideo.title}>
                  {currentVideo.title}
                </div>
                <div className="playbar-author" title={currentVideo.owner.name}>
                  {currentVideo.owner.name}
                </div>
              </div>
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
                <PauseOutlined />
              ) : (
                <CaretRightOutlined />
              )}
            </span>
          </div>

          <div className="playbar-actions">
            <span
              onClick={togglePlaylistOpen}
              className={`playbar-list-btn ${isPlaylistOpen ? "active" : ""}`}
              title="播放列表"
            >
              <UnorderedListOutlined />
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlayBar;
