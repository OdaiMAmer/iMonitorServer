import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/useAuthStore';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;
    socket = io(wsUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: () => ({
        token: useAuthStore.getState().accessToken,
      }),
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
