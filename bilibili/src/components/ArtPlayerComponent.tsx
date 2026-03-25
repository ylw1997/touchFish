import React, { useEffect, useRef } from "react";
import Artplayer from "artplayer";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import Hls from "hls.js";

interface ArtPlayerComponentProps {
  url: string;
  danmakuData?: string; // XML string
  isLive?: boolean;
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
  isLive = false,
  getInstance,
  onPlay,
  onPause,
  onEnded,
  style,
  controls = true,
}) => {
  const artRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Artplayer | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // 初始化 Artplayer
  useEffect(() => {
    if (!artRef.current) return;

    let instance = playerRef.current;

    if (!instance) {
      // 判断是否m3u8
      const isM3U8 = url.includes(".m3u8");

      // 首次初始化
      instance = new Artplayer({
        container: artRef.current,
        url: url,
        type: isM3U8 ? "m3u8" : "auto",
        volume: 0.5,
        isLive: isLive,
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
        customType: {
          m3u8: function (video: HTMLVideoElement, url: string, art: Artplayer) {
            if (Hls.isSupported()) {
              const hls = new Hls({
                enableWorker: true,
                xhrSetup: function(xhr) {
                  xhr.setRequestHeader("Referer", "https://live.bilibili.com");
                  xhr.setRequestHeader("Origin", "https://live.bilibili.com");
                }
              });
              hls.loadSource(url);
              hls.attachMedia(video);
              hls.on(Hls.Events.ERROR, function(_event, data) {
                console.error("HLS error:", data);
              });
              hlsRef.current = hls;
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
              // Safari native support
              video.src = url;
            } else {
              art.notice.show = "浏览器不支持 HLS 播放";
            }
          },
        },
        plugins: isLive
          ? [] // 直播不使用弹幕
          : [
              artplayerPluginDanmuku({
                danmuku: [], // 初始为空，稍后更新
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
                beforeEmit: () => {
                  return new Promise((resolve) => {
                    setTimeout(() => {
                      resolve(true);
                    }, 500);
                  });
                },
              }),
            ],
      });

      if (onPlay) instance.on("play", onPlay);
      if (onPause) instance.on("pause", onPause);
      if (onEnded) instance.on("video:ended", onEnded);

      if (getInstance) getInstance(instance);

      playerRef.current = instance;
    } else {
      // 更新 URL
      if (url && url !== instance.option.url) {
        instance.switchUrl(url).then(() => {
          if (instance && instance.option.autoplay) {
            instance.play().catch(() => {});
          }
        });
      }
    }

    // 弹幕更新逻辑 (仅非直播)
    if (danmakuData && instance && !isLive) {
      const blob = new Blob([danmakuData], { type: "text/xml" });
      const danmakuUrl = URL.createObjectURL(blob);

      const danmukuPlugin = (instance.plugins as any).artplayerPluginDanmuku;
      if (danmukuPlugin && danmukuPlugin.config) {
        danmukuPlugin.config({ danmuku: danmakuUrl });
        danmukuPlugin.load();
      }

      return () => {
        URL.revokeObjectURL(danmakuUrl);
      };
    }
  }, [url, danmakuData, isLive, getInstance, onPlay, onPause, onEnded]);

  // 组件卸载时销毁
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (playerRef.current) {
        if (playerRef.current.destroy) {
          playerRef.current.destroy(true);
        }
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={artRef}
      style={{
        width: "100%",
        height: "100%",
        ...style,
        pointerEvents: controls ? "auto" : "none",
      }}
      className={controls ? "" : "art-controls-hidden"}
    />
  );
};

export default ArtPlayerComponent;
