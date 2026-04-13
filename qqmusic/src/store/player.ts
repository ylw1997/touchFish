/**
 * 播放器状态管理
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Song, PlayMode, SongQuality } from "../types/qqmusic";

interface PlayerState {
  // 当前播放歌曲
  currentSong: Song | null;
  currentSongUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;

  // 播放列表
  playlist: Song[];
  currentIndex: number;
  playMode: PlayMode;

  // 音质
  songQuality: SongQuality;

  // UI 状态
  isPlaylistOpen: boolean;
  isLyricOpen: boolean;
  isRadioMode: boolean;
  playSource: "radar" | "guess" | "normal"; // 新增：播放来源
  isSingerOpen: boolean;
  currentSingerMid: string | null;
  currentSingerName: string | null;

  // Actions
  setCurrentSong: (song: Song | null) => void;
  setCurrentSongUrl: (url: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;

  setPlaylist: (playlist: Song[]) => void;
  setCurrentIndex: (index: number) => void;
  setPlayMode: (mode: PlayMode) => void;
  setSongQuality: (quality: SongQuality) => void;

  togglePlaylistOpen: () => void;
  toggleLyricOpen: () => void;
  openSingerDrawer: (mid: string, name?: string) => void;
  closeSingerDrawer: () => void;

  // 播放控制
  play: (song: Song) => void;
  pause: () => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;

  // 播放列表管理
  addToPlaylist: (song: Song) => void;
  removeFromPlaylist: (index: number) => void;
  clearPlaylist: () => void;
  setIsRadioMode: (isRadioMode: boolean) => void;
  setPlaySource: (source: "radar" | "guess" | "normal") => void; // 新增
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentSong: null,
      currentSongUrl: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,

      playlist: [],
      currentIndex: -1,
      playMode: "order",

      songQuality: 128, // 默认标准音质

      isPlaylistOpen: false,
      isLyricOpen: false,
      isRadioMode: false,
      playSource: "normal", // 新增
      isSingerOpen: false,
      currentSingerMid: null,
      currentSingerName: null,

      // Setters
      setCurrentSong: (song) => set({ currentSong: song }),
      setCurrentSongUrl: (url) => set({ currentSongUrl: url }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setVolume: (volume) => set({ volume }),

      setPlaylist: (playlist) => set({ playlist }),
      setCurrentIndex: (index) => set({ currentIndex: index }),
      setPlayMode: (mode) => set({ playMode: mode }),
      setSongQuality: (quality) => set({ songQuality: quality }),

      togglePlaylistOpen: () =>
        set((state) => ({ isPlaylistOpen: !state.isPlaylistOpen })),
      toggleLyricOpen: () =>
        set((state) => ({ isLyricOpen: !state.isLyricOpen })),
      openSingerDrawer: (mid, name) =>
        set({
          isSingerOpen: true,
          currentSingerMid: mid,
          currentSingerName: name || null,
        }),
      closeSingerDrawer: () =>
        set({
          isSingerOpen: false,
          currentSingerMid: null,
          currentSingerName: null,
        }),
      setIsRadioMode: (isRadioMode) => set({ isRadioMode }),
      setPlaySource: (playSource) => set({ playSource }), // 新增

      // 播放控制
      play: (song) => {
        const { playlist } = get();
        const existingIndex = playlist.findIndex((s) => s.mid === song.mid);

        if (existingIndex >= 0) {
          // 歌曲已在播放列表中
          set({
            currentSong: song,
            currentIndex: existingIndex,
            isPlaying: true,
            currentTime: 0,
          });
        } else {
          // 添加新歌曲到播放列表
          const newPlaylist = [...playlist, song];
          set({
            playlist: newPlaylist,
            currentSong: song,
            currentIndex: newPlaylist.length - 1,
            isPlaying: true,
            currentTime: 0,
          });
        }
      },

      pause: () => set({ isPlaying: false }),

      togglePlay: () => {
        const { currentSong, isPlaying } = get();
        if (currentSong) {
          set({ isPlaying: !isPlaying });
        }
      },

      playNext: () => {
        const { playlist, currentIndex, playMode } = get();
        if (playlist.length === 0) return;

        let nextIndex: number;

        switch (playMode) {
          case "random":
            nextIndex = Math.floor(Math.random() * playlist.length);
            break;
          case "single":
            nextIndex = currentIndex;
            break;
          case "order":
          default:
            nextIndex = currentIndex + 1;
            if (nextIndex >= playlist.length) {
              nextIndex = 0;
            }
            break;
        }

        set({
          currentIndex: nextIndex,
          currentSong: playlist[nextIndex],
          isPlaying: true,
          currentTime: 0,
        });
      },

      playPrev: () => {
        const { playlist, currentIndex } = get();
        if (playlist.length === 0) return;

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
          prevIndex = playlist.length - 1;
        }

        set({
          currentIndex: prevIndex,
          currentSong: playlist[prevIndex],
          isPlaying: true,
          currentTime: 0,
        });
      },

      // 播放列表管理
      addToPlaylist: (song) => {
        const { playlist } = get();
        const exists = playlist.some((s) => s.mid === song.mid);
        if (!exists) {
          set({ playlist: [...playlist, song] });
        }
      },

      removeFromPlaylist: (index) => {
        const { playlist, currentIndex } = get();
        const newPlaylist = playlist.filter((_, i) => i !== index);

        let newIndex = currentIndex;
        if (index === currentIndex) {
          // 删除的是当前播放的歌曲
          newIndex = -1;
          set({
            playlist: newPlaylist,
            currentIndex: newIndex,
            currentSong: null,
            isPlaying: false,
          });
        } else if (index < currentIndex) {
          // 删除的是前面的歌曲
          newIndex = currentIndex - 1;
          set({
            playlist: newPlaylist,
            currentIndex: newIndex,
          });
        } else {
          set({ playlist: newPlaylist });
        }
      },

      clearPlaylist: () => {
        set({
          playlist: [],
          currentIndex: -1,
          currentSong: null,
          isPlaying: false,
        });
      },
    }),
    {
      name: "qqmusic-player-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playlist: state.playlist,
        currentSong: state.currentSong,
        currentIndex: state.currentIndex,
        playMode: state.playMode,
        songQuality: state.songQuality,
        volume: state.volume,
        isPlaylistOpen: state.isPlaylistOpen,
        isRadioMode: state.isRadioMode,
        playSource: state.playSource,
      }),
    },
  ),
);
