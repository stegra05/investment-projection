import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button/Button'; // Assuming Button component path

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
}) {
  // Effect to handle Escape key press for closing the modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // Basic Modal Styling (consider extracting to a shared CSS module or using Tailwind)
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1050, // Ensure it's above other elements, adjust if needed
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '1.5rem', // Slightly smaller padding than edit modal
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    minWidth: '320px',
    maxWidth: '500px', // Max width for confirmation
    zIndex: 1051,
  };

  return (
    <div
      style={modalOverlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div
        style={modalContentStyle}
        role="document"
      >
        <h2 id="confirmation-modal-title" className="text-lg font-semibold mb-4">
          {title}
        </h2>
        <div className="mb-6 text-sm text-gray-700">
          {children}
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isConfirming}>
            {cancelText}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isConfirming} isLoading={isConfirming}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired, // Message content
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  isConfirming: PropTypes.bool, // To show loading state on confirm button
};

export default ConfirmationModal; 