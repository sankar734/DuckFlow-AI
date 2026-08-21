import { create } from 'zustand';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'security' | 'document' | 'ai' | 'billing';
  timestamp: string;
  isRead: boolean;
  emailDispatched?: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const initialNotifications: AppNotification[] = [
  {
    id: 'n_1',
    title: 'New Sign-In Detected',
    message: 'Login from Chrome on Windows 11. A security verification email was dispatched to your inbox.',
    type: 'security',
    timestamp: 'Just now',
    isRead: false,
    emailDispatched: true,
  },
  {
    id: 'n_2',
    title: 'AI Synthesis Completed',
    message: 'Executive Strategic Proposal.docx has been processed and saved to your cloud workspace.',
    type: 'ai',
    timestamp: '15m ago',
    isRead: false,
  },
  {
    id: 'n_3',
    title: 'Monthly Credits Renewed',
    message: '500 High-Speed AI credits have been added to your Pro account.',
    type: 'billing',
    timestamp: '1h ago',
    isRead: true,
  },
];

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initialNotifications,
  unreadCount: initialNotifications.filter((n) => !n.isRead).length,

  addNotification: (notif) => {
    const newItem: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}`,
      timestamp: 'Just now',
      isRead: false,
    };
    set((state) => {
      const updated = [newItem, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
