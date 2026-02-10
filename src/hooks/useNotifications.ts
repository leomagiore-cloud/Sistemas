import { useState, useCallback, useEffect } from 'react';
import { useLowStockProducts } from './useProducts';

export interface Notification {
  id: string;
  type: 'stock' | 'expiry' | 'sale' | 'financial' | 'delivery';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const NOTIFICATIONS_KEY = 'app_notifications_read';

export function useNotifications() {
  const { data: lowStockProducts = [] } = useLowStockProducts();
  const [readNotifications, setReadNotifications] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  });

  // Generate notifications from real data
  const notifications: Notification[] = [
    ...lowStockProducts.slice(0, 5).map((product, index) => ({
      id: `stock-${product.id}`,
      type: 'stock' as const,
      title: 'Estoque Baixo',
      message: `${product.name} está com apenas ${product.stock_quantity} unidades`,
      time: 'Agora',
      read: readNotifications.has(`stock-${product.id}`),
    })),
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((notificationId: string) => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.add(notificationId);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([...newSet]));
      return newSet;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      notifications.forEach(n => newSet.add(n.id));
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([...newSet]));
      return newSet;
    });
  }, [notifications]);

  const deleteNotification = useCallback((notificationId: string) => {
    // For now, just mark as read since we're generating from data
    markAsRead(notificationId);
  }, [markAsRead]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
