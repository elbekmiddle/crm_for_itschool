import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (n: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        {
          ...n,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
          read: false,
        },
        ...s.notifications,
      ].slice(0, 30),
    })),
  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((x) => (x.id === id ? { ...x, read: true } : x)),
    })),
  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((x) => ({ ...x, read: true })),
    })),
  clearAll: () => set({ notifications: [] }),
}));
