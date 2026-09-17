import React, { useEffect, useRef } from "react";
import Artplayer from "artplayer";
import artplayerPluginDanmuku, { type Danmu } from "artplayer-plugin-danmuku";
import Hls from "hls.js";

function getDanmakuMode(key: number): 0 | 1 | 2 {
  switch (key) {
    case 1:
    case 2:
    case 3:
      return 0;
    case 4:
      return 2;
    case 5:
      return 1;
    default:
      return 0;
  }
}

function parseBilibiliDanmakuXml(xmlString: string): Danmu[] {
  if (typeof xmlString !== "string" || !xmlString.trim()) return [];
  const reg = /<d[^>]*?p="(?<p>[^"]+)"[^>]*>(?<text>.*?)<\/d>/gs;
  const matches = xmlString.matchAll(reg);
  const result: Danmu[] = [];

  for (const match of matches) {
    const pAttr = match.groups?.p;
    const rawText = match.groups?.text;
    if (!pAttr || rawText === undefined) continue;
    const attr = pAttr.split(",");
    if (attr.length >= 8) {
      const text = rawText
        .trim()
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
      if (!text) continue;
      const colorNum = Number(attr[3]) || 16777215;
      result.push({
        text,
        time: Number(attr[0]) || 0,
        mode: getDanmakuMode(Number(attr[1])),
        color: `#${colorNum.toString(16).padStart(6, "0")}`,
      });
    }
  }

  return result;
}

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
  progress?: number;
  isDanmakuOpen?: boolean;
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
  progress,
  isDanmakuOpen = true,
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

  // 渲染阶段直接更新回调引用，这是最新的 React 闭包陷阱最佳实践 (类似于 useEvent)
  callbacksRef.current = {
    getInstance,
    onPlay,
    onPause,
    onEnded,
    onError,
  };

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

    if (playerRef.current) {
      // 强硬清理：强制暂停底层 video 并清空 src，防止游离节点后台继续发声
      try {
        const video = playerRef.current.video;
        if (video) {
          video.pause();
          video.removeAttribute("src");
          video.load();
        }
      } catch (e) {
        console.error("Error pausing video during destruction", e);
      }

      if (playerRef.current.destroy) {
        playerRef.current.destroy(true);
      }
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
      fullscreenWeb: true,
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
        m3u8: (video: HTMLVideoElement, sourceUrl: string, art: Artplayer) => {
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
              fontSize: 14,
              color: "#FFFFFF",
              mode: 0,
              emitter: false,
              modes: [0],
              margin: [10, "75%"],
              antiOverlap: true,
              synchronousPlayback: true,
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

    instance.on("play", () => {
      callbacksRef.current.onPlay?.();
    });
    instance.on("pause", () => {
      callbacksRef.current.onPause?.();
    });
    instance.on("video:ended", () => {
      callbacksRef.current.onEnded?.();
    });

    instance.on("ready", () => {
      if (progress && progress > 0) {
        setTimeout(() => {
          try {
            if (instance && instance.video) {
              instance.currentTime = progress;
            }
          } catch (e) {
            console.error("历史跳转失败:", e);
          }
        }, 150);
      } else {
        setTimeout(() => {
          try {
            if (instance && instance.video) {
              instance.currentTime = 0;
            }
          } catch {
            // ignore
          }
        }, 150);
      }
    });

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
          if (progress && progress > 0) {
            setTimeout(() => {
              try {
                if (instance && instance.video) {
                  instance.currentTime = progress;
                }
              } catch (e) {
                console.error("地址切换后历史跳转失败:", e);
              }
            }, 150);
          } else {
            setTimeout(() => {
              try {
                if (instance && instance.video) {
                  instance.currentTime = 0;
                }
              } catch {
                // ignore
              }
            }, 150);
          }
          if (instance.option.autoplay) {
            return instance.play().catch(() => {});
          }
          return undefined;
        })
        .catch((error) => {
          console.error("Artplayer switchUrl failed:", error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, isLive, autoSize]);

  useEffect(() => {
    if (isLive || !playerRef.current) return;

    const instance = playerRef.current;
    const danmukuPlugin = (instance.plugins as any)?.artplayerPluginDanmuku;
    if (!danmukuPlugin?.config) return;

    if (!danmakuData) {
      danmukuPlugin.config({ danmuku: [] });
      danmukuPlugin.load().catch(() => {});
      return;
    }

    const danmus = parseBilibiliDanmakuXml(danmakuData);
    danmukuPlugin.config({ danmuku: danmus });
    danmukuPlugin.load().catch((err: unknown) => {
      console.error("加载弹幕失败:", err);
    });

    if (!isDanmakuOpen) {
      danmukuPlugin.hide();
    } else {
      danmukuPlugin.show();
    }
  }, [danmakuData, isLive, url]);

  useEffect(() => {
    const instance = playerRef.current;
    const danmukuPlugin = (instance?.plugins as any)?.artplayerPluginDanmuku;
    if (!danmukuPlugin) return;

    if (!isDanmakuOpen) {
      danmukuPlugin.hide();
    } else {
      danmukuPlugin.show();
    }
  }, [isDanmakuOpen]);

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
