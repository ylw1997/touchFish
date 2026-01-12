/*
 * @Description: 播放状态管理
 */
import { create } from "zustand";
import type { BilibiliListItem } from "../types/bilibili";

interface PlayerState {
  // 当前播放的视频
  currentVideo: BilibiliListItem | null;
  // 视频播放链接
  videoUrl: string | null;
  // 是否正在播放
  isPlaying: boolean;
  // 播放列表
  playlist: BilibiliListItem[];
  // 播放列表是否展开
  isPlaylistOpen: boolean;
  // 播放条是否展开
  isExpanded: boolean;

  // Actions
  setCurrentVideo: (video: BilibiliListItem | null) => void;
  setVideoUrl: (url: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setPlaylist: (list: BilibiliListItem[]) => void;
  addToPlaylist: (video: BilibiliListItem) => void;
  removeFromPlaylist: (id: number) => void;
  clearPlaylist: () => void;
  togglePlaylistOpen: () => void;
  toggleExpand: () => void;
  playNext: () => void;
  playPrev: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentVideo: null,
  videoUrl: null,
  isPlaying: false,
  playlist: [],
  isPlaylistOpen: false,
  isExpanded: false,

  setCurrentVideo: (video) =>
    set({ currentVideo: video, isPlaying: !!video, videoUrl: null }),

  setVideoUrl: (url) => set({ videoUrl: url }),

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
    set({
      playlist: [],
      currentVideo: null,
      isPlaying: false,
      isExpanded: false,
    }),

  togglePlaylistOpen: () =>
    set((state) => ({
      isPlaylistOpen: !state.isPlaylistOpen,
    })),

  toggleExpand: () =>
    set((state) => ({
      isExpanded: !state.isExpanded,
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
