import React, { useEffect, useRef } from "react";
import Artplayer from "artplayer";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";

interface ArtPlayerComponentProps {
  url: string;
  danmakuData?: string; // XML string
  getInstance?: (art: Artplayer) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  style?: React.CSSProperties;
  controls?: boolean; // 控制 UI 元素是否可见/可交互
}

const ArtPlayerComponent: React.FC<ArtPlayerComponentProps> = ({
  url,
  danmakuData,
  getInstance,
  onPlay,
  onPause,
  onEnded,
  style,
  controls = true,
}) => {
  const artRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Artplayer | null>(null);

  // 初始化 Artplayer - 只在 url 或 danmakuData 变化时重新初始化
  useEffect(() => {
    if (!artRef.current || !url) return;

    // 如果实例已存在，先销毁
    if (playerRef.current) {
      playerRef.current.destroy(true);
    }

    // 创建 Blob URL 用于弹幕
    let danmakuUrl = "";
    if (danmakuData) {
      const blob = new Blob([danmakuData], { type: "text/xml" });
      danmakuUrl = URL.createObjectURL(blob);
    }

    // 初始化 Artplayer
    const art = new Artplayer({
      container: artRef.current,
      url: url,
      volume: 0.5,
      isLive: false,
      muted: false,
      autoplay: true,
      autoSize: true,
      autoMini: true,
      screenshot: false,
      setting: false,
      pip: true,
      fullscreen: false,
      fullscreenWeb: false,
      loop: false,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: "#23ade5",
      plugins: [
        artplayerPluginDanmuku({
          danmuku: danmakuUrl,
          speed: 10,
          opacity: 1,
          fontSize: 16,
          color: "#FFFFFF",
          mode: 0,
          emitter: false,
          margin: [10, "75%"],
          antiOverlap: true,
          synchronousPlayback: false,
          filter: (danmu) => danmu.text.length <= 100,
          lockTime: 5,
          maxLength: 100,
          theme: "light",
          beforeEmit: (danmu) => {
            return new Promise((resolve) => {
              console.log(danmu);
              setTimeout(() => {
                resolve(true);
              }, 500);
            });
          },
        }),
      ],
    });

    if (getInstance) {
      getInstance(art);
    }

    if (onPlay) {
      art.on("play", onPlay);
    }
    if (onPause) {
      art.on("pause", onPause);
    }
    if (onEnded) {
      art.on("video:ended", onEnded);
    }

    playerRef.current = art;

    return () => {
      if (danmakuUrl) {
        URL.revokeObjectURL(danmakuUrl);
      }
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.pause();
        } catch {
          // ignore
        }
        playerRef.current.destroy(true);
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, danmakuData]);

  return (
    <div
      ref={artRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "200px",
        ...style,
        pointerEvents: controls ? "auto" : "none",
      }}
      className={controls ? "" : "art-controls-hidden"}
    />
  );
};

export default ArtPlayerComponent;
