import { useState, useEffect, useCallback } from 'react';
import { useAdminStore } from '../store/useAdminStore';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAdminStore();

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newId = Math.random().toString(36).substring(7);
    setNotifications(prev => [
      { ...n, id: newId, timestamp: new Date(), read: false },
      ...prev.slice(0, 19) // Keep last 20
    ]);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => setNotifications([]);

  // Mock WebSocket / Event Simulation
  useEffect(() => {
    if (!user) return;

    // Simulate an incoming notification after 5 seconds
    const timer = setTimeout(() => {
      addNotification({
        title: 'Yangi xabar 🚀',
        message: `${user.first_name}, yangi imtihon e'lon qilindi!`,
        type: 'info'
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [user, addNotification]);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    markAsRead,
    clearAll
  };
};
