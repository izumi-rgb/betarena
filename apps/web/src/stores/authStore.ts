"use client";

import { create } from "zustand";
import { apiPost, apiGet } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export interface User {
  id: string;
  username: string;
  role: string;
  display_id: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  accessToken:
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("accessToken", token);
      else localStorage.removeItem("accessToken");
    }
    set({ accessToken: token });
  },

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const res = await apiPost<{ user: User; accessToken: string }>(
        "/api/auth/login",
        { username, password },
      );
      const { user, accessToken } = res.data;
      get().setToken(accessToken);
      connectSocket(accessToken);
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiPost("/api/auth/logout");
    } catch {
      /* best-effort */
    } finally {
      get().setToken(null);
      disconnectSocket();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  refreshToken: async () => {
    try {
      const res = await apiPost<{ accessToken: string }>(
        "/api/auth/refresh",
      );
      get().setToken(res.data.accessToken);
    } catch {
      get().setToken(null);
      set({ user: null, isAuthenticated: false });
    }
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const res = await apiGet<User>("/api/auth/me");
      set({ user: res.data, isAuthenticated: true });
    } catch {
      get().setToken(null);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
