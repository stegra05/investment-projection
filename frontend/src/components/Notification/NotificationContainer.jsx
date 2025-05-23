import React from 'react';
import { AnimatePresence } from 'framer-motion'; // For animating the enter/exit of notifications.
import useNotificationStore from '../../store/notificationStore'; // Zustand store for notification state.
import ToastMessage from './ToastMessage'; // Individual toast message component.
import styles from './NotificationContainer.module.css'; // CSS Modules for styling.

/**
 * @component NotificationContainer
 * @description A container component responsible for displaying a list of toast notifications.
 * It fetches notification data from a global Zustand store (`useNotificationStore`) and
 * renders each notification as a `ToastMessage`.
 * Uses `AnimatePresence` from Framer Motion to animate the appearance and disappearance of toasts.
 * Typically, this container is placed in a fixed position on the screen (e.g., top-right)
 * to provide non-intrusive feedback to the user.
 *
 * This component does not accept any external props as it derives its state directly from the global store.
 *
 * @example
 * // Typically used once in the main application layout:
 * // <Layout>
 * //   <NotificationContainer />
 * //   <PageContent />
 * // </Layout>
 *
 * @returns {JSX.Element|null} The rendered container with animated toast messages, or null if no notifications are present.
 */
const NotificationContainer = () => {
  // Retrieve the list of current notifications from the Zustand store.
  const notifications = useNotificationStore(state => state.notifications);
  // Retrieve the function to remove a notification from the Zustand store.
  const removeNotification = useNotificationStore(state => state.removeNotification);

  // If there are no notifications, and to be safe during SSR (though primarily client-side),
  // render nothing. The `typeof window !== 'undefined'` check is often for environments
  // where `window` might not be available, though here it mainly ensures client-side logic.
  if (!notifications.length && typeof window !== 'undefined') {
    return null;
  }

  return (
    // The main container div, styled via CSS Modules to position it on the screen.
    <div className={styles.notificationContainer}>
      {/* AnimatePresence enables the animation of components when they are added or removed from the tree.
          `initial={false}` prevents animations on the initial render for items already present. */}
      <AnimatePresence initial={false}>
        {/* Map over the array of notifications and render a ToastMessage for each one. */}
        {notifications.map(notification => (
          <ToastMessage
            key={notification.id} // React key for list items.
            id={notification.id} // ID of the notification, used for dismissal.
            message={notification.message} // Content of the notification.
            type={notification.type} // Type of notification (e.g., 'success', 'error').
            onDismiss={() => removeNotification(notification.id)} // Callback to remove the notification.
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// This component does not receive props directly; its state is managed by useNotificationStore.
// Thus, PropTypes are not defined here.

export default NotificationContainer;