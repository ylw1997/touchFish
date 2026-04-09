/**
 * 用户状态管理
 */
import { create } from "zustand";
import type { QRCodeInfo, UserInfo } from "../types/qqmusic";
import { LoginStatus } from "../types/qqmusic";

interface UserState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  loginStatus: LoginStatus;
  qrCodeInfo: QRCodeInfo | null;
  likedSongMids: string[];
  setIsLoggedIn: (loggedIn: boolean) => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
  setLoginStatus: (status: LoginStatus) => void;
  setQRCodeInfo: (qrInfo: QRCodeInfo | null) => void;
  setLikedSongMids: (mids: string[]) => void;
  toggleLikeSong: (mid: string) => void;
  login: (userInfo: UserInfo) => void;
  logout: () => void;
  updateUserInfo: (updates: Partial<UserInfo>) => void;
}

export const useUserStore = create<UserState>()((set) => ({
  isLoggedIn: false,
  userInfo: null,
  loginStatus: LoginStatus.PENDING,
  qrCodeInfo: null,
  likedSongMids: [],

  setIsLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
  setUserInfo: (userInfo) => set({ userInfo }),
  setLoginStatus: (status) => set({ loginStatus: status }),
  setQRCodeInfo: (qrInfo) => set({ qrCodeInfo: qrInfo }),
  setLikedSongMids: (mids) => set({ likedSongMids: mids }),

  toggleLikeSong: (mid) =>
    set((state) => ({
      likedSongMids: state.likedSongMids.includes(mid)
        ? state.likedSongMids.filter((id) => id !== mid)
        : [...state.likedSongMids, mid],
    })),

  login: (userInfo) =>
    set({
      isLoggedIn: true,
      userInfo,
      loginStatus: LoginStatus.SUCCESS,
    }),

  logout: () =>
    set({
      isLoggedIn: false,
      userInfo: null,
      loginStatus: LoginStatus.PENDING,
      qrCodeInfo: null,
      likedSongMids: [],
    }),

  updateUserInfo: (updates) =>
    set((state) => ({
      userInfo: state.userInfo ? { ...state.userInfo, ...updates } : null,
    })),
}));
