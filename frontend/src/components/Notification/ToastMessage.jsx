import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion'; // For animations.
import styles from './ToastMessage.module.css'; // CSS Modules for styling.

/**
 * @component ToastMessage
 * @description Renders an individual toast notification with specific styling for different types (success, error, etc.),
 * an animation for appearance and disappearance, and a dismiss button.
 * It is designed to be used within a `NotificationContainer` which manages the list of toasts.
 *
 * @example
 * // Typically rendered by NotificationContainer, not directly.
 * // <ToastMessage
 * //   id="notif1"
 * //   message="Profile updated successfully!"
 * //   type="success"
 * //   onDismiss={() => handleDismiss("notif1")}
 * // />
 *
 * @param {object} props - The component's props.
 * @param {string|number} props.id - Unique identifier for the toast. Required for React key and animation.
 * @param {string} props.message - The message content to display in the toast. Required.
 * @param {'success'|'error'|'info'|'warning'} props.type - The type of toast, determining its visual style. Required.
 * @param {Function} props.onDismiss - Callback function invoked when the toast's dismiss button is clicked. Required.
 *
 * @returns {JSX.Element} The animated toast message component.
 */
const ToastMessage = ({ id, message, type, onDismiss }) => {
  // Maps notification types to their corresponding CSS Module classes for styling.
  const typeClasses = {
    success: styles.toastSuccess, // Greenish theme for success.
    error: styles.toastError,     // Reddish theme for errors.
    info: styles.toastInfo,       // Bluish theme for informational messages.
    warning: styles.toastWarning, // Yellowish theme for warnings.
  };

  return (
    // `motion.div` is a Framer Motion component that enables animations.
    <motion.div
      key={id} // Essential for `AnimatePresence` in the parent to track this specific item.
      layout // Enables smooth animation when the layout of items changes (e.g., if toasts could be reordered).
      // Animation properties for the toast's appearance:
      initial={{ opacity: 0, y: -20, scale: 0.95 }} // Starts transparent, slightly above, and scaled down.
      animate={{ opacity: 1, y: 0, scale: 1 }}      // Animates to fully opaque, original position, and full scale.
      // Animation properties for the toast's disappearance (when removed from the list):
      exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }} // Fades out, moves right, scales down.
      // Defines the physics of the enter/animate transition.
      transition={{ type: 'spring', stiffness: 300, damping: 25, duration: 0.3 }}
      // Applies base toast styling and type-specific styling. Defaults to 'info' style if type is unrecognized.
      className={`${styles.toast} ${typeClasses[type] || styles.toastInfo}`}
    >
      {/* Optional: Placeholder for an icon based on the notification type.
          Example: <span className={styles.toastIcon}>Icon</span> */}
      
      {/* Main content area of the toast. */}
      <div className={styles.toastContent}>
        <p className={styles.toastMessage}>{message}</p>
      </div>
      
      {/* Dismiss button for the toast. */}
      <button 
        onClick={onDismiss} 
        className={styles.closeButton} 
        aria-label="Dismiss notification" // Accessibility: Provides a label for screen readers.
      >
        &times; {/* Uses a simple "times" character (×) as the close icon. */}
      </button>
    </motion.div>
  );
};

// PropTypes for type-checking and component documentation.
ToastMessage.propTypes = {
  /** Unique identifier for the toast. Essential for list rendering and animation tracking. */
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** The text message to be displayed within the toast. */
  message: PropTypes.string.isRequired,
  /** Determines the visual style (color scheme) of the toast, indicating its nature (e.g., success, error). */
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning']).isRequired,
  /** Callback function that is called when the user clicks the dismiss button on the toast. */
  onDismiss: PropTypes.func.isRequired,
};

export default ToastMessage;