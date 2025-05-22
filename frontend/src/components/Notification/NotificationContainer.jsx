import React from 'react';
import { AnimatePresence } from 'framer-motion';
import useNotificationStore from '../../store/notificationStore';
import ToastMessage from './ToastMessage';
import styles from './NotificationContainer.module.css';

const NotificationContainer = () => {
  const notifications = useNotificationStore(state => state.notifications);
  const removeNotification = useNotificationStore(state => state.removeNotification);

  if (!notifications.length && typeof window !== 'undefined') {
    return null;
  }

  return (
    <div className={styles.notificationContainer}>
      <AnimatePresence initial={false}>
        {notifications.map(notification => (
          <ToastMessage
            key={notification.id}
            id={notification.id}
            message={notification.message}
            type={notification.type}
            onDismiss={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationContainer; 