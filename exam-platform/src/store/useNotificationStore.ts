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

export const useNotificationStore = create<NotificationState>()((set, get) => ({
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
    /** Eski /ws?token= rejimi — JWT endi HTTPOnly cookie’da; bu klient cookie bilan WS qo‘llab-quvvatlanguncha o‘chirilgan */
    if (get().isConnected) return;
  },

  disconnectSocket: () => set({ isConnected: false }),
}));
