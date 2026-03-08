"use client";

import { create } from "zustand";
import { apiPost, apiGet } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

const SOCKET_TOKEN_STORAGE_KEY = "betarena.socketAccessToken";

function readStoredSocketToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage.getItem(SOCKET_TOKEN_STORAGE_KEY);
}

function writeStoredSocketToken(token: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.sessionStorage.setItem(SOCKET_TOKEN_STORAGE_KEY, token);
    return;
  }

  window.sessionStorage.removeItem(SOCKET_TOKEN_STORAGE_KEY);
}

export interface User {
  id: string;
  username: string;
  role: string;
  display_id: string;
  must_change_password?: boolean;
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
  hydrateSession: (options?: { publicOnly?: boolean }) => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  accessToken: readStoredSocketToken(),
  isLoading: false,
  isHydrating: false,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    writeStoredSocketToken(token);
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

  hydrateSession: async (options) => {
    if (get().isHydrating || get().isAuthenticated) {
      return;
    }

    const publicOnly = options?.publicOnly ?? false;
    const storedToken = readStoredSocketToken();

    if (publicOnly && !storedToken) {
      return;
    }

    set({ isHydrating: true });
    try {
      if (storedToken && get().accessToken !== storedToken) {
        set({ accessToken: storedToken });
      }

      // Try fetching /me using HttpOnly cookie auth
      const meLoaded = await get().fetchMe({ silent: true });
      if (meLoaded) {
        if (!get().accessToken) {
          await get().refreshToken();
        }
        return;
      }

      if (publicOnly) {
        get().setToken(null);
        disconnectSocket();
        set({ user: null, isAuthenticated: false });
        return;
      }

      // Cookie-based access token expired — try refresh
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
