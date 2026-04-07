import { io, type Socket } from 'socket.io-client';
import { getSocketBaseUrl } from './socketUrl';

let socket: Socket | null = null;

/**
 * Bitta umumiy Socket.IO client — barcha hooklar shu ulanishdan foydalanadi.
 */
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
      /** HTTP cookie (refresh) bilan birga — CORS da aniq origin ro‘yxati kerak */
      withCredentials: true,
      auth: () => ({
        token: typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null,
      }),
    });
  }
  return socket;
}

/** Logout yoki test uchun */
export function disconnectRealtimeSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/** Login dan keyin yangi sessiya bilan qayta ulanish */
export function reconnectRealtimeSocket() {
  disconnectRealtimeSocket();
  return getRealtimeSocket();
}
