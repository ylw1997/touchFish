import React, { useEffect, useRef } from "react";

interface ProgressBarProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ audioRef }) => {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      if (audioRef.current && bgRef.current) {
        const { currentTime, duration } = audioRef.current;
        if (duration > 0) {
          bgRef.current.style.width = `${(currentTime / duration) * 100}%`;
        } else {
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

  return <div ref={bgRef} className="playbar-progress-bg" />;
};
