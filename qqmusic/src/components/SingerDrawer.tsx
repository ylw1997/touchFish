/**
 * 歌手详情抽屉组件
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Drawer, Empty, Spin, message } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { useQQMusic } from "../hooks/useQQMusic";
import { usePlayerStore } from "../store/player";
import SongCard from "./SongCard";
import type { Song } from "../types/qqmusic";

export const SingerDrawer: React.FC = () => {
  const {
    isSingerOpen,
    currentSingerMid,
    currentSingerName,
    closeSingerDrawer,
    currentSong,
    addToPlaylist,
  } = usePlayerStore();
  const { getSingerInfo, getSingerSongs, isLoading, playSong } = useQQMusic();

  const [singerInfo, setSingerInfo] = useState<any>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(async (mid: string, pageNum: number) => {
    setIsFetching(true);
    try {
      if (pageNum === 1) {
        // 1. 获取基本信息 (仅在第一页时加载)
        const infoResult = await getSingerInfo(mid);
        if (infoResult.code === 0 && infoResult.data) {
          setSingerInfo(infoResult.data);
        }
      }

      // 2. 获取歌曲列表 (传入30首一包)
      const songsResult = await getSingerSongs(mid, pageNum, 30);
      if (songsResult.code === 0 && songsResult.data) {
        setSongs(prev => pageNum === 1 ? songsResult.data : [...prev, ...songsResult.data]);
        setHasMore(songsResult.data.length === 30);
      } else {
        setHasMore(false);
      }
    } catch (error: any) {
      message.error(error.message || "获取歌手信息失败");
    } finally {
      setIsFetching(false);
    }
  }, [getSingerInfo, getSingerSongs]);

  useEffect(() => {
    if (isSingerOpen && currentSingerMid) {
      setSingerInfo(null);
      setSongs([]);
      setPage(1);
      setHasMore(true);
      fetchData(currentSingerMid, 1);
    }
  }, [isSingerOpen, currentSingerMid, fetchData]);

  const loadMore = useCallback(() => {
    if (currentSingerMid && !isFetching && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(currentSingerMid, nextPage);
    }
  }, [currentSingerMid, isFetching, hasMore, page, fetchData]);

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetching && hasMore && currentSingerMid) {
        loadMore();
      }
    });
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => observer.disconnect();
  }, [loadMore, isFetching, hasMore, currentSingerMid]);

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

  // 辅助获取图片 fallback
  const getAvatarUrl = () => {
    if (singerInfo?.SingerMid) {
        return `https://y.gtimg.cn/music/photo_new/T001R300x300M000${singerInfo.SingerMid}.jpg`;
    }
    if (currentSingerMid) {
        return `https://y.gtimg.cn/music/photo_new/T001R300x300M000${currentSingerMid}.jpg`;
    }
    return "https://y.gtimg.cn/mediastyle/global/img/singer_300.png";
  };

  return (
    <Drawer
      title="歌手详情"
      placement="bottom"
      open={isSingerOpen}
      onClose={closeSingerDrawer}
      destroyOnClose
      height="90%"
      className="search-drawer"
      styles={{
        body: {
          paddingTop: "10px",
        },
      }}
    >
      <div className="search-results" id="singer-song-list" style={{ overflowY: "auto", height: "100%" }}>
        {/* 歌手头部信息 (始终展示) */}
        <div className="song-card singer-header-card">
          <div className="song-card-content">
            <div className="song-card-cover">
              <img
                src={getAvatarUrl()}
                alt={singerInfo?.SingerName || ""}
                className="song-cover-img"
                style={{ borderRadius: "50%" }}
              />
            </div>
            <div className="song-card-info">
              <div className="song-title" style={{ fontSize: "18px", fontWeight: "bold" }}>
                {singerInfo?.SingerName || currentSingerName || (songs.length > 0 ? songs[0].singer[0]?.name : "未命名")}
              </div>
              <div className="song-album">歌曲：{songs.length} 首</div>
            </div>
          </div>
        </div>

        {/* 歌曲列表加载区域 */}
        {isLoading && songs.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 0" }}>
            <Spin size="large" />
          </div>
        ) : songs.length > 0 ? (
          <InfiniteScroll
            dataLength={songs.length}
            next={loadMore}
            hasMore={hasMore}
            loader={
              <div style={{ textAlign: "center", padding: "15px 0", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Spin size="default" />
              </div>
            }
            scrollableTarget="singer-song-list"
          >
            <div className="song-list">
              {songs.map((song) => (
                <SongCard
                  key={song.mid}
                  song={song}
                  isPlaying={currentSong?.mid === song.mid}
                  isCurrent={currentSong?.mid === song.mid}
                  onPlay={handlePlaySong}
                  onAddToPlaylist={addToPlaylist}
                />
              ))}
            </div>
          </InfiniteScroll>
        ) : (
          <Empty description="暂无歌曲" />
        )}
      </div>
    </Drawer>
  );
};

export default SingerDrawer;
