/**
 * 歌单详情抽屉组件
 */
import React, { useState, useEffect, useCallback } from "react";
import { Drawer, Spin, Empty, message } from "antd";
import { useQQMusic } from "../hooks/useQQMusic";
import { useRequest } from "../hooks/useRequest";
import { usePlayerStore } from "../store/player";
import SongCard from "./SongCard";
import type { Playlist, Song } from "../types/qqmusic";

interface PlaylistDrawerProps {
  open: boolean;
  onClose: () => void;
  playlist: Playlist | null;
}

const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({ open, onClose, playlist }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { request } = useRequest();
  const { playSong } = useQQMusic();
  const { currentSong } = usePlayerStore();

  const loadPlaylistDetail = useCallback(async () => {
    if (!playlist?.dissid) return;

    setIsLoading(true);
    try {
      const result = await request("QQMUSIC_GET_PLAYLIST_DETAIL", {
        dissid: playlist.dissid,
        page: 1,
        num: 100, // 尽量多加载一点
      });

      if (result.code === 0 && result.data) {
        setSongs(result.data.songs || []);
      } else {
        message.error(result.message || "获取歌单详情失败");
      }
    } catch (error: any) {
      message.error(error.message || "获取歌单详情失败");
    } finally {
      setIsLoading(false);
    }
  }, [playlist?.dissid, request]);

  useEffect(() => {
    if (open && playlist?.dissid) {
      loadPlaylistDetail();
    } else if (!open) {
      setSongs([]); // 关闭时清空，防止下次打开闪烁旧数据
    }
  }, [open, playlist?.dissid, loadPlaylistDetail]);

  const handlePlaySong = useCallback(
    async (song: Song) => {
      try {
        await playSong(song);
      } catch (error: any) {
        message.error(error.message || "无法播放歌曲");
      }
    },
    [playSong]
  );

  return (
    <Drawer
      title={playlist?.dissname || "歌单详情"}
      placement="right"
      open={open}
      onClose={onClose}
      width={450}
      className="playlist-drawer"
    >
      {isLoading ? (
        <div className="drawer-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spin size="large" />
        </div>
      ) : songs.length > 0 ? (
        <div className="song-list">
          {songs.map((song) => (
            <SongCard
              key={`${song.mid}-${song.id}`}
              song={song}
              isPlaying={currentSong?.mid === song.mid}
              isCurrent={currentSong?.mid === song.mid}
              onPlay={handlePlaySong}
              onAddToPlaylist={(s) => usePlayerStore.getState().addToPlaylist(s)}
            />
          ))}
        </div>
      ) : (
        <Empty description="歌单里暂无歌曲" />
      )}
    </Drawer>
  );
};

export default PlaylistDrawer;
