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
  trackDuration: number;
  getAlbumCover: (song: Song) => string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

function resetLyricHighlight(line: HTMLElement) {
  line.querySelectorAll<HTMLElement>(".lyric-char").forEach((character) => {
    character.classList.remove("is-highlighted", "is-partial");
    character.style.removeProperty("--char-progress");
  });
}

function renderLyricText(text: string) {
  return Array.from(text.replace(/\r/g, "")).map((character, index) =>
    character === "\n" ? (
      <br key={`break-${index}`} aria-hidden="true" />
    ) : (
      <span key={index} className="lyric-char" aria-hidden="true">
        {character}
      </span>
    ),
  );
}

export const LyricOverlay: React.FC<LyricOverlayProps> = ({
  isLyricOpen,
  currentSong,
  lyrics,
  activeIdx,
  isPlaying,
  trackDuration,
  getAlbumCover,
  audioRef,
}) => {
  const lyricContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!isLyricOpen || !audio || activeIdx < 0 || activeIdx >= lyrics.length) {
      return;
    }

    let animationFrame = 0;
    let activeLine: HTMLElement | null = null;
    let characters: HTMLElement[] = [];
    let highlightedCount = 0;
    let partialIndex = -1;

    const renderHighlight = () => {
      const line = lyricContainerRef.current?.querySelector<HTMLElement>(
        `[data-index="${activeIdx}"]`,
      );

      if (!line) {
        if (isPlaying) animationFrame = requestAnimationFrame(renderHighlight);
        return;
      }

      if (line !== activeLine) {
        if (activeLine) resetLyricHighlight(activeLine);
        activeLine = line;
        characters = Array.from(
          line.querySelectorAll<HTMLElement>(".lyric-char"),
        );
        highlightedCount = 0;
        partialIndex = -1;
      }

      if (characters.length > 0) {
        const startTime = lyrics[activeIdx].time;
        const nextTime = lyrics[activeIdx + 1]?.time;
        const mediaDuration = Number.isFinite(audio.duration)
          ? audio.duration
          : 0;
        const endTime =
          nextTime !== undefined && nextTime > startTime
            ? nextTime
            : mediaDuration > startTime
              ? mediaDuration
              : trackDuration > startTime
                ? trackDuration
                : startTime + 5;
        const lineProgress = Math.max(
          0,
          Math.min(1, (audio.currentTime - startTime) / (endTime - startTime)),
        );
        const exactCharacterCount = lineProgress * characters.length;
        const nextHighlightedCount = Math.floor(exactCharacterCount);
        const nextPartialIndex =
          nextHighlightedCount < characters.length &&
          exactCharacterCount > nextHighlightedCount
            ? nextHighlightedCount
            : -1;

        if (nextHighlightedCount > highlightedCount) {
          for (let index = highlightedCount; index < nextHighlightedCount; index++) {
            characters[index].classList.remove("is-partial");
            characters[index].classList.add("is-highlighted");
            characters[index].style.removeProperty("--char-progress");
          }
        } else if (nextHighlightedCount < highlightedCount) {
          for (let index = nextHighlightedCount; index < highlightedCount; index++) {
            characters[index].classList.remove("is-highlighted");
          }
        }
        highlightedCount = nextHighlightedCount;

        if (partialIndex !== nextPartialIndex) {
          if (partialIndex >= 0) {
            characters[partialIndex].classList.remove("is-partial");
            characters[partialIndex].style.removeProperty("--char-progress");
          }
          if (nextPartialIndex >= 0) {
            characters[nextPartialIndex].classList.add("is-partial");
          }
          partialIndex = nextPartialIndex;
        }

        if (partialIndex >= 0) {
          characters[partialIndex].style.setProperty(
            "--char-progress",
            String(exactCharacterCount - nextHighlightedCount),
          );
        }
      }

      if (isPlaying) animationFrame = requestAnimationFrame(renderHighlight);
    };

    const updateWhenPaused = () => {
      if (!isPlaying) renderHighlight();
    };

    audio.addEventListener("timeupdate", updateWhenPaused);
    audio.addEventListener("seeked", updateWhenPaused);
    renderHighlight();

    return () => {
      cancelAnimationFrame(animationFrame);
      audio.removeEventListener("timeupdate", updateWhenPaused);
      audio.removeEventListener("seeked", updateWhenPaused);
      if (activeLine) resetLyricHighlight(activeLine);
    };
  }, [activeIdx, audioRef, isLyricOpen, isPlaying, lyrics, trackDuration]);

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
                      aria-label={l.text}
                    >
                      {renderLyricText(l.text)}
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
