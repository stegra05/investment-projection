import useNotificationStore from '../store/notificationStore';

/**
 * Custom hook to access notification functionalities.
 * Provides a simple API to add notifications.
 *
 * @returns {object} Object containing notification functions.
 * @property {(message: string, type?: 'success'|'error'|'info'|'warning', duration?: number) => string} addNotification - Function to add a new notification. Returns the ID of the notification.
 * @property {(id: string) => void} removeNotification - Function to remove a notification by its ID.
 * @property {() => void} clearNotifications - Function to clear all notifications.
 */
const useNotification = () => {
  const addNotification = useNotificationStore(state => state.addNotification);
  const removeNotification = useNotificationStore(state => state.removeNotification);
  const clearNotifications = useNotificationStore(state => state.clearNotifications);

  return { addNotification, removeNotification, clearNotifications };
};

export default useNotification; 