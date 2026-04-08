import { io, type Socket } from 'socket.io-client';
import { getSocketBaseUrl } from './socketUrl';

let socket: Socket | null = null;

export function getRealtimeSocket(): Socket {
  if (!socket) {
    const url = getSocketBaseUrl();
    socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      withCredentials: true,
      auth: () => ({
        token: typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,
      }),
    });
  }
  return socket;
}

export function disconnectRealtimeSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function reconnectRealtimeSocket() {
  disconnectRealtimeSocket();
  return getRealtimeSocket();
}
