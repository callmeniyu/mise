/**
 * Notifications Local Service
 */

import { storageService } from './storage.service';
import { NotificationItem } from '@/types';

export const notificationsService = {
  getAll(): NotificationItem[] {
    const db = storageService.getDatabase();
    return db.notifications || [];
  },

  add(notification: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): NotificationItem {
    const db = storageService.getDatabase();
    const newNotification: NotificationItem = {
      ...notification,
      id: storageService.generateId('NOTIF'),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications = [newNotification, ...(db.notifications || [])].slice(0, 50); // keep last 50
    storageService.saveDatabase(db);
    return newNotification;
  },

  markAsRead(id: string): void {
    const db = storageService.getDatabase();
    db.notifications = (db.notifications || []).map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    storageService.saveDatabase(db);
  },

  markAllAsRead(): void {
    const db = storageService.getDatabase();
    db.notifications = (db.notifications || []).map((n) => ({ ...n, isRead: true }));
    storageService.saveDatabase(db);
  },

  clearAll(): void {
    const db = storageService.getDatabase();
    db.notifications = [];
    storageService.saveDatabase(db);
  },
};
