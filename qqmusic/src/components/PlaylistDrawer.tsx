import React, { useState, useEffect, useCallback } from "react";
import { Drawer, Spin, Empty, message, Button } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
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
        num: 100,
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

  const handlePlayAll = useCallback(async () => {
    if (songs.length === 0) return;

    const playerStore = usePlayerStore.getState();
    playerStore.setPlaylist(songs); // 替换整个播放列表
    
    try {
      await playSong(songs[0]); // 播放第一首
      message.success(`已开始播放: ${playlist?.dissname}`);
    } catch (error: any) {
      message.error(error.message || "无法播放歌曲列表");
    }
  }, [songs, playSong, playlist?.dissname]);

  useEffect(() => {
    if (open && playlist?.dissid) {
      loadPlaylistDetail();
    } else if (!open) {
      setSongs([]);
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
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '20px' }}>
          <span style={{ fontWeight: 'bold' }}>{playlist?.dissname || "歌单详情"}</span>
          <Button 
            color="default"
            variant="filled"
            icon={<PlayCircleOutlined />} 
            onClick={handlePlayAll}
            disabled={songs.length === 0}
          >
            播放全部
          </Button>
        </div>
      }
      placement="bottom"
      height="90%"
      open={open}
      onClose={onClose}
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
