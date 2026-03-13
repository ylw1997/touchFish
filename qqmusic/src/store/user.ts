/**
 * 用户状态管理
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserInfo, QRCodeInfo } from "../types/qqmusic";
import { LoginStatus } from "../types/qqmusic";

interface UserState {
  // 登录状态
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  loginStatus: LoginStatus;

  // QR 码登录
  qrCodeInfo: QRCodeInfo | null;

  // Actions
  setIsLoggedIn: (loggedIn: boolean) => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
  setLoginStatus: (status: LoginStatus) => void;
  setQRCodeInfo: (qrInfo: QRCodeInfo | null) => void;

  // 登录/登出
  login: (userInfo: UserInfo) => void;
  logout: () => void;

  // 更新用户信息
  updateUserInfo: (updates: Partial<UserInfo>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // 初始状态
      isLoggedIn: false,
      userInfo: null,
          loginStatus: LoginStatus.PENDING,
      qrCodeInfo: null,

      // Setters
      setIsLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
      setUserInfo: (userInfo) => set({ userInfo }),
      setLoginStatus: (status) => set({ loginStatus: status }),
      setQRCodeInfo: (qrInfo) => set({ qrCodeInfo: qrInfo }),

      // 登录
      login: (userInfo) => {
        set({
          isLoggedIn: true,
          userInfo,
          loginStatus: LoginStatus.SUCCESS,
        });
      },

      // 登出
      logout: () => {
        set({
          isLoggedIn: false,
          userInfo: null,
      loginStatus: LoginStatus.PENDING,
          qrCodeInfo: null,
        });
      },

      // 更新用户信息
      updateUserInfo: (updates) => {
        set((state) => ({
          userInfo: state.userInfo
            ? { ...state.userInfo, ...updates }
            : null,
        }));
      },
    }),
    {
      name: "qqmusic-user-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        userInfo: state.userInfo,
      }),
    }
  )
);
