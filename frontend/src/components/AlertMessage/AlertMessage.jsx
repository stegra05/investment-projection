import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion'; // Import motion
// Consider adding icons later e.g. from react-icons/fa: FaExclamationCircle, FaCheckCircle, FaInfoCircle

/**
 * @component AlertMessage
 * @description A React component for displaying various types of alert messages (e.g., error, success, warning, info).
 * It supports custom titles, messages (string or React node), and additional CSS classes.
 * Error alerts feature a shake animation using `framer-motion` to draw user attention.
 *
 * @example
 * // To display an error message:
 * <AlertMessage type="error" title="Login Failed" message="Invalid username or password." />
 *
 * // To display a success message:
 * <AlertMessage type="success" message="Profile updated successfully!" />
 *
 * @param {object} props - The component's props.
 * @param {'error'|'success'|'warning'|'info'} [props.type='error'] - The type of alert, determining its styling and icon (icon future enhancement).
 * @param {string|React.ReactNode} props.message - The main content of the alert. Required.
 * @param {string} [props.title] - An optional title for the alert.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the alert container.
 *
 * @returns {JSX.Element|null} The rendered alert message component, or null if no message is provided.
 */
const AlertMessage = ({ type = 'error', message, title, className = '' }) => {
  // If no message is provided, render nothing.
  if (!message) return null;

  // Base styling classes applicable to all alert types.
  let baseClasses = 'p-4 mb-4 border rounded-md text-sm';
  // Type-specific styling classes (background, border, text color).
  let typeClasses = '';
  // let IconComponent = null; // Placeholder for icon, to be implemented later.

  switch (type) {
  case 'success':
    typeClasses = 'bg-green-50 border-green-300 text-green-700';
    // IconComponent = FaCheckCircle;
    break;
  case 'warning':
    typeClasses = 'bg-yellow-50 border-yellow-300 text-yellow-700';
    // IconComponent = FaExclamationTriangle; // Example
    break;
  case 'info':
    typeClasses = 'bg-blue-50 border-blue-300 text-blue-700';
    // IconComponent = FaInfoCircle;
    break;
  case 'error':
  default:
    typeClasses = 'bg-red-50 border-red-300 text-red-700';
    // IconComponent = FaExclamationCircle; // Example error icon
    break;
  }

  // Framer Motion variants for the shake animation, applied to 'error' type alerts.
  const errorShakeVariants = {
    initial: { x: 0 }, // Start with no horizontal translation.
    animate: { 
      x: [0, -5, 5, -5, 5, 0], // Shake sequence: center, left, right, left, right, center.
      transition: { duration: 0.4, times: [0, 0.1, 0.3, 0.5, 0.7, 1] }, // Timing for each step in the sequence.
    },
  };

  // Props to pass to the motion.div component.
  // The shake animation is only applied if the alert type is 'error'.
  const motionProps = type === 'error' ? {
    initial: 'initial',       // Corresponds to the 'initial' key in errorShakeVariants.
    animate: 'animate',       // Corresponds to the 'animate' key in errorShakeVariants.
    variants: errorShakeVariants, // The variants object defining the animation states.
  } : {}; // Empty object for non-error types, so no animation is applied.

  return (
    <motion.div 
      className={`${baseClasses} ${typeClasses} ${className}`} 
      role="alert" // ARIA role for accessibility.
      {...motionProps} // Spread motion props for animation.
    >
      {/* Placeholder for future icon integration based on alert type. */}
      {/* IconComponent && <IconComponent className="inline mr-2 h-5 w-5" /> */}
      {title && <strong className="font-bold block mb-1">{title}</strong>}
      {/* Render message as a paragraph if it's a string, otherwise render as is (e.g., for React nodes). */}
      {typeof message === 'string' ? <p>{message}</p> : message}
    </motion.div>
  );
};

// PropTypes for type-checking and component documentation.
AlertMessage.propTypes = {
  /** Defines the visual style and significance of the alert. */
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  /** The content of the alert. Can be a simple string or a more complex React node. Required. */
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  /** Optional title for the alert, displayed in bold. */
  title: PropTypes.string,
  /** Additional CSS classes to customize the alert's appearance. */
  className: PropTypes.string,
};

export default AlertMessage;