import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Input from '../../../components/Input/Input.jsx'; 
import Button from '../../../components/Button/Button.jsx'; 
import Spinner from '../../../components/Spinner/Spinner.jsx'; 
import AlertMessage from '../../../components/AlertMessage/AlertMessage.jsx'; // For displaying API errors.
import styles from '../../../components/Modal/Modal.module.css'; // Reusing general modal styles.

/**
 * @component CreatePortfolioModal
 * @description A modal dialog component for creating a new investment portfolio.
 * It includes input fields for the portfolio's name (required) and an optional description.
 * Handles form submission, loading states, and error display.
 * The modal automatically focuses on the name input when opened and can be closed using the Escape key.
 *
 * @example
 * <CreatePortfolioModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSubmit={handleCreatePortfolio}
 *   isLoading={isSubmitting}
 *   error={submissionError}
 * />
 *
 * @param {object} props - The component's props.
 * @param {boolean} [props.isOpen=false] - Controls the visibility of the modal.
 * @param {Function} [props.onClose=()=>{}] - Callback function invoked when the modal is requested to close.
 * @param {Function} [props.onSubmit=()=>{}] - Callback function invoked when the form is submitted with valid data.
 *                                            Receives an object `{ name: string, description: string }`.
 * @param {boolean} [props.isLoading=false] - If true, disables form elements and shows a loading indicator on the submit button.
 * @param {string|null} [props.error=null] - An error message string to display if portfolio creation fails.
 *
 * @returns {JSX.Element|null} The rendered modal component or null if `isOpen` is false.
 */
function CreatePortfolioModal({
  isOpen = false,
  onClose = () => {},
  onSubmit = () => {},
  isLoading = false,
  error = null, // Error message from parent (e.g., API call failure).
}) {
  // Local state for portfolio name and description input fields.
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Ref for the portfolio name input to manage focus.
  const nameInputRef = useRef(null);

  // `useEffect` to reset form fields and focus the name input when the modal opens.
  useEffect(() => {
    if (isOpen) {
      setName(''); // Reset name field.
      setDescription(''); // Reset description field.
      // Focus the name input shortly after the modal opens.
      // setTimeout ensures that the input is rendered and focusable.
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [isOpen]); // Dependency: run only when `isOpen` changes.

  // `useEffect` to handle the Escape key press for closing the modal.
  useEffect(() => {
    const handleEsc = event => {
      if (event.keyCode === 27) { // 27 is the Escape key.
        onClose(); // Trigger the onClose callback.
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    // Cleanup function: remove event listener when modal is closed or component unmounts.
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]); // Dependencies: effect runs if isOpen or onClose changes.

  /**
   * Handles the internal form submission.
   * Prevents default form action, performs basic validation (name is required),
   * and then calls the `onSubmit` prop with the portfolio data.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleInternalSubmit = e => {
    e.preventDefault(); // Prevent default browser form submission.
    // Basic local validation: ensure portfolio name is not empty.
    if (!name.trim()) {
      // TODO: Implement a more user-friendly way to display this specific validation error,
      // e.g., by setting a local error state for the name field.
      console.warn('Portfolio name is required.'); // Current local validation feedback.
      return; // Prevent submission if name is empty.
    }
    onSubmit({ name, description }); // Call parent's submit handler with form data.
  };

  // If the modal is not open, render nothing.
  if (!isOpen) {
    return null;
  }

  return (
    // Modal overlay: covers the screen behind the modal content.
    <div
      className={styles.modalOverlay} // Styling from shared Modal.module.css.
      role="dialog" // ARIA: Identifies the element as a dialog.
      aria-modal="true" // ARIA: Indicates that interacting with content outside the dialog is prevented.
      aria-labelledby="create-portfolio-modal-title" // ARIA: Associates dialog with its title for screen readers.
    >
      {/* Modal content container. */}
      <div className={styles.modalContent} role="document">
        {/* Modal title, linked by aria-labelledby. */}
        <h2 id="create-portfolio-modal-title" className={styles.modalTitle}>
          Create New Portfolio
        </h2>
        {/* Form for creating the portfolio. */}
        <form onSubmit={handleInternalSubmit}>
          {/* Portfolio Name input field. */}
          <div className="mb-4">
            <Input
              label="Portfolio Name"
              id="portfolioName"
              name="portfolioName"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Retirement Savings"
              required // HTML5 required attribute.
              disabled={isLoading} // Disable input during loading.
              ref={nameInputRef} // Ref for autofocus.
            />
          </div>
          {/* Portfolio Description input field (optional). */}
          <div className="mb-6">
            <Input
              label="Description (Optional)"
              id="portfolioDescription"
              name="portfolioDescription"
              type="text" 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., Long-term investments"
              disabled={isLoading}
            />
          </div>

          {/* Display any submission errors (e.g., from API) using AlertMessage. */}
          <AlertMessage type="error" message={error} className="mb-4" />

          {/* Modal footer containing action buttons. */}
          <div className={styles.modalFooter}>
            {/* Cancel button: triggers onClose and is disabled during loading. */}
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            {/* Submit button: triggers form submission, shows loading state. */}
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isLoading} // Disable button during loading.
              className="flex items-center justify-center" // For aligning spinner and text.
            >
              {isLoading ? (
                // Content when isLoading is true: Spinner + "Creating..." text.
                <>
                  <Spinner size="h-4 w-4" color="text-white" className="mr-2" />
                  Creating...
                </>
              ) : (
                // Default button text.
                'Create Portfolio'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// PropTypes for type-checking and component documentation.
CreatePortfolioModal.propTypes = {
  /** Controls whether the modal is visible or hidden. */
  isOpen: PropTypes.bool.isRequired,
  /** Function called when the user requests to close the modal (e.g., by pressing Escape or clicking the cancel button). */
  onClose: PropTypes.func.isRequired,
  /** 
   * Callback function executed upon successful form submission with valid data.
   * Receives an object: `{ name: string, description: string }`.
   */
  onSubmit: PropTypes.func.isRequired,
  /** 
   * Boolean indicating if the portfolio creation process is active (e.g., API call in progress).
   * If true, form inputs and buttons are disabled, and the submit button shows a loading state.
   */
  isLoading: PropTypes.bool,
  /** 
   * Error message string from a previous submission attempt (e.g., API error).
   * Displayed in an AlertMessage component. Null or empty if no error.
   */
  error: PropTypes.string,
};

export default CreatePortfolioModal;
