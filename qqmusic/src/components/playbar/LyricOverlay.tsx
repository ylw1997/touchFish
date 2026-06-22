import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SongQuality } from "../../types/qqmusic";
import type { Song } from "../../types/qqmusic";
import { ProgressBar } from "./ProgressBar";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { usePlayerStore } from "../../store/player";

interface LyricOverlayProps {
  isLyricOpen: boolean;
  currentSong: Song | null;
  lyrics: { time: number; text: string }[];
  currentLyric: string;
  activeIdx: number;
  isPlaying: boolean;
  getAlbumCover: (song: Song) => string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const LyricOverlay: React.FC<LyricOverlayProps> = ({
  isLyricOpen,
  currentSong,
  lyrics,
  activeIdx,
  isPlaying,
  getAlbumCover,
  audioRef,
}) => {
  const lyricContainerRef = useRef<HTMLDivElement>(null);

  const songQuality = usePlayerStore((state) => state.songQuality);
  const setSongQuality = usePlayerStore((state) => state.setSongQuality);

  const getQualityText = (q: SongQuality) => {
    switch (q) {
      case SongQuality.STANDARD:
        return "标准音质";
      case SongQuality.HIGH:
        return "极高音质";
      case SongQuality.LOSSLESS:
        return "无损音质";
      default:
        return "标准音质";
    }
  };

  const menuItems: MenuProps["items"] = [
    {
      key: String(SongQuality.STANDARD),
      label: "标准音质",
    },
    {
      key: String(SongQuality.HIGH),
      label: "极高音质",
    },
    {
      key: String(SongQuality.LOSSLESS),
      label: "无损音质",
    },
  ];

  const handleQualityChange: MenuProps["onClick"] = ({ key }) => {
    setSongQuality(Number(key) as SongQuality);
  };

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
              <Dropdown
                menu={{
                  items: menuItems,
                  onClick: handleQualityChange,
                  selectable: true,
                  defaultSelectedKeys: [String(songQuality)],
                }}
                placement="bottom"
                trigger={["click"]}
                overlayStyle={{ zIndex: 3000 }}
                overlayClassName="quality-dropdown"
              >
                <div className="quality-selector-btn">
                  <span>{getQualityText(songQuality)}</span>
                </div>
              </Dropdown>
            </div>
            <div className="lyric-list-container" ref={lyricContainerRef}>
              {lyrics.length > 0 ? (
                lyrics.map((l, idx) => {
                  return (
                    <div
                      key={idx}
                      data-index={idx}
                      className={`lyric-line ${idx === activeIdx ? "active" : ""} ${
                        isPlaying ? "" : "paused"
                      }`}
                    >
                      {l.text}
                    </div>
                  );
                })
              ) : (
                <div className="lyric-line active">暂无歌词 / 纯音乐</div>
              )}
            </div>
          </div>
          <ProgressBar audioRef={audioRef} variant="expanded" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
