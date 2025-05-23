import useNotificationStore from '../store/notificationStore'; // Importing the Zustand store for notifications.

/**
 * @hook useNotification
 * @description A custom React hook that provides a convenient API to access and utilize
 * global notification functionalities managed by the `useNotificationStore` (Zustand store).
 * This hook simplifies the process of adding, removing, and clearing notifications
 * from any component within the application.
 *
 * @returns {object} An object containing functions to interact with the notification system:
 * @property {(message: string, type?: 'success'|'error'|'info'|'warning', duration?: number) => string} addNotification - Function to add a new notification.
 *   - `message` (string): The content of the notification.
 *   - `type` (string, optional): The type of notification ('success', 'error', 'info', 'warning'). Defaults to 'info' or as defined in store.
 *   - `duration` (number, optional): Duration in milliseconds for how long the notification should be visible. Defaults as defined in store.
 *   Returns the ID (string) of the newly created notification.
 * @property {(id: string) => void} removeNotification - Function to remove a specific notification by its ID.
 *   - `id` (string): The ID of the notification to remove.
 * @property {() => void} clearNotifications - Function to remove all currently displayed notifications.
 *
 * @example
 * const { addNotification } = useNotification();
 * // In a component:
 * // addNotification('Profile updated successfully!', 'success');
 * // addNotification('An error occurred.', 'error', 5000);
 */
const useNotification = () => {
  // Select and expose the `addNotification` action from the notification store.
  const addNotification = useNotificationStore(state => state.addNotification);
  // Select and expose the `removeNotification` action from the notification store.
  const removeNotification = useNotificationStore(state => state.removeNotification);
  // Select and expose the `clearNotifications` action from the notification store.
  const clearNotifications = useNotificationStore(state => state.clearNotifications);

  // Return the selected actions for use in components.
  return { addNotification, removeNotification, clearNotifications };
};

export default useNotification;