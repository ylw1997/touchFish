/*
 * @Description: 播放状态管理
 */
import { create } from "zustand";
import type { BilibiliListItem } from "../types/bilibili";

interface PlayerState {
  // 当前播放的视频
  currentVideo: BilibiliListItem | null;
  // 是否正在播放
  isPlaying: boolean;
  // 播放列表
  playlist: BilibiliListItem[];
  // 播放列表是否展开
  isPlaylistOpen: boolean;

  // Actions
  setCurrentVideo: (video: BilibiliListItem | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setPlaylist: (list: BilibiliListItem[]) => void;
  addToPlaylist: (video: BilibiliListItem) => void;
  removeFromPlaylist: (id: number) => void;
  clearPlaylist: () => void;
  togglePlaylistOpen: () => void;
  playNext: () => void;
  playPrev: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentVideo: null,
  isPlaying: false,
  playlist: [],
  isPlaylistOpen: false,

  setCurrentVideo: (video) => set({ currentVideo: video, isPlaying: !!video }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setPlaylist: (list) => set({ playlist: list }),

  addToPlaylist: (video) =>
    set((state) => {
      // 避免重复添加
      if (state.playlist.some((v) => v.id === video.id)) {
        return state;
      }
      return { playlist: [...state.playlist, video] };
    }),

  removeFromPlaylist: (id) =>
    set((state) => ({
      playlist: state.playlist.filter((v) => v.id !== id),
    })),

  clearPlaylist: () =>
    set({ playlist: [], currentVideo: null, isPlaying: false }),

  togglePlaylistOpen: () =>
    set((state) => ({
      isPlaylistOpen: !state.isPlaylistOpen,
    })),

  playNext: () => {
    const { currentVideo, playlist } = get();
    if (!currentVideo || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((v) => v.id === currentVideo.id);
    if (currentIndex < playlist.length - 1) {
      set({ currentVideo: playlist[currentIndex + 1], isPlaying: true });
    }
  },

  playPrev: () => {
    const { currentVideo, playlist } = get();
    if (!currentVideo || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((v) => v.id === currentVideo.id);
    if (currentIndex > 0) {
      set({ currentVideo: playlist[currentIndex - 1], isPlaying: true });
    }
  },
}));
