import React from 'react';
import PropTypes from 'prop-types';
// Consider adding icons later e.g. from react-icons/fa: FaExclamationCircle, FaCheckCircle, FaInfoCircle

const AlertMessage = ({ type = 'error', message, title, className = '' }) => {
  if (!message) return null;

  let baseClasses = 'p-4 mb-4 border rounded-md text-sm';
  let typeClasses = '';
  // let IconComponent = null; // Placeholder for icon

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
    // IconComponent = FaExclamationCircle;
    break;
  }

  return (
    <div className={`${baseClasses} ${typeClasses} ${className}`} role="alert">
      {/* IconComponent && <IconComponent className="inline mr-2 h-5 w-5" /> */}
      {title && <strong className="font-bold block mb-1">{title}</strong>}
      {typeof message === 'string' ? <p>{message}</p> : message}
    </div>
  );
};

AlertMessage.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  title: PropTypes.string,
  className: PropTypes.string,
};

export default AlertMessage; 