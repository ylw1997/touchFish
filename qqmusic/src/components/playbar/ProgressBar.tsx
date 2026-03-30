import React, { useEffect, useState } from "react";

interface ProgressBarProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ audioRef }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      if (audioRef.current) {
        const { currentTime, duration } = audioRef.current;
        if (duration > 0) {
          setProgress((currentTime / duration) * 100);
        } else {
          setProgress(0);
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioRef]);

  return <div className="playbar-progress-bg" style={{ width: `${progress}%` }} />;
};
