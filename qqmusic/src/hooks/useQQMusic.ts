/**
 * QQ音乐业务逻辑 Hook
 */
import { useCallback, useState } from "react";
import { useRequest } from "./useRequest";
import { usePlayerStore } from "../store/player";
import { useUserStore } from "../store/user";
import { SongQuality } from "../types/qqmusic";
import type { Song } from "../types/qqmusic";

export const useQQMusic = () => {
  const { request, messageApi } = useRequest();
  const { play, setCurrentSongUrl } = usePlayerStore();

  const [isLoading, setIsLoading] = useState(false);

  // ==================== 搜索 ====================
  const searchSongs = useCallback(
    async (keyword: string, page: number = 1, num: number = 20) => {
      setIsLoading(true);
      try {
        const result = await request("QQMUSIC_SEARCH", {
          keyword,
          page,
          num,
        });
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [request]
  );

  const searchSingers = useCallback(
    async (keyword: string, page: number = 1, num: number = 20) => {
      setIsLoading(true);
      try {
        const result = await request("QQMUSIC_SEARCH_SINGER", {
          keyword,
          page,
          num,
        });
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [request]
  );

  // ==================== 歌曲 ====================
  const getSongUrl = useCallback(
    async (mid: string, quality: SongQuality = SongQuality.STANDARD) => {
      const userInfo = useUserStore.getState().userInfo;
      const credential = userInfo?.musicid ? {
        musicid: userInfo.musicid,
        musickey: userInfo.musickey
      } : undefined;

      const result = await request("QQMUSIC_GET_SONG_URL", { mid, quality, credential });
      return result;
    },
    [request]
  );

  const getSongDetail = useCallback(
    async (mid: string) => {
      const result = await request("QQMUSIC_GET_SONG_DETAIL", { mid });
      return result;
    },
    [request]
  );

  const getLyric = useCallback(
    async (mid: string) => {
      const result = await request("QQMUSIC_GET_LYRIC", { mid });
      return result;
    },
    [request]
  );

  // 播放歌曲
  const playSong = useCallback(
    async (song: Song, quality: SongQuality = SongQuality.STANDARD) => {
      const urlResult = await getSongUrl(song.mid, quality);
      if (urlResult.code === 0 && urlResult.data) {
        // 先设置 URL，再播放
        setCurrentSongUrl(urlResult.data);
        play(song);
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
        const result = await request("QQMUSIC_GET_RECOMMEND_PLAYLISTS", {
          num,
        });
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [request]
  );

  const getPlaylistDetail = useCallback(
    async (dissid: number, page: number = 1, num: number = 30) => {
      setIsLoading(true);
      try {
        const result = await request("QQMUSIC_GET_PLAYLIST_DETAIL", {
          dissid,
          page,
          num,
        });
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [request]
  );

  // ==================== 排行榜 ====================
  const getRankLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await request("QQMUSIC_GET_RANK_LISTS", null);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  const getRankDetail = useCallback(
    async (topId: number, page: number = 1, num: number = 30) => {
      setIsLoading(true);
      try {
        const result = await request("QQMUSIC_GET_RANK_DETAIL", {
          topId,
          page,
          num,
        });
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [request]
  );

  // ==================== 用户 ====================
  const getMyFavorite = useCallback(
    async (credential: { musicid: string; musickey: string }, page: number = 1, num: number = 30) => {
      setIsLoading(true);
      try {
        const result = await request("QQMUSIC_GET_MY_FAVORITE", {
          credential,
          page,
          num,
        });
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [request]
  );

  const getMyPlaylists = useCallback(
    async (credential: { musicid: string; musickey: string }) => {
      setIsLoading(true);
      try {
        const result = await request("QQMUSIC_GET_MY_PLAYLISTS", {
          credential,
        });
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [request]
  );

  const addSongsToPlaylist = useCallback(
    async (dirid: number, songIds: number[]) => {
      return request("QQMUSIC_ADD_SONGS_TO_PLAYLIST", { dirid, songIds });
    },
    [request]
  );

  const removeSongsFromPlaylist = useCallback(
    async (dirid: number, songIds: number[]) => {
      return request("QQMUSIC_REMOVE_SONGS_FROM_PLAYLIST", { dirid, songIds });
    },
    [request]
  );

  const getRadarRecommend = useCallback(
    async () => {
      return request("QQMUSIC_GET_RADAR_RECOMMEND", {});
    },
    [request]
  );

  const getGuessRecommend = useCallback(
    async () => {
      return request("QQMUSIC_GET_GUESS_RECOMMEND", {});
    },
    [request]
  );

  return {
    isLoading,
    searchSongs,
    searchSingers,
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
