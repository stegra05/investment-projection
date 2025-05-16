import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import styles from './ToastMessage.module.css';

const ToastMessage = ({ id, message, type, onDismiss }) => {
  const typeClasses = {
    success: styles.toastSuccess,
    error: styles.toastError,
    info: styles.toastInfo,
    warning: styles.toastWarning,
  };

  return (
    <motion.div
      key={id}
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, duration: 0.3 }}
      className={`${styles.toast} ${typeClasses[type] || styles.toastInfo}`}
    >
      {/* Optional: Icon can be added here based on type */}
      {/* <span className={styles.toastIcon}>Icon</span> */}
      <div className={styles.toastContent}>
        <p className={styles.toastMessage}>{message}</p>
      </div>
      <button onClick={onDismiss} className={styles.closeButton} aria-label="Dismiss notification">
        &times; {/* Simple times character for close */}
      </button>
    </motion.div>
  );
};

ToastMessage.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning']).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default ToastMessage; 