import React, { useEffect, useRef } from "react";
import Artplayer from "artplayer";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import Hls from "hls.js";

interface ArtPlayerComponentProps {
  url: string;
  mediaId?: number;
  danmakuData?: string;
  isLive?: boolean;
  getInstance?: (art: Artplayer) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (
    error: unknown,
    context: {
      mediaId?: number;
      url: string;
      isLive: boolean;
    },
  ) => void;
  style?: React.CSSProperties;
  controls?: boolean;
  autoSize?: boolean;
}

const ArtPlayerComponent: React.FC<ArtPlayerComponentProps> = ({
  url,
  mediaId,
  danmakuData,
  isLive = false,
  getInstance,
  onPlay,
  onPause,
  onEnded,
  onError,
  style,
  controls = true,
  autoSize = true,
}) => {
  const artRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Artplayer | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const modeRef = useRef<"video" | "live" | null>(null);
  const handledErrorUrlRef = useRef<string | null>(null);
  const mediaRef = useRef({
    mediaId,
    url,
    isLive,
  });
  const callbacksRef = useRef({
    getInstance,
    onPlay,
    onPause,
    onEnded,
    onError,
  });

  useEffect(() => {
    callbacksRef.current = {
      getInstance,
      onPlay,
      onPause,
      onEnded,
      onError,
    };
  }, [getInstance, onPlay, onPause, onEnded, onError]);

  useEffect(() => {
    mediaRef.current = {
      mediaId,
      url,
      isLive,
    };
  }, [mediaId, url, isLive]);

  useEffect(() => {
    handledErrorUrlRef.current = null;
  }, [url]);

  const destroyPlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (playerRef.current?.destroy) {
      playerRef.current.destroy(true);
    }

    playerRef.current = null;
    modeRef.current = null;
  };

  const createPlayer = (nextUrl: string, nextIsLive: boolean) => {
    if (!artRef.current) return null;

    const isM3U8 = nextUrl.includes(".m3u8");
    const instance = new Artplayer({
      container: artRef.current,
      url: nextUrl,
      type: isM3U8 ? "m3u8" : "auto",
      volume: 0.5,
      isLive: nextIsLive,
      muted: false,
      autoplay: true,
      autoSize,
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
        m3u8: (
          video: HTMLVideoElement,
          sourceUrl: string,
          art: Artplayer,
        ) => {
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
            });
            hls.loadSource(sourceUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.ERROR, (_event, data) => {
              console.error("HLS error:", data);
              if (data?.fatal && handledErrorUrlRef.current !== sourceUrl) {
                handledErrorUrlRef.current = sourceUrl;
                callbacksRef.current.onError?.(data, {
                  mediaId: mediaRef.current.mediaId,
                  url: sourceUrl,
                  isLive: true,
                });
              }
            });
            hlsRef.current = hls;
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = sourceUrl;
          } else {
            art.notice.show = "Browser does not support HLS playback";
            callbacksRef.current.onError?.(
              new Error("Browser does not support HLS playback"),
              {
                mediaId: mediaRef.current.mediaId,
                url: sourceUrl,
                isLive: true,
              },
            );
          }
        },
      },
      plugins: nextIsLive
        ? []
        : [
            artplayerPluginDanmuku({
              danmuku: [],
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
              beforeEmit: () =>
                new Promise((resolve) => {
                  setTimeout(() => {
                    resolve(true);
                  }, 500);
                }),
            }),
          ],
    });

    if (callbacksRef.current.onPlay) {
      instance.on("play", callbacksRef.current.onPlay);
    }
    if (callbacksRef.current.onPause) {
      instance.on("pause", callbacksRef.current.onPause);
    }
    if (callbacksRef.current.onEnded) {
      instance.on("video:ended", callbacksRef.current.onEnded);
    }

    callbacksRef.current.getInstance?.(instance);

    playerRef.current = instance;
    modeRef.current = nextIsLive || isM3U8 ? "live" : "video";

    return instance;
  };

  useEffect(() => {
    if (!artRef.current || !url) return;

    const nextMode = isLive || url.includes(".m3u8") ? "live" : "video";
    const instance = playerRef.current;

    if (!instance) {
      createPlayer(url, isLive);
      return;
    }

    const shouldRecreate =
      modeRef.current !== nextMode ||
      (nextMode === "live" && url !== instance.option.url);

    if (shouldRecreate) {
      destroyPlayer();
      createPlayer(url, isLive);
      return;
    }

    if (url !== instance.option.url) {
      void instance
        .switchUrl(url)
        .then(() => {
          if (instance.option.autoplay) {
            return instance.play().catch(() => {});
          }
          return undefined;
        })
        .catch((error) => {
          console.error("Artplayer switchUrl failed:", error);
        });
    }
  }, [url, isLive, autoSize]);

  useEffect(() => {
    if (isLive || !danmakuData || !playerRef.current) return;

    const instance = playerRef.current;
    const blob = new Blob([danmakuData], { type: "text/xml" });
    const danmakuUrl = URL.createObjectURL(blob);
    const danmukuPlugin = (instance.plugins as any).artplayerPluginDanmuku;

    if (danmukuPlugin?.config) {
      danmukuPlugin.config({ danmuku: danmakuUrl });
      danmukuPlugin.load();
    }

    return () => {
      URL.revokeObjectURL(danmakuUrl);
    };
  }, [danmakuData, isLive, url]);

  useEffect(() => {
    return () => {
      destroyPlayer();
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
