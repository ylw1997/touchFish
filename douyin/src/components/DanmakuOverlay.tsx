import { useEffect, useMemo, useRef, useState } from "react";

interface DanmakuItem {
  danmaku_id: string;
  offset_time: number;
  text: string;
}

interface ActiveDanmaku extends DanmakuItem {
  renderKey: string;
  track: number;
  duration: number;
}

interface DanmakuOverlayProps {
  awemeId: string;
  durationSeconds: number;
  currentTime: number;
  isPlaying: boolean;
  enabled: boolean;
  request: (command: any, payload?: any) => Promise<any>;
}

const WINDOW_MS = 32_000;
const TRACK_COUNT = 8;

export default function DanmakuOverlay({
  awemeId,
  durationSeconds,
  currentTime,
  isPlaying,
  enabled,
  request,
}: DanmakuOverlayProps) {
  const [activeItems, setActiveItems] = useState<ActiveDanmaku[]>([]);
  const windowsRef = useRef(new Map<number, DanmakuItem[]>());
  const loadingWindowsRef = useRef(new Set<number>());
  const displayedIdsRef = useRef(new Set<string>());
  const trackAvailableAtRef = useRef(Array(TRACK_COUNT).fill(0));
  const previousTimeRef = useRef(0);
  const removalTimersRef = useRef(new Set<number>());

  const durationMs = useMemo(
    () => Math.max(1, Math.round(durationSeconds * 1000)),
    [durationSeconds],
  );
  const currentWindow = Math.floor((currentTime * 1000) / WINDOW_MS) * WINDOW_MS;

  useEffect(() => () => {
    for (const timer of removalTimersRef.current) window.clearTimeout(timer);
    removalTimersRef.current.clear();
  }, []);

  useEffect(() => {
    windowsRef.current.clear();
    loadingWindowsRef.current.clear();
    displayedIdsRef.current.clear();
    trackAvailableAtRef.current.fill(0);
    previousTimeRef.current = 0;
    setActiveItems([]);
    for (const timer of removalTimersRef.current) window.clearTimeout(timer);
    removalTimersRef.current.clear();
  }, [awemeId]);

  useEffect(() => {
    if (!enabled) setActiveItems([]);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !awemeId || durationSeconds <= 0 || !Number.isFinite(durationMs)) return;
    const windows = [currentWindow, currentWindow + WINDOW_MS].filter(
      (start) => start >= 0 && start < durationMs,
    );

    for (const start of windows) {
      if (windowsRef.current.has(start) || loadingWindowsRef.current.has(start)) continue;
      loadingWindowsRef.current.add(start);
      void request("DY_GET_DANMAKU", {
        aweme_id: awemeId,
        duration: durationMs,
        start,
      })
        .then((response) => {
          if (response?.status_code !== 0 || !Array.isArray(response.danmaku_list)) {
            throw new Error(response?.status_msg || "弹幕暂时不可用");
          }
          windowsRef.current.set(
            start,
            response.danmaku_list
              .filter((item: DanmakuItem) => item?.danmaku_id && item?.text)
              .sort((a: DanmakuItem, b: DanmakuItem) => a.offset_time - b.offset_time),
          );
        })
        .catch(() => {
          // 失败窗口不标记为已加载，下一次进入该窗口时允许自动重试。
        })
        .finally(() => loadingWindowsRef.current.delete(start));
    }
  }, [awemeId, currentWindow, durationMs, durationSeconds, enabled, request]);

  useEffect(() => {
    if (!enabled || !isPlaying) return;
    const previous = previousTimeRef.current;
    if (currentTime < previous || Math.abs(currentTime - previous) > 2.5) {
      displayedIdsRef.current.clear();
      trackAvailableAtRef.current.fill(0);
      setActiveItems([]);
    }
    previousTimeRef.current = currentTime;

    const nowMs = currentTime * 1000;
    const candidates = [currentWindow - WINDOW_MS, currentWindow]
      .flatMap((windowStart) => windowsRef.current.get(windowStart) || [])
      .filter(
        (item) =>
          item.offset_time >= nowMs - 500 &&
          item.offset_time <= nowMs + 350 &&
          !displayedIdsRef.current.has(item.danmaku_id),
      );
    if (candidates.length === 0) return;

    const wallNow = Date.now();
    const additions: ActiveDanmaku[] = [];
    for (const item of candidates) {
      const track = trackAvailableAtRef.current.findIndex((availableAt) => availableAt <= wallNow);
      if (track < 0) {
        // 轨道繁忙时不要提前写入 displayedIds，下一次 timeupdate 仍可尝试。
        continue;
      }
      trackAvailableAtRef.current[track] = wallNow + 1_250;
      displayedIdsRef.current.add(item.danmaku_id);
      const active: ActiveDanmaku = {
        ...item,
        renderKey: `${item.danmaku_id}-${wallNow}`,
        track,
        duration: Math.max(7, Math.min(12, 8 + item.text.length * 0.06)),
      };
      additions.push(active);
      const timer = window.setTimeout(() => {
        setActiveItems((items) => items.filter((value) => value.renderKey !== active.renderKey));
        removalTimersRef.current.delete(timer);
      }, active.duration * 1000 + 300);
      removalTimersRef.current.add(timer);
    }
    if (additions.length > 0) setActiveItems((items) => [...items, ...additions]);
  }, [currentTime, currentWindow, enabled, isPlaying]);

  if (!enabled) return null;
  return (
    <div className="danmaku-overlay" aria-hidden="true">
      {activeItems.map((item) => (
        <span
          className="danmaku-item"
          key={item.renderKey}
          style={{
            top: `${6 + item.track * 8.5}%`,
            animationDuration: `${item.duration}s`,
          }}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}
