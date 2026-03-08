import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
const SOCKET_TOKEN_STORAGE_KEY = "betarena.socketAccessToken";

function resolveSocketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL;

  if (typeof window === "undefined") {
    return configured ?? "http://localhost:4000";
  }

  const browserBase = `${window.location.protocol}//${window.location.hostname}:4000`;
  const shouldUseBrowserHost = (hostname: string): boolean => {
    if (["localhost", "127.0.0.1", "0.0.0.0", "api"].includes(hostname)) {
      return true;
    }

    if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) {
      return true;
    }

    if (/^192\.168\.\d+\.\d+$/.test(hostname)) {
      return true;
    }

    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)) {
      return true;
    }

    return !hostname.includes(".") && hostname !== window.location.hostname;
  };

  if (!configured) {
    return browserBase;
  }

  try {
    const configuredUrl = new URL(configured);
    if (shouldUseBrowserHost(configuredUrl.hostname)) {
      return browserBase;
    }
  } catch {
    return browserBase;
  }

  return configured;
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(SOCKET_TOKEN_STORAGE_KEY);
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectSocket(token?: string): Socket {
  const s = getSocket();
  const resolvedToken = token ?? readStoredToken();

  if (resolvedToken) {
    s.auth = { token: resolvedToken };
  }

  if (!s.connected) {
    s.connect();
  }

  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinEventRoom(eventId: string): void {
  getSocket().emit("join:event", eventId);
}

export function leaveEventRoom(eventId: string): void {
  getSocket().emit("leave:event", eventId);
}
