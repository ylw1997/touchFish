import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Song } from "../../types/qqmusic";

interface LyricOverlayProps {
  isLyricOpen: boolean;
  currentSong: Song | null;
  lyrics: { time: number; text: string }[];
  currentLyric: string;
  activeIdx: number;
  getAlbumCover: (song: Song) => string;
}

export const LyricOverlay: React.FC<LyricOverlayProps> = ({
  isLyricOpen,
  currentSong,
  lyrics,
  activeIdx,
  getAlbumCover,
}) => {
  const lyricContainerRef = useRef<HTMLDivElement>(null);

  // Handle auto-scroll for lyrics when expanded
  useEffect(() => {
    if (isLyricOpen && lyricContainerRef.current) {
      const activeLyric =
        lyricContainerRef.current.querySelector(".lyric-line.active");
      if (activeLyric) {
        activeLyric.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeIdx, isLyricOpen]);

  return (
    <AnimatePresence>
      {isLyricOpen && currentSong && (
        <motion.div
          className="playbar-lyric-overlay"
          initial={{
            height: 0,
            opacity: 0,
            marginBottom: 0,
            paddingBlock: 0,
          }}
          animate={{
            height: 180,
            opacity: 1,
            marginBottom: 0,
            paddingBlock: 16,
          }}
          exit={{ height: 0, opacity: 0, marginBottom: 0, paddingBlock: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="lyric-overlay-content">
            <div className="lyric-cover-container">
              <img
                src={getAlbumCover(currentSong)}
                alt={currentSong.name}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="lyric-list-container" ref={lyricContainerRef}>
              {lyrics.length > 0 ? (
                lyrics.map((l, idx) => (
                  <div
                    key={idx}
                    data-index={idx}
                    className={`lyric-line ${
                      idx === activeIdx ? "active" : ""
                    }`}
                  >
                    {idx === activeIdx
                      ? Array.from(l.text).map((char, charIdx, arr) => (
                          <span
                            key={charIdx}
                            className="lyric-char"
                            style={
                              {
                                "--char-start": (charIdx / arr.length) * 100,
                                "--char-width": (1 / arr.length) * 100,
                              } as React.CSSProperties
                            }
                          >
                            {char}
                          </span>
                        ))
                      : l.text}
                  </div>
                ))
              ) : (
                <div className="lyric-line active">暂无歌词 / 纯音乐</div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
