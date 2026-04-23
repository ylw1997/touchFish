import React, { useEffect, useMemo, useRef, useState } from "react";

interface ProgressBarProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  variant?: "background" | "expanded";
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainSeconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  audioRef,
  variant = "background",
}) => {
  const bgRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      const audio = audioRef.current;
      if (audio) {
        const nextCurrentTime = Number.isFinite(audio.currentTime)
          ? audio.currentTime
          : 0;
        const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;

        setCurrentTime(nextCurrentTime);
        setDuration(nextDuration);

        if (bgRef.current) {
          bgRef.current.style.width =
            nextDuration > 0 ? `${(nextCurrentTime / nextDuration) * 100}%` : "0%";
        }
      } else {
        setCurrentTime(0);
        setDuration(0);
        if (bgRef.current) {
          bgRef.current.style.width = "0%";
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioRef]);

  const sliderMax = useMemo(() => (duration > 0 ? duration : 0), [duration]);

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value);
    setCurrentTime(nextTime);

    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
  };

  if (variant === "background") {
    return <div ref={bgRef} className="playbar-progress-bg" />;
  }

  return (
    <div className="playbar-progress playbar-progress-expanded">
      <span className="playbar-progress-time">{formatTime(currentTime)}</span>
      <div className="playbar-progress-track">
        <div
          className="playbar-progress-track-fill"
          style={{
            width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
          }}
        />
        <input
          className="playbar-progress-slider"
          type="range"
          min={0}
          max={sliderMax}
          step={0.1}
          value={Math.min(currentTime, sliderMax || 0)}
          onChange={handleSeek}
          disabled={sliderMax <= 0}
          aria-label="播放进度"
        />
      </div>
      <span className="playbar-progress-time">{formatTime(duration)}</span>
    </div>
  );
};
