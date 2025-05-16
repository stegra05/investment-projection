import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button/Button';
import styles from './Modal.module.css'; // Import the CSS module
import Spinner from '../Spinner/Spinner'; // Import Spinner

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
  confirmButtonVariant = 'primary',
}) {
  // Effect to handle Escape key press for closing the modal
  useEffect(() => {
    const handleEsc = event => {
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

  return (
    <div
      className={styles.modalOverlay} // Use CSS module class
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div className={styles.modalContent} role="document"> 
        <h2 id="confirmation-modal-title" className={styles.modalTitle}>
          {title}
        </h2>
        <div className={styles.modalBodyText}>{children}</div>
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onClose} disabled={isConfirming}>
            {cancelText}
          </Button>
          <Button
            variant={confirmButtonVariant}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <>
                <Spinner size="h-4 w-4" color="text-white" className="mr-2" />
                {confirmText}
              </>
            ) : (
              confirmText
            )}
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
  confirmButtonVariant: PropTypes.oneOf(['primary', 'secondary', 'danger']), // Add new prop type
};

export default ConfirmationModal;
