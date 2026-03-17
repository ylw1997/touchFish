import React, { useState, useEffect, useCallback } from "react";
import { Drawer, Spin, Empty, message, Button } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import { useQQMusic } from "../hooks/useQQMusic";
import { useRequest } from "../hooks/useRequest";
import { usePlayerStore } from "../store/player";
import SongCard from "./SongCard";
import InfiniteScroll from "react-infinite-scroll-component"; // 新增
import type { Playlist, Song } from "../types/qqmusic";

interface PlaylistDrawerProps {
  open: boolean;
  onClose: () => void;
  playlist: Playlist | null;
}

const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  open,
  onClose,
  playlist,
}) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1); // 新增页码
  const [hasMore, setHasMore] = useState(true); // 新增 hasMore
  const { request } = useRequest();
  const { playSong } = useQQMusic();
  const { currentSong } = usePlayerStore();

  const loadPlaylistDetail = useCallback(async (pageNum: number = 1) => {
    if (!playlist?.dissid) return;

    if (pageNum === 1) setIsLoading(true);
    try {
      const result = await request("QQMUSIC_GET_PLAYLIST_DETAIL", {
        dissid: playlist.dissid,
        page: pageNum,
        num: 50, // 降低每页数量提升性能
      });

      if (result.code === 0 && result.data) {
        const newSongs = result.data.songs || [];

        setSongs((prev) => {
          const merged = pageNum === 1 ? newSongs : [...prev, ...newSongs];
          setHasMore(newSongs.length === 50); // 只要本次拉齐了 50 首，就表示还有下一页
          return merged;
        });
        setPage(pageNum);
      } else {
        message.error(result.message || "获取歌单详情失败");
      }
    } catch (error: any) {
      message.error(error.message || "获取歌单详情失败");
    } finally {
      if (pageNum === 1) setIsLoading(false);
    }
  }, [playlist?.dissid, request]); // 移除 songs.length 依赖，彻底破开死循环

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
      setPage(1);
      setSongs([]);
      setHasMore(true);
      loadPlaylistDetail(1);
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
    [playSong],
  );

  return (
    <Drawer
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            paddingRight: "20px",
          }}
        >
          <span style={{ fontWeight: "bold" }}>
            {playlist?.dissname || "歌单详情"}
          </span>
          <Button
            color="default"
            variant="filled"
            icon={<PlayCircleOutlined />}
            onClick={handlePlayAll}
            disabled={songs.length === 0}
          >
            播放
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
        <div
          className="drawer-loading"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Spin size="large" />
        </div>
      ) : songs.length > 0 ? (
        <div id="playlist-scroll-target" style={{ height: "100%", overflow: "auto" }}>
          <InfiniteScroll
            dataLength={songs.length}
            next={() => loadPlaylistDetail(page + 1)}
            hasMore={hasMore}
            loader={
              <div style={{ textAlign: "center", padding: "10px" }}>
                <Spin size="small" /> 加载中...
              </div>
            }
            scrollableTarget="playlist-scroll-target"
            endMessage={
              <div style={{ textAlign: "center", padding: "10px", color: "#999" }}>
                没有更多歌曲了
              </div>
            }
          >
            <div className="song-list">
              {songs.map((song) => (
                <SongCard
                  key={`${song.mid}-${song.id}`}
                  song={song}
                  isPlaying={currentSong?.mid === song.mid}
                  isCurrent={currentSong?.mid === song.mid}
                  onPlay={handlePlaySong}
                  onAddToPlaylist={(s) =>
                    usePlayerStore.getState().addToPlaylist(s)
                  }
                />
              ))}
            </div>
          </InfiniteScroll>
        </div>
      ) : (
        <Empty description="歌单里暂无歌曲" />
      )}
    </Drawer>
  );
};

export default PlaylistDrawer;
