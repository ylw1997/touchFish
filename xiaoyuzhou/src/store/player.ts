import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type PlayMode = "order" | "single" | "random";

interface PlayerState {
  currentEpisode: any | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;

  playlist: any[];
  currentIndex: number;
  playMode: PlayMode;

  isPlaylistOpen: boolean;
  isShownotesOpen: boolean; // 原来的 isLyricOpen
  playSource: string;

  setCurrentEpisode: (episode: any | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;

  setPlaylist: (playlist: any[]) => void;
  setCurrentIndex: (index: number) => void;
  setPlayMode: (mode: PlayMode) => void;

  togglePlaylistOpen: () => void;
  toggleShownotesOpen: () => void;

  play: (episode: any) => void;
  pause: () => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;

  addToPlaylist: (episode: any) => void;
  removeFromPlaylist: (index: number) => void;
  clearPlaylist: () => void;
  setPlaySource: (source: string) => void;
}

function getEpisodeIdentityKey(episode: any): string {
  return (
    episode?.eid ||
    episode?.id ||
    episode?.enclosure?.url ||
    episode?.media?.source?.url ||
    episode?.title ||
    ""
  );
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentEpisode: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,

      playlist: [],
      currentIndex: -1,
      playMode: "order",

      isPlaylistOpen: false,
      isShownotesOpen: false,
      playSource: "normal",

      setCurrentEpisode: (ep) => set({ currentEpisode: ep }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setVolume: (volume) => set({ volume }),

      setPlaylist: (playlist) => set({ playlist }),
      setCurrentIndex: (index) => set({ currentIndex: index }),
      setPlayMode: (mode) => set({ playMode: mode }),

      togglePlaylistOpen: () => set((state) => ({ isPlaylistOpen: !state.isPlaylistOpen })),
      toggleShownotesOpen: () => set((state) => ({ isShownotesOpen: !state.isShownotesOpen })),
      setPlaySource: (playSource) => set({ playSource }),

      play: (episode) => {
        const { playlist } = get();
        const idKey = getEpisodeIdentityKey(episode);
        const existingIndex = playlist.findIndex(
          (s) => getEpisodeIdentityKey(s) === idKey,
        );

        if (existingIndex >= 0) {
          set({
            currentEpisode: episode,
            currentIndex: existingIndex,
            isPlaying: true,
            currentTime: 0,
          });
        } else {
          const newPlaylist = [...playlist, episode];
          set({
            playlist: newPlaylist,
            currentEpisode: episode,
            currentIndex: newPlaylist.length - 1,
            isPlaying: true,
            currentTime: 0,
          });
        }
      },

      pause: () => set({ isPlaying: false }),

      togglePlay: () => {
        const { currentEpisode, isPlaying } = get();
        if (currentEpisode) {
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
          currentEpisode: playlist[nextIndex],
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
          currentEpisode: playlist[prevIndex],
          isPlaying: true,
          currentTime: 0,
        });
      },

      addToPlaylist: (episode) => {
        const { playlist } = get();
        const idKey = getEpisodeIdentityKey(episode);
        const exists = playlist.some((s) => getEpisodeIdentityKey(s) === idKey);
        if (!exists) {
          set({ playlist: [...playlist, episode] });
        }
      },

      removeFromPlaylist: (index) => {
        const { playlist, currentIndex } = get();
        const newPlaylist = playlist.filter((_, i) => i !== index);

        let newIndex = currentIndex;
        if (index === currentIndex) {
          newIndex = -1;
          set({
            playlist: newPlaylist,
            currentIndex: newIndex,
            currentEpisode: null,
            isPlaying: false,
          });
        } else if (index < currentIndex) {
          newIndex = currentIndex - 1;
          set({ playlist: newPlaylist, currentIndex: newIndex });
        } else {
          set({ playlist: newPlaylist });
        }
      },

      clearPlaylist: () => {
        set({
          playlist: [],
          currentIndex: -1,
          currentEpisode: null,
          isPlaying: false,
        });
      },
    }),
    {
      name: "xiaoyuzhou-player-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playlist: state.playlist,
        currentEpisode: state.currentEpisode,
        currentIndex: state.currentIndex,
        playMode: state.playMode,
        volume: state.volume,
        isPlaylistOpen: state.isPlaylistOpen,
      }),
    }
  )
);
