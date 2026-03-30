import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'exam_started' | 'missed_lesson' | 'exam_reminder' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

let socket: WebSocket | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isConnected: false,

  addNotification: (notification) => {
    const newNotif: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  connectSocket: () => {
    const token = localStorage.getItem('token');
    if (!token || get().isConnected) return;

    try {
      const wsUrl = `ws://localhost:5001/ws?token=${token}`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        set({ isConnected: true });
        console.log('[WS] Connected');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { addNotification } = get();

          switch (data.type) {
            case 'exam_started':
              addNotification({
                type: 'exam_started',
                message: data.message || "Imtihon boshlandi! Platformani oching.",
              });
              break;
            case 'missed_lesson':
              addNotification({
                type: 'missed_lesson',
                message: data.message || "Bugungi darsga kelmadingiz.",
              });
              break;
            case 'exam_reminder':
              addNotification({
                type: 'exam_reminder',
                message: data.message || "Imtihon 10 daqiqadan boshlanadi!",
              });
              break;
            default:
              addNotification({
                type: 'info',
                message: data.message || 'Yangi xabarnoma',
              });
          }
        } catch {
          console.error('[WS] Failed to parse message');
        }
      };

      socket.onclose = () => {
        set({ isConnected: false });
        console.log('[WS] Disconnected');
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          if (!get().isConnected) get().connectSocket();
        }, 5000);
      };

      socket.onerror = () => {
        console.error('[WS] Connection error');
      };

    } catch (e) {
      console.error('[WS] Failed to connect', e);
    }
  },

  disconnectSocket: () => {
    if (socket) {
      socket.close();
      socket = null;
    }
    set({ isConnected: false });
  },
}));
