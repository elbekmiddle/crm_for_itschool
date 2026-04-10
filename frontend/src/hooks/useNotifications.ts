import { useNotificationStore } from '../store/useNotificationStore';

export type { NotificationItem as Notification } from '../store/useNotificationStore';

export const useNotifications = () => {
  const notifications = useNotificationStore((s) => s.notifications);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const clearAll = useNotificationStore((s) => s.clearAll);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
};
