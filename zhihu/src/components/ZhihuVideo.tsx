import React, { useState, useEffect } from "react";
import { Spin } from "antd";
import { PlayCircleFilled, ReloadOutlined } from "@ant-design/icons";
import { useRequest } from "../hooks/useRequest";
import { ZhihuApi } from "../api";

interface ZhihuVideoProps {
  videoId: string;
  initialPoster?: string;
}

// 内存缓存，避免页面中重复解析同一个视频
const videoCache = new Map<string, { playUrl: string; coverUrl?: string }>();

const ZhihuVideo: React.FC<ZhihuVideoProps> = ({ videoId, initialPoster }) => {
  const { request, messageApi } = useRequest();
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playUrl, setPlayUrl] = useState<string>(
    () => videoCache.get(videoId)?.playUrl || "",
  );
  const [poster, setPoster] = useState<string>(
    () => videoCache.get(videoId)?.coverUrl || initialPoster || "",
  );
  const [error, setError] = useState<string | null>(null);

  // 如果没有初始封面，尝试静默获取一次视频元信息（包含 cover_url 和 play_url）
  useEffect(() => {
    if (!poster && videoId) {
      const cached = videoCache.get(videoId);
      if (cached) {
        if (cached.coverUrl) setPoster(cached.coverUrl);
        if (cached.playUrl) setPlayUrl(cached.playUrl);
        return;
      }
      const api = new ZhihuApi(request);
      api
        .getVideoUrl(videoId)
        .then((res) => {
          if (res) {
            videoCache.set(videoId, res);
            if (res.coverUrl) setPoster(res.coverUrl);
            if (res.playUrl) setPlayUrl(res.playUrl);
          }
        })
        .catch(() => {
          // 静默失败，点击时再提示
        });
    }
  }, [videoId, poster, request]);

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (playUrl) {
      setIsPlaying(true);
      return;
    }

    if (!videoId) {
      messageApi.error("未找到有效的知乎视频ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = new ZhihuApi(request);
      const res = await api.getVideoUrl(videoId);
      if (res && res.playUrl) {
        videoCache.set(videoId, res);
        setPlayUrl(res.playUrl);
        if (res.coverUrl && !poster) {
          setPoster(res.coverUrl);
        }
        setIsPlaying(true);
      } else {
        setError("无法解析到该视频的播放地址");
        messageApi.warning("未能获取到可播放的视频直链");
      }
    } catch (err: any) {
      console.error("[ZhihuVideo] load video failed:", err);
      setError("视频加载失败，点击重试");
      messageApi.error("视频加载失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="zhihu-video-container"
      onClick={(e) => e.stopPropagation()}
    >
      {isPlaying && playUrl ? (
        <div className="zhihu-video-player-wrapper">
          <video
            src={playUrl}
            controls
            autoPlay
            className="zhihu-video-player"
            playsInline
          />
        </div>
      ) : (
        <div className="zhihu-video-cover" onClick={handlePlayClick}>
          {poster ? (
            <img
              src={poster}
              alt="视频封面"
              className="zhihu-video-poster"
              loading="lazy"
            />
          ) : (
            <div className="zhihu-video-placeholder">
              <span>知乎视频</span>
            </div>
          )}

          {loading ? (
            <div className="zhihu-video-loading-mask">
              <Spin tip="正在解析视频..." />
            </div>
          ) : error ? (
            <div className="zhihu-video-error-mask">
              <ReloadOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <span>{error}</span>
            </div>
          ) : (
            <PlayCircleFilled className="zhihu-video-play-icon" />
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ZhihuVideo);
