// src/hooks/useNotifications.ts
import { useState, useCallback, useEffect } from 'react';
import { UpdateNotification } from '@/components/notifications/UpdateNotifier';
import { NotificationManager, createUpdateNotification } from '@/utils/notificationHelpers';

interface UseNotificationsReturn {
  notifications: UpdateNotification[];
  addNotification: (notification: UpdateNotification) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  success: (title: string, message: string, category?: string) => void;
  warning: (title: string, message: string, category?: string) => void;
  error: (title: string, message: string, category?: string) => void;
  info: (title: string, message: string, category?: string) => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<UpdateNotification[]>([]);
  const notificationManager = NotificationManager.getInstance();

  // 通知マネージャーと同期
  const syncNotifications = useCallback(() => {
    setNotifications(notificationManager.getNotifications());
  }, [notificationManager]);

  // 初期化時に同期
  useEffect(() => {
    syncNotifications();
  }, [syncNotifications]);

  // 通知追加
  const addNotification = useCallback((notification: UpdateNotification) => {
    notificationManager.addNotification(notification);
    syncNotifications();
  }, [notificationManager, syncNotifications]);

  // 通知削除
  const dismissNotification = useCallback((id: string) => {
    notificationManager.removeNotification(id);
    syncNotifications();
  }, [notificationManager, syncNotifications]);

  // 全通知クリア
  const clearNotifications = useCallback(() => {
    notificationManager.clearNotifications();
    syncNotifications();
  }, [notificationManager, syncNotifications]);

  // 便利メソッド
  const success = useCallback((title: string, message: string, category?: string) => {
    addNotification(createUpdateNotification('success', title, message, category));
  }, [addNotification]);

  const warning = useCallback((title: string, message: string, category?: string) => {
    addNotification(createUpdateNotification('warning', title, message, category));
  }, [addNotification]);

  const error = useCallback((title: string, message: string, category?: string) => {
    addNotification(createUpdateNotification('error', title, message, category));
  }, [addNotification]);

  const info = useCallback((title: string, message: string, category?: string) => {
    addNotification(createUpdateNotification('info', title, message, category));
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearNotifications,
    success,
    warning,
    error,
    info
  };
};

export default useNotifications;
