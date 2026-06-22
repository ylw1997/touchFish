import React, { useEffect, useRef } from "react";

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
  const timeTextRef = useRef<HTMLSpanElement>(null);
  const durationTextRef = useRef<HTMLSpanElement>(null);
  const trackFillRef = useRef<HTMLDivElement>(null);
  const sliderInputRef = useRef<HTMLInputElement>(null);

  const isSeekingRef = useRef(false);
  const lastSecRef = useRef(-1);
  const lastDurationRef = useRef(0);

  useEffect(() => {
    const audio = audioRef.current;

    const renderProgress = () => {
      const currentAudio = audioRef.current;
      const isSeeking = isSeekingRef.current;

      if (currentAudio) {
        const nextCurrentTime = Number.isFinite(currentAudio.currentTime)
          ? currentAudio.currentTime
          : 0;
        const nextDuration = Number.isFinite(currentAudio.duration)
          ? currentAudio.duration
          : 0;

        const percent = nextDuration > 0 ? (nextCurrentTime / nextDuration) * 100 : 0;
        if (bgRef.current) {
          bgRef.current.style.width = `${percent}%`;
        }

        if (!isSeeking) {
          if (trackFillRef.current) {
            trackFillRef.current.style.width = `${percent}%`;
          }

          const secFloor = Math.floor(nextCurrentTime);
          if (timeTextRef.current && lastSecRef.current !== secFloor) {
            timeTextRef.current.innerText = formatTime(nextCurrentTime);
            lastSecRef.current = secFloor;
          }

          if (lastDurationRef.current !== nextDuration) {
            lastDurationRef.current = nextDuration;
            if (durationTextRef.current) {
              durationTextRef.current.innerText = formatTime(nextDuration);
            }
            if (sliderInputRef.current) {
              sliderInputRef.current.max = String(nextDuration);
              sliderInputRef.current.disabled = nextDuration <= 0;
            }
          }

          if (sliderInputRef.current) {
            sliderInputRef.current.value = String(Math.min(nextCurrentTime, nextDuration));
          }
        }
      } else {
        if (bgRef.current) {
          bgRef.current.style.width = "0%";
        }
        if (trackFillRef.current) {
          trackFillRef.current.style.width = "0%";
        }
        if (timeTextRef.current) {
          timeTextRef.current.innerText = "00:00";
          lastSecRef.current = -1;
        }
        if (durationTextRef.current) {
          durationTextRef.current.innerText = "00:00";
        }
        if (sliderInputRef.current) {
          sliderInputRef.current.max = "0";
          sliderInputRef.current.value = "0";
          sliderInputRef.current.disabled = true;
        }
        lastDurationRef.current = 0;
      }
    };

    renderProgress();

    if (!audio) return;

    const events = [
      "timeupdate",
      "durationchange",
      "loadedmetadata",
      "play",
      "pause",
      "seeked",
      "emptied",
    ] as const;
    events.forEach((eventName) =>
      audio.addEventListener(eventName, renderProgress),
    );

    return () => {
      events.forEach((eventName) =>
        audio.removeEventListener(eventName, renderProgress),
      );
    };
  }, [audioRef]);

  const handleMouseDown = () => {
    isSeekingRef.current = true;
  };

  const handleMouseUp = () => {
    isSeekingRef.current = false;
  };

  const handleTouchStart = () => {
    isSeekingRef.current = true;
  };

  const handleTouchEnd = () => {
    isSeekingRef.current = false;
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value);
    
    if (timeTextRef.current) {
      timeTextRef.current.innerText = formatTime(nextTime);
      lastSecRef.current = Math.floor(nextTime);
    }
    if (trackFillRef.current && lastDurationRef.current > 0) {
      const percent = (nextTime / lastDurationRef.current) * 100;
      trackFillRef.current.style.width = `${percent}%`;
    }

    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
  };

  if (variant === "background") {
    return <div ref={bgRef} className="playbar-progress-bg" />;
  }

  return (
    <div className="playbar-progress playbar-progress-expanded">
      <span ref={timeTextRef} className="playbar-progress-time">
        00:00
      </span>
      <div className="playbar-progress-track">
        <div
          ref={trackFillRef}
          className="playbar-progress-track-fill"
          style={{ width: "0%" }}
        />
        <input
          ref={sliderInputRef}
          className="playbar-progress-slider"
          type="range"
          min={0}
          max={0}
          step={0.1}
          defaultValue={0}
          onChange={handleSeek}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={true}
          aria-label="播放进度"
        />
      </div>
      <span ref={durationTextRef} className="playbar-progress-time">
        00:00
      </span>
    </div>
  );
};
