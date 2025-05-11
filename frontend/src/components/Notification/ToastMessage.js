import React from 'react';
import PropTypes from 'prop-types';
import styles from './ToastMessage.module.css';

const ToastMessage = ({ message, type, onDismiss }) => {
  const typeClasses = {
    success: styles.toastSuccess,
    error: styles.toastError,
    info: styles.toastInfo,
    warning: styles.toastWarning,
  };

  return (
    <div className={`${styles.toast} ${typeClasses[type] || styles.toastInfo}`}>
      {/* Optional: Icon can be added here based on type */}
      {/* <span className={styles.toastIcon}>Icon</span> */}
      <div className={styles.toastContent}>
        <p className={styles.toastMessage}>{message}</p>
      </div>
      <button onClick={onDismiss} className={styles.closeButton} aria-label="Dismiss notification">
        &times; {/* Simple times character for close */}
      </button>
    </div>
  );
};

ToastMessage.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning']).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default ToastMessage; 