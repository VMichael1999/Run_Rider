import { create } from 'zustand';
import { NOTIFICATIONS, type DeliveryNotification } from '../data/account';

interface NotificationsState {
  items: DeliveryNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: NOTIFICATIONS,
  markRead: (id) => set((state) => ({ items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)) })),
  markAllRead: () => set((state) => ({ items: state.items.map((item) => ({ ...item, read: true })) })),
}));

export function unreadCount(items: DeliveryNotification[]) {
  return items.filter((item) => !item.read).length;
}
