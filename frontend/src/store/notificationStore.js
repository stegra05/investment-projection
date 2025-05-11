import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const defaultDuration = 5000; // 5 seconds

const useNotificationStore = create((set, get) => ({
  notifications: [],
  addNotification: (message, type = 'info', duration = defaultDuration) => {
    const id = uuidv4();
    set(state => ({ notifications: [...state.notifications, { id, message, type, duration }] }));

    if (duration) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
    return id; // Return id if manual removal is needed
  },
  removeNotification: (id) => {
    set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
  },
  clearNotifications: () => {
    set({ notifications: [] });
  },
}));

export default useNotificationStore; 