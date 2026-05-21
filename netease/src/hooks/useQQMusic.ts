/**
 * 网易云音乐业务逻辑 Hook (使用 QQMusicApi 适配器直连后端)
 */
import { useCallback, useState, useMemo } from "react";
import { useRequest } from "./useRequest";
import { usePlayerStore } from "../store/player";
import { SongQuality } from "../types/qqmusic";
import type { PlaySource } from "../store/player";
import type { Song } from "../types/qqmusic";
import { QQMusicApi } from "../api";

export const useQQMusic = () => {
  const { request, messageApi } = useRequest();
  const { play, setCurrentSongUrl } = usePlayerStore();

  const [isLoading, setIsLoading] = useState(false);

  // 实例化 API 适配器
  const api = useMemo(() => new QQMusicApi(request), [request]);

  // ==================== 搜索 ====================
  const searchSongs = useCallback(
    async (keyword: string, page: number = 1, num: number = 20) => {
      setIsLoading(true);
      try {
        return await api.searchSongs(keyword, page, num);
      } finally {
        setIsLoading(false);
      }
    },
    [api]
  );

  const searchSingers = useCallback(
    async (keyword: string, page: number = 1, num: number = 20) => {
      setIsLoading(true);
      try {
        return await api.searchSingers(keyword, page, num);
      } finally {
        setIsLoading(false);
      }
    },
    [api]
  );

  const getSingerInfo = useCallback(
    async (mid: string) => {
      return await api.getSingerInfo(mid);
    },
    [api]
  );

  const getSingerSongs = useCallback(
    async (mid: string, page: number = 1, num: number = 30) => {
      setIsLoading(true);
      try {
        return await api.getSingerSongs(mid, page, num);
      } finally {
        setIsLoading(false);
      }
    },
    [api]
  );

  // ==================== 歌曲 ====================
  const getSongUrl = useCallback(
    async (mid: string, quality: SongQuality = SongQuality.STANDARD) => {
      return await api.getSongUrl(mid, quality);
    },
    [api]
  );

  const getSongDetail = useCallback(
    async (mid: string) => {
      return await api.getSongDetail(mid);
    },
    [api]
  );

  const getLyric = useCallback(
    async (mid: string) => {
      return await api.getLyric(mid);
    },
    [api]
  );

  // 播放歌曲
  const playSong = useCallback(
    async (
      song: Song,
      quality: SongQuality = SongQuality.STANDARD,
      source: PlaySource = "normal",
    ) => {
      const urlResult = await getSongUrl(song.mid, quality);
      if (urlResult.code === 0 && urlResult.data) {
        setCurrentSongUrl(urlResult.data);
        play(song, source);
      } else {
        throw new Error(urlResult.message || "无法获取播放链接");
      }
    },
    [getSongUrl, play, setCurrentSongUrl]
  );

  // ==================== 歌单 ====================
  const getRecommendPlaylists = useCallback(
    async (num: number = 10) => {
      setIsLoading(true);
      try {
        return await api.getRecommendPlaylists(num);
      } finally {
        setIsLoading(false);
      }
    },
    [api]
  );

  const getPlaylistDetail = useCallback(
    async (dissid: number, page: number = 1, num: number = 30) => {
      setIsLoading(true);
      try {
        return await api.getPlaylistDetail(dissid, page, num);
      } finally {
        setIsLoading(false);
      }
    },
    [api]
  );

  // ==================== 排行榜 ====================
  const getRankLists = useCallback(async () => {
    setIsLoading(true);
    try {
      return await api.getRankLists();
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const getRankDetail = useCallback(
    async (topId: number, page: number = 1, num: number = 30) => {
      setIsLoading(true);
      try {
        return await api.getRankDetail(topId, page, num);
      } finally {
        setIsLoading(false);
      }
    },
    [api]
  );

  // ==================== 用户 ====================
  const getMyFavorite = useCallback(
    async (_credential: any, _page: number = 1, _num: number = 30) => {
      void _credential;
      void _page;
      void _num;
      setIsLoading(true);
      try {
        return await api.getMyFavoritePlaylist();
      } finally {
        setIsLoading(false);
      }
    },
    [api]
  );

  const getMyPlaylists = useCallback(
    async (_credential: any) => {
      void _credential;
      setIsLoading(true);
      try {
        return await api.getMyPlaylists();
      } finally {
        setIsLoading(false);
      }
    },
    [api]
  );

  const addSongsToPlaylist = useCallback(
    async (dirid: number, songIds: number[]) => {
      if (dirid === 201 && songIds.length > 0) {
        return await api.likeSong(songIds[0], true);
      }
      return { code: -1, message: "直连版暂不支持添加歌曲到其它歌单" };
    },
    [api]
  );

  const removeSongsFromPlaylist = useCallback(
    async (dirid: number, songIds: number[]) => {
      if (dirid === 201 && songIds.length > 0) {
        return await api.likeSong(songIds[0], false);
      }
      return { code: -1, message: "直连版暂不支持从其它歌单移除歌曲" };
    },
    [api]
  );

  // 专属雷达（使用真正的每日推荐歌曲作为雷达）
  const getRadarRecommend = useCallback(
    async () => {
      return await api.getDailyRecommendSongs();
    },
    [api]
  );

  // 猜你喜欢（使用网易云私人FM）
  const getGuessRecommend = useCallback(
    async () => {
      return await api.getPersonalFM();
    },
    [api]
  );

  return {
    isLoading,
    searchSongs,
    searchSingers,
    getSingerInfo,
    getSingerSongs,
    getSongUrl,
    getSongDetail,
    getLyric,
    playSong,
    getRecommendPlaylists,
    getPlaylistDetail,
    getRankLists,
    getRankDetail,
    getMyFavorite,
    getMyPlaylists,
    addSongsToPlaylist,
    removeSongsFromPlaylist,
    getRadarRecommend,
    getGuessRecommend,
    messageApi,
  };
};

export default useQQMusic;
