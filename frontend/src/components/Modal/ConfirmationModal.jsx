import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button/Button.jsx';
import styles from './Modal.module.css'; // Import the CSS module for styling.
import Spinner from '../Spinner/Spinner.jsx'; // Spinner for loading state.

/**
 * @component ConfirmationModal
 * @description A modal dialog component that prompts the user for confirmation before performing a critical action.
 * It features customizable title, message content (children), confirm/cancel button text,
 * a loading state for the confirm button (useful for async operations), and different visual variants for the confirm button.
 * The modal can be closed by clicking the cancel button, pressing the Escape key, or programmatically.
 * Accessibility is supported via ARIA attributes.
 *
 * @example
 * <ConfirmationModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onConfirm={handleDeleteItem}
 *   title="Delete Item?"
 *   confirmText="Yes, Delete"
 *   cancelText="No, Keep it"
 *   isConfirming={isDeleting}
 *   confirmButtonVariant="danger"
 * >
 *   Are you sure you want to delete this item? This action cannot be undone.
 * </ConfirmationModal>
 *
 * @param {object} props - The component's props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal. Required.
 * @param {Function} props.onClose - Callback function invoked when the modal is requested to close (e.g., Escape key, cancel button). Required.
 * @param {Function} props.onConfirm - Callback function invoked when the confirm button is clicked. Required.
 * @param {string} [props.title='Confirm Action'] - The title displayed at the top of the modal.
 * @param {React.ReactNode} props.children - The main content/message of the modal. Required.
 * @param {string} [props.confirmText='Confirm'] - Text for the confirmation button.
 * @param {string} [props.cancelText='Cancel'] - Text for the cancel button.
 * @param {boolean} [props.isConfirming=false] - If true, disables buttons and shows a spinner on the confirm button.
 * @param {'primary'|'secondary'|'danger'} [props.confirmButtonVariant='primary'] - Visual variant for the confirm button.
 *
 * @returns {JSX.Element|null} The rendered modal component or null if `isOpen` is false.
 */
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  children, // Message content, typically a string or paragraph elements.
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false, // Indicates if the confirm action is in progress.
  confirmButtonVariant = 'primary', // Default variant for the confirm button.
}) {
  // Effect to handle the Escape key press for closing the modal.
  // Adds an event listener when the modal is open and cleans it up when closed or component unmounts.
  useEffect(() => {
    const handleEsc = event => {
      // keyCode 27 is the Escape key.
      if (event.keyCode === 27) {
        onClose(); // Trigger the onClose callback.
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    // Cleanup function: remove the event listener when the modal is closed or the component unmounts.
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]); // Dependencies: effect runs if isOpen or onClose changes.

  // If the modal is not open, render nothing.
  if (!isOpen) {
    return null;
  }

  // Main modal structure with ARIA attributes for accessibility.
  return (
    <div
      className={styles.modalOverlay} // Applies overlay styling from CSS Modules.
      role="dialog" // ARIA: Identifies the element as a dialog.
      aria-modal="true" // ARIA: Indicates that interacting with content outside the dialog is prevented.
      aria-labelledby="confirmation-modal-title" // ARIA: Associates the dialog with its title for screen readers.
    >
      {/* Modal content container with ARIA role "document" for nested browsing contexts. */}
      <div className={styles.modalContent} role="document"> 
        {/* Modal title, linked by aria-labelledby. */}
        <h2 id="confirmation-modal-title" className={styles.modalTitle}>
          {title}
        </h2>
        {/* Modal body, where the children (message content) are rendered. */}
        <div className={styles.modalBodyText}>{children}</div>
        {/* Modal footer containing action buttons. */}
        <div className={styles.modalFooter}>
          {/* Cancel button: uses a secondary variant and is disabled during confirmation. */}
          <Button variant="secondary" onClick={onClose} disabled={isConfirming}>
            {cancelText}
          </Button>
          {/* Confirm button: variant is customizable, disabled and shows spinner during confirmation. */}
          <Button
            variant={confirmButtonVariant}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? (
              // Content when isConfirming is true: Spinner + confirmText.
              <>
                <Spinner size="h-4 w-4" color="text-white" className="mr-2" />
                {confirmText}
              </>
            ) : (
              // Content when not confirming: just confirmText.
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// PropTypes for type-checking and component documentation.
ConfirmationModal.propTypes = {
  /** Controls whether the modal is visible or hidden. */
  isOpen: PropTypes.bool.isRequired,
  /** Function called when the user requests to close the modal (e.g., by pressing Escape or clicking the cancel button). */
  onClose: PropTypes.func.isRequired,
  /** Function called when the user clicks the confirm button. */
  onConfirm: PropTypes.func.isRequired,
  /** The title displayed at the top of the modal. */
  title: PropTypes.string,
  /** The main content/message of the modal, rendered in the modal body. Can be a string or any React node. */
  children: PropTypes.node.isRequired,
  /** Text label for the confirm button. */
  confirmText: PropTypes.string,
  /** Text label for the cancel button. */
  cancelText: PropTypes.string,
  /** If true, both buttons are disabled, and a spinner is shown on the confirm button. Useful for async operations. */
  isConfirming: PropTypes.bool,
  /** Visual variant for the confirm button (e.g., 'primary', 'danger'). */
  confirmButtonVariant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
};

export default ConfirmationModal;
