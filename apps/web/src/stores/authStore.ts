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
  isHydrating: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  fetchMe: (options?: { silent?: boolean }) => Promise<boolean>;
  hydrateSession: () => Promise<void>;
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
  isHydrating: false,
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
      set({ user, isAuthenticated: true, isHydrating: false });
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
      set({ user: null, isAuthenticated: false, isLoading: false, isHydrating: false });
    }
  },

  refreshToken: async () => {
    try {
      const res = await apiPost<{ accessToken: string }>(
        "/api/auth/refresh",
      );
      const freshToken = res.data.accessToken;
      get().setToken(freshToken);
      connectSocket(freshToken);
      return true;
    } catch {
      get().setToken(null);
      disconnectSocket();
      set({ user: null, isAuthenticated: false });
      return false;
    }
  },

  fetchMe: async (options) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      set({ isLoading: true });
    }
    try {
      const res = await apiGet<User>("/api/auth/me");
      set({ user: res.data, isAuthenticated: true });
      const token = get().accessToken;
      if (token) {
        connectSocket(token);
      }
      return true;
    } catch {
      get().setToken(null);
      disconnectSocket();
      set({ user: null, isAuthenticated: false });
      return false;
    } finally {
      if (!silent) {
        set({ isLoading: false });
      }
    }
  },

  hydrateSession: async () => {
    if (get().isHydrating || get().isAuthenticated) {
      return;
    }

    set({ isHydrating: true });
    try {
      const token =
        get().accessToken
        || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

      if (!token) {
        set({ user: null, isAuthenticated: false });
        return;
      }

      get().setToken(token);

      const meLoaded = await get().fetchMe({ silent: true });
      if (meLoaded) {
        return;
      }

      const refreshed = await get().refreshToken();
      if (!refreshed) {
        get().setToken(null);
        disconnectSocket();
        set({ user: null, isAuthenticated: false });
        return;
      }

      const meAfterRefresh = await get().fetchMe({ silent: true });
      if (!meAfterRefresh) {
        get().setToken(null);
        disconnectSocket();
        set({ user: null, isAuthenticated: false });
      }
    } finally {
      set({ isHydrating: false });
    }
  },
}));
