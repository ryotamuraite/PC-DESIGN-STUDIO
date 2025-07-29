// src/utils/notificationHelpers.ts
import { UpdateNotification } from '@/components/notifications/UpdateNotifier';

// 通知作成ヘルパー
export const createUpdateNotification = (
  type: 'success' | 'warning' | 'info' | 'error',
  title: string,
  message: string,
  category?: string
): UpdateNotification => ({
  id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  title,
  message,
  timestamp: new Date(),
  category,
  autoHide: type === 'success'
});

// 通知管理用のクラス
export class NotificationManager {
  private static instance: NotificationManager;
  private notifications: UpdateNotification[] = [];

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public addNotification(notification: UpdateNotification): void {
    this.notifications.unshift(notification);
    // 最新50件のみ保持
    this.notifications = this.notifications.slice(0, 50);
  }

  public removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  public getNotifications(): UpdateNotification[] {
    return [...this.notifications];
  }

  public clearNotifications(): void {
    this.notifications = [];
  }

  public getNotificationsByCategory(category: string): UpdateNotification[] {
    return this.notifications.filter(n => n.category === category);
  }

  public markAsRead(id: string): void {
    // 将来的に既読機能を追加する場合
    console.log(`Marking notification ${id} as read`);
  }

  // 便利なメソッド群
  public success(title: string, message: string, category?: string): void {
    this.addNotification(createUpdateNotification('success', title, message, category));
  }

  public warning(title: string, message: string, category?: string): void {
    this.addNotification(createUpdateNotification('warning', title, message, category));
  }

  public error(title: string, message: string, category?: string): void {
    this.addNotification(createUpdateNotification('error', title, message, category));
  }

  public info(title: string, message: string, category?: string): void {
    this.addNotification(createUpdateNotification('info', title, message, category));
  }
}

export default NotificationManager;
