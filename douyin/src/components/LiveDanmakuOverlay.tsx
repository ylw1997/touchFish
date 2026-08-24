import { useEffect, useRef, useState } from "react";

interface LiveDanmakuItem {
  id: string;
  nickname: string;
  text: string;
}

interface ActiveLiveDanmaku extends LiveDanmakuItem {
  renderKey: string;
  track: number;
  duration: number;
}

interface LiveDanmakuOverlayProps {
  roomId: string;
  webRid: string;
  enabled: boolean;
  isActive: boolean;
  request: (command: any, payload?: any) => Promise<any>;
}

const TRACK_COUNT = 3;

export default function LiveDanmakuOverlay({
  roomId,
  webRid,
  enabled,
  isActive,
  request,
}: LiveDanmakuOverlayProps) {
  const [items, setItems] = useState<ActiveLiveDanmaku[]>([]);
  const nextTrackRef = useRef(0);
  const timersRef = useRef(new Set<number>());

  useEffect(() => {
    const clear = () => {
      for (const timer of timersRef.current) window.clearTimeout(timer);
      timersRef.current.clear();
      setItems([]);
    };
    if (!enabled || !isActive || !roomId || !webRid) {
      clear();
      return clear;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.command !== "DY_LIVE_DANMAKU") return;
      const item = event.data.payload as LiveDanmakuItem;
      if (!item?.id || !item?.text) return;
      const track = nextTrackRef.current++ % TRACK_COUNT;
      const active: ActiveLiveDanmaku = {
        ...item,
        renderKey: `${item.id}-${Date.now()}`,
        track,
        duration: Math.max(7, Math.min(13, 8 + item.text.length * 0.05)),
      };
      setItems((current) => [...current.slice(-24), active]);
      const timer = window.setTimeout(() => {
        setItems((current) => current.filter((value) => value.renderKey !== active.renderKey));
        timersRef.current.delete(timer);
      }, active.duration * 1000 + 300);
      timersRef.current.add(timer);
    };

    window.addEventListener("message", handleMessage);
    void request("DY_START_LIVE_DANMAKU", {
      room_id: roomId,
      web_rid: webRid,
    }).catch(() => undefined);
    return () => {
      window.removeEventListener("message", handleMessage);
      clear();
      void request("DY_STOP_LIVE_DANMAKU").catch(() => undefined);
    };
  }, [enabled, isActive, request, roomId, webRid]);

  if (!enabled || !isActive) return null;
  return (
    <div className="danmaku-overlay live-danmaku-overlay" aria-hidden="true">
      {items.map((item) => (
        <span
          className="danmaku-item live-danmaku-item"
          key={item.renderKey}
          style={{
            top: `${8 + item.track * 38}px`,
            animationDuration: `${item.duration}s`,
          }}
        >
          {item.nickname ? `${item.nickname}：` : ""}
          {item.text}
        </span>
      ))}
    </div>
  );
}
