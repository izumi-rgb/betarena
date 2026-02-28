import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let errorHandlerRegistered = false;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
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

  if (token) {
    s.auth = { token };
  }

  if (!errorHandlerRegistered) {
    s.on("connect_error", (err) => {
      if (
        err.message === "Authentication required" ||
        err.message === "Invalid or expired token"
      ) {
        const freshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null;
        if (freshToken && freshToken !== (s.auth as { token?: string })?.token) {
          s.auth = { token: freshToken };
        }
      }
    });
    errorHandlerRegistered = true;
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
    errorHandlerRegistered = false;
  }
}

export function joinEventRoom(eventId: string): void {
  getSocket().emit("join:event", eventId);
}

export function leaveEventRoom(eventId: string): void {
  getSocket().emit("leave:event", eventId);
}
