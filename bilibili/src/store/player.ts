/*
 * @Description: 播放状态管理
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  addListToPlaylist: (list: BilibiliListItem[]) => void;
  removeFromPlaylist: (id: number) => void;
  clearPlaylist: () => void;
  togglePlaylistOpen: () => void;
  toggleExpand: () => void;
  playNext: () => void;
  playPrev: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentVideo: null,
      videoUrl: null,
      isPlaying: false,
      playlist: [],
      isPlaylistOpen: false,
      isExpanded: false,

      setCurrentVideo: (video) =>
        set({ currentVideo: video, isPlaying: !!video }), // Keep old videoUrl

      setVideoUrl: (url) => set({ videoUrl: url }),

      setIsPlaying: (playing) => set({ isPlaying: playing }),

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

      setPlaylist: (list) => set({ playlist: list }),

      addToPlaylist: (video) =>
        set((state) => {
          // 避免重复添加
          const isExist = state.playlist.some((v) => v.id === video.id);

          const newPlaylist = isExist
            ? state.playlist
            : [...state.playlist, video];

          // 如果当前没有播放视频，则自动播放
          if (!state.currentVideo) {
            return {
              playlist: newPlaylist,
              currentVideo: video,
              isPlaying: true,
              // videoUrl: null, // Keep old videoUrl
            };
          }

          if (isExist) {
            return state;
          }

          return { playlist: newPlaylist };
        }),

      addListToPlaylist: (list) =>
        set((state) => {
          // 过滤掉已经在播放列表中的视频
          const newVideos = list.filter(
            (video) => !state.playlist.some((v) => v.id === video.id)
          );

          if (newVideos.length === 0) {
            return state;
          }

          const newPlaylist = [...state.playlist, ...newVideos];

          // 如果当前没有播放视频，则自动播放列表中的第一个（即新添加的第一个）
          if (!state.currentVideo && newVideos.length > 0) {
            return {
              playlist: newPlaylist,
              currentVideo: newVideos[0],
              isPlaying: true,
              // videoUrl: null,
            };
          }

          return { playlist: newPlaylist };
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

        const currentIndex = playlist.findIndex(
          (v) => v.id === currentVideo.id
        );
        if (currentIndex < playlist.length - 1) {
          set({
            currentVideo: playlist[currentIndex + 1],
            isPlaying: true,
            // videoUrl: null, // Keep old videoUrl
          });
        }
      },

      playPrev: () => {
        const { currentVideo, playlist } = get();
        if (!currentVideo || playlist.length === 0) return;

        const currentIndex = playlist.findIndex(
          (v) => v.id === currentVideo.id
        );
        if (currentIndex > 0) {
          set({
            currentVideo: playlist[currentIndex - 1],
            isPlaying: true,
            // videoUrl: null, // Keep old videoUrl
          });
        }
      },
    }),
    {
      name: "bilibili-player-storage", // local storage key
      storage: createJSONStorage(() => localStorage), // use local storage
      partialize: (state) => ({
        // persist only these fields, NOT isPlaying or videoUrl
        playlist: state.playlist,
        currentVideo: state.currentVideo,
        isPlaylistOpen: state.isPlaylistOpen,
        isExpanded: state.isExpanded,
      }),
    }
  )
);
