/**
 * 搜索抽屉组件
 */
import React, { useState, useCallback } from "react";
import {
  Drawer,
  Input,
  Empty,
  Spin,
  Tabs,
  Button,
} from "antd";
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
  const [isSearching, setIsSearching] = useState(false);

  const { searchSongs, isLoading, playSong } = useQQMusic();
  const { currentSong } = usePlayerStore();

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) return;

    setIsSearching(true);
    try {
      if (activeTab === "song") {
        const result = await searchSongs(keyword, 1, 30);
        if (result.code === 0 && result.data) {
          setSongs(result.data);
        }
      }
    } finally {
      setIsSearching(false);
    }
  }, [keyword, activeTab, searchSongs]);

  const handlePlaySong = useCallback(
    async (song: Song) => {
      try {
        await playSong(song);
      } catch (error: any) {
        // 错误已在 playSong 中处理
      }
    },
    [playSong]
  );

  const tabItems = [
    {
      key: "song",
      label: "歌曲",
      children: (
        <div className="search-results">
          {isSearching || isLoading ? (
            <div className="search-loading">
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
        <Empty description="歌手搜索功能开发中" />
      ),
    },
  ];

  return (
    <Drawer
      title="搜索"
      placement="right"
      open={open}
      onClose={onClose}
      width={500}
      className="search-drawer"
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
