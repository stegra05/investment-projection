import { create } from 'zustand'; // Zustand library for state management.
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for notifications.

/**
 * @file notificationStore.js
 * @description Zustand store for managing global UI notifications (toasts/alerts).
 * This store maintains a list of active notifications and provides actions to add,
 * remove, and clear them. Added notifications can have an automatic dismissal timer.
 */

/** 
 * Default visibility duration for notifications in milliseconds (e.g., 5000ms = 5 seconds).
 * @type {number} 
 */
const defaultDuration = 5000;

/**
 * @store useNotificationStore
 * @description Zustand store definition for managing global UI notifications.
 *
 * @property {Array<object>} notifications - An array holding all active notification objects.
 *   Each notification object typically has:
 *   - `id` (string): Unique identifier.
 *   - `message` (string): The content of the notification.
 *   - `type` (string): Type of notification (e.g., 'info', 'success', 'error', 'warning'), used for styling.
 *   - `duration` (number, optional): Time in milliseconds after which the notification should auto-dismiss.
 *
 * @action addNotification - Adds a new notification to the store and sets a timer for auto-dismissal if duration is provided.
 * @action removeNotification - Removes a specific notification from the store by its ID.
 * @action clearNotifications - Removes all notifications from the store.
 */
const useNotificationStore = create((set, get) => ({
  /** 
   * @property {Array<object>} notifications 
   * @description Array of active notification objects. Each object should include
   * `id`, `message`, `type`, and optionally `duration`.
   */
  notifications: [],

  /**
   * Adds a new notification to the list and optionally sets a timer for its auto-dismissal.
   * @param {string} message - The content/message of the notification.
   * @param {'info'|'success'|'error'|'warning'} [type='info'] - The type of the notification, influencing its appearance.
   * @param {number} [duration=defaultDuration] - The duration (in milliseconds) after which the notification
   *                                              should automatically be removed. If 0 or null, it might persist
   *                                              (though current logic always sets timeout if duration is truthy).
   * @returns {string} The unique ID of the newly added notification.
   */
  addNotification: (message, type = 'info', duration = defaultDuration) => {
    const id = uuidv4(); // Generate a unique ID for the notification.
    // Add the new notification to the existing array of notifications in the store state.
    set(state => ({ 
      notifications: [...state.notifications, { id, message, type, duration }] 
    }));

    // If a duration is provided (and is not 0 or null), set a timeout to auto-remove the notification.
    if (duration) {
      setTimeout(() => {
        // Use get() to access the latest version of removeNotification, especially if actions modify each other.
        get().removeNotification(id); 
      }, duration);
    }
    return id; // Return the ID, useful if manual removal control is needed by the caller.
  },

  /**
   * Removes a specific notification from the list by its unique ID.
   * @param {string} id - The unique ID of the notification to be removed.
   */
  removeNotification: (id) => {
    // Update the notifications state by filtering out the notification with the matching ID.
    set(state => ({ 
      notifications: state.notifications.filter(n => n.id !== id) 
    }));
  },

  /**
   * Clears all currently active notifications from the list.
   */
  clearNotifications: () => {
    // Reset the notifications array to an empty array.
    set({ notifications: [] });
  },
}));

// Export the Zustand store hook for use in components or other hooks.
export default useNotificationStore;