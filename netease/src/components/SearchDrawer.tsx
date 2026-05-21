/**
 * 搜索抽屉组件
 */
import React, { useState, useCallback } from "react";
import { Drawer, Input, Empty, Spin, Tabs, Button, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useQQMusic } from "../hooks/useQQMusic";
import SongCard from "./SongCard";
import { usePlayerStore } from "../store/player";
import type { Song } from "../types/qqmusic";

const { Search } = Input;

interface SearchDrawerProps {
  open: boolean;
  onClose: () => void;
}

const SearchDrawer: React.FC<SearchDrawerProps> = ({ open, onClose }) => {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("song");
  const [songs, setSongs] = useState<Song[]>([]);
  const [singers, setSingers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { searchSongs, searchSingers, isLoading, playSong } = useQQMusic();
  const { currentSong, openSingerDrawer } = usePlayerStore();

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) return;

    setIsSearching(true);
    try {
      if (activeTab === "song") {
        const result = await searchSongs(keyword, 1, 30);
        if (result.code === 0 && result.data) {
          setSongs(result.data);
        }
      } else if (activeTab === "singer") {
        const result = await searchSingers(keyword, 1, 30);
        if (result.code === 0 && result.data) {
          setSingers(result.data);
        }
      }
    } finally {
      setIsSearching(false);
    }
  }, [keyword, activeTab, searchSongs, searchSingers]);

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

  const tabItems = [
    {
      key: "song",
      label: "歌曲",
      children: (
        <div className="search-results">
          {isSearching || isLoading ? (
            <div
              className="search-loading"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "300px",
              }}
            >
              <Spin size="large" />
            </div>
          ) : songs.length > 0 ? (
            <div className="song-list">
              {songs.map((song) => (
                <SongCard
                  key={song.mid}
                  song={song}
                  isPlaying={currentSong?.mid === song.mid}
                  isCurrent={currentSong?.mid === song.mid}
                  onPlay={handlePlaySong}
                />
              ))}
            </div>
          ) : keyword ? (
            <Empty description="未找到相关歌曲" />
          ) : (
            <Empty description="请输入关键词搜索" />
          )}
        </div>
      ),
    },
    {
      key: "singer",
      label: "歌手",
      children: (
        <div className="search-results">
          {isSearching || isLoading ? (
            <div
              className="search-loading"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "300px",
              }}
            >
              <Spin size="large" />
            </div>
          ) : singers.length > 0 ? (
            <div className="singer-list">
              {singers.map((singer) => (
                <div
                  key={singer.mid || singer.singer_MID}
                  className="song-card"
                  onClick={() =>
                    openSingerDrawer(
                      singer.mid || singer.singer_MID,
                      singer.name || singer.singer_name,
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <div className="song-card-content">
                    <div className="song-card-cover">
                      <img
                        src={
                          singer.pic ||
                          "https://y.gtimg.cn/mediastyle/global/img/singer_300.png"
                        }
                        alt={singer.name}
                        className="song-cover-img"
                      />
                    </div>
                    <div className="song-card-info">
                      <div className="song-title">{singer.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : keyword ? (
            <Empty description="未找到相关歌手" />
          ) : (
            <Empty description="请输入关键词搜索" />
          )}
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title="搜索"
      placement="bottom"
      open={open}
      onClose={onClose}
      destroyOnHidden
      height="90%"
      styles={{
        body: {
          paddingTop: "10px",
        },
      }}
    >
      <div className="search-header">
        <Search
          placeholder="搜索歌曲、歌手"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
          enterButton={<Button type="primary" icon={<SearchOutlined />} />}
          size="large"
          loading={isSearching || isLoading}
        />
      </div>

      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={setActiveTab}
        className="search-tabs"
      />
    </Drawer>
  );
};

export default SearchDrawer;
