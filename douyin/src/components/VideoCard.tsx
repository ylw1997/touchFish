import { Avatar, FloatButton } from "antd";
import { HeartFilled, HeartOutlined, MessageOutlined, SoundOutlined, PlayCircleFilled, MutedOutlined } from "@ant-design/icons";
import { useState, useEffect, useRef } from "react";

interface VideoCardProps {
  aweme: any;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function VideoCard({ aweme, isActive, isMuted, onToggleMute }: VideoCardProps) {
  const { desc, author, video, statistics } = aweme;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(statistics?.digg_count || 0);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const [playUrlList, setPlayUrlList] = useState<string[]>([]);
  const [playUrlIndex, setPlayUrlIndex] = useState(0);

  const coverUrl = video?.cover?.url_list?.[0] || "";

  // 整理并优化播放地址优先级（优先推荐带 /aweme/v1/play/ 的高兼容官方重定向地址）
  useEffect(() => {
    const list: string[] = video?.play_addr?.url_list || [];
    const sorted = [...list].sort((a, b) => {
      const aIsPlay = a.includes("/aweme/v1/play/") ? 1 : 0;
      const bIsPlay = b.includes("/aweme/v1/play/") ? 1 : 0;
      return bIsPlay - aIsPlay;
    });
    setPlayUrlList(sorted);
    setPlayUrlIndex(0);
  }, [video]);

  const currentPlayUrl = playUrlList[playUrlIndex] || "";

  // 联动 isActive 播放与暂停
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      // 在播放前重载，以便切换源生效
      videoRef.current.load();
      setProgress(0);
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.log("自动播放被阻拦:", err);
          setIsPlaying(false);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, currentPlayUrl]);

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowPlayOverlay(true);
    } else {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setShowPlayOverlay(false);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };

  // 播放失败自动切源容错
  const handleVideoError = (e: any) => {
    console.warn("[VideoCard] 当前播放源出错，尝试切换备用源:", currentPlayUrl, e);
    if (playUrlIndex < playUrlList.length - 1) {
      setPlayUrlIndex((prev) => prev + 1);
    } else {
      console.error("[VideoCard] 所有可用的抖音视频播放源均播放失败！");
    }
  };

  // 监听视频时间更新
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    }
  };

  // 模拟点赞
  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev: number) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikeCount((prev: number) => prev + 1);
    }
  };

  const formatCount = (count: number) => {
    if (!count) return "0";
    if (count > 10000) {
      return (count / 10000).toFixed(1) + "w";
    }
    return count.toString();
  };

  return (
    <div className="dy-video-item" onClick={handlePlayToggle}>
      {/* 视频播放器 */}
      <video
        ref={videoRef}
        src={currentPlayUrl}
        onError={handleVideoError}
        onTimeUpdate={handleTimeUpdate}
        className="video-player"
        loop
        muted={isMuted}
        playsInline
        poster={coverUrl}
        {...({ referrerPolicy: "no-referrer" } as any)}
      />

      {/* 播放进度条 */}
      <div className="video-progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* 播放/暂停状态悬浮提示 */}
      {!isPlaying && showPlayOverlay && (
        <div className="play-pause-overlay">
          <PlayCircleFilled style={{ fontSize: "64px", color: "rgba(255,255,255,0.7)", filter: "drop-shadow(0px 1px 4px rgba(0,0,0,0.5))" }} />
        </div>
      )}

      {/* 左下角信息区 */}
      <div className="bottom-info">
        <div className="author-name">@{author?.nickname || "未知作者"}</div>
        <div className="video-desc">{desc || "无描述"}</div>
      </div>

      {/* 右侧浮动控制条 */}
      <div className="side-actions">
        {/* 作者头像 */}
        <div className="action-item" style={{ marginBottom: "10px" }} onClick={(e) => e.stopPropagation()}>
          <FloatButton
            className="avatar-float-btn"
            style={{ position: "static", overflow: "hidden" }}
            icon={<Avatar src={author?.avatar_thumb?.url_list?.[0]} style={{ border: '2px solid #fff' }} />}
          />
        </div>

        {/* 红心点赞 */}
        <div className="action-item">
          <FloatButton
            style={{ position: "static" }}
            icon={isLiked ? <HeartFilled style={{ color: "#fe2c55" }} /> : <HeartOutlined />}
            onClick={handleLikeToggle}
          />
          <span className="action-count">{formatCount(likeCount)}</span>
        </div>

        {/* 评论数 */}
        <div className="action-item">
          <FloatButton
            style={{ position: "static" }}
            icon={<MessageOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="action-count">{formatCount(statistics?.comment_count)}</span>
        </div>

        {/* 声音静音/解除静音控制 */}
        <div className="action-item">
          <FloatButton
            style={{ position: "static" }}
            icon={isMuted ? <MutedOutlined style={{ color: "#fe2c55" }} /> : <SoundOutlined />}
            onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          />
          <span className="action-count">{isMuted ? "静音" : "有声"}</span>
        </div>
      </div>
    </div>
  );
}

