/*
 * @Description: Bilibili 用户状态管理
 */
import { create } from "zustand";

export enum LoginStatus {
  PENDING = "pending",
  SCANNING = "scanning",
  CONFIRMING = "confirming",
  SUCCESS = "success",
  TIMEOUT = "timeout",
  FAILED = "failed",
}

export interface UserInfo {
  mid: number;
  uname: string;
  face: string;
  level?: number;
  sign?: string;
}

interface UserState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  loginStatus: LoginStatus;
  qrCodeUrl: string | null;
  qrKey: string | null;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
  setLoginStatus: (status: LoginStatus) => void;
  setQRCode: (url: string | null, key: string | null) => void;
  login: (userInfo: UserInfo) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()((set) => ({
  isLoggedIn: false,
  userInfo: null,
  loginStatus: LoginStatus.PENDING,
  qrCodeUrl: null,
  qrKey: null,

  setIsLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
  setUserInfo: (userInfo) => set({ userInfo }),
  setLoginStatus: (status) => set({ loginStatus: status }),
  setQRCode: (url, key) => set({ qrCodeUrl: url, qrKey: key }),

  login: (userInfo) =>
    set({
      isLoggedIn: true,
      userInfo,
      loginStatus: LoginStatus.SUCCESS,
    }),

  logout: () => {
    set({
      isLoggedIn: false,
      userInfo: null,
      loginStatus: LoginStatus.PENDING,
      qrCodeUrl: null,
      qrKey: null,
    });
  },
}));
