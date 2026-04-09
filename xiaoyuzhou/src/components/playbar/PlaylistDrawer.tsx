import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { Song } from "../../types/qqmusic";

interface PlaylistDrawerProps {
  isPlaylistOpen: boolean;
  playlist: Song[];
  currentSong: Song | null;
  getAlbumCover: (song: Song) => string;
  getSingerName: (song: Song) => string;
  playSong: (song: Song) => void;
  removeFromPlaylist: (index: number) => void;
  clearPlaylist: () => void;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  isPlaylistOpen,
  playlist,
  currentSong,
  getAlbumCover,
  getSingerName,
  playSong,
  removeFromPlaylist,
  clearPlaylist,
}) => {
  return (
    <AnimatePresence>
      {isPlaylistOpen && (
        <motion.div
          className="playbar-playlist-inner"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="playbar-playlist-header">
            <span className="playbar-playlist-title">
              播放列表 ({playlist.length})
            </span>
            {playlist.length > 0 && (
              <Button
                color="red"
                variant="filled"
                onClick={clearPlaylist}
                title="清空列表"
                shape="circle"
              >
                <DeleteOutlined />
              </Button>
            )}
          </div>
          <div className="playbar-playlist-content">
            {playlist.length === 0 ? (
              <div className="playbar-playlist-empty">暂无歌曲</div>
            ) : (
              playlist.map((song, index) => (
                <div
                  key={song.mid + index}
                  className={`playbar-playlist-item ${
                    currentSong?.mid === song.mid ? "active" : ""
                  }`}
                  onClick={() => playSong(song)}
                >
                  <img src={getAlbumCover(song)} alt={song.name} />
                  <div className="playbar-playlist-item-info">
                    <div className="playbar-playlist-item-title">
                      {song.name}
                    </div>
                    <div className="playbar-playlist-item-author">
                      {getSingerName(song)}
                    </div>
                  </div>
                  <span
                    className="playbar-playlist-item-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromPlaylist(index);
                    }}
                  >
                    <DeleteOutlined />
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
