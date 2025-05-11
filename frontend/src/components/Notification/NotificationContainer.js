import React from 'react';
import useNotificationStore from '../../store/notificationStore';
import ToastMessage from './ToastMessage';
import styles from './NotificationContainer.module.css';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotificationStore(state => ({
    notifications: state.notifications,
    removeNotification: state.removeNotification,
  }));

  if (!notifications.length) {
    return null;
  }

  return (
    <div className={styles.notificationContainer}>
      {notifications.map(notification => (
        <ToastMessage
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationContainer; 