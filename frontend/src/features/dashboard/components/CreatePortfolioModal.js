import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Input from '../../../components/Input/Input'; // Assuming path is correct
import Button from '../../../components/Button/Button'; // Assuming path is correct
import Spinner from '../../../components/Spinner/Spinner'; // Import Spinner
import AlertMessage from '../../../components/AlertMessage/AlertMessage'; // Import AlertMessage
import styles from '../../../components/Modal/Modal.module.css'; // Import common modal styles

function CreatePortfolioModal({
  isOpen = false,
  onClose = () => {},
  onSubmit = () => {},
  isLoading = false,
  error = null,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [isOpen]);

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

  const handleInternalSubmit = e => {
    e.preventDefault();
    if (!name.trim()) {
      // This local validation could also use AlertMessage or a field-specific error display
      console.warn('Portfolio name is required.');
      return;
    }
    onSubmit({ name, description });
  };

  if (!isOpen) {
    return null;
  }

  return (
    // Basic Modal structure (overlay + content box)
    // Consider using a dedicated Modal component if available
    <div
      className={styles.modalOverlay} // Use CSS module class
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-portfolio-modal-title"
    >
      <div className={styles.modalContent} role="document"> {/* Use CSS module class */}
        <h2 id="create-portfolio-modal-title" className={styles.modalTitle}>{/* Use CSS module class */}
          Create New Portfolio
        </h2>
        <form onSubmit={handleInternalSubmit}>
          <div className="mb-4">
            <Input
              label="Portfolio Name"
              id="portfolioName"
              name="portfolioName"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Retirement Savings"
              required
              disabled={isLoading}
              ref={nameInputRef}
            />
          </div>
          <div className="mb-6">
            <Input
              label="Description (Optional)"
              id="portfolioDescription"
              name="portfolioDescription" // Added name prop
              type="text" 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., Long-term investments"
              disabled={isLoading}
            />
          </div>

          {/* Use AlertMessage for error display */}
          <AlertMessage type="error" message={error} className="mb-4" />

          <div className={styles.modalFooter}> {/* Use CSS module class */}
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isLoading} 
              className="flex items-center justify-center" // For spinner alignment
            >
              {isLoading ? (
                <>
                  <Spinner size="h-4 w-4" color="text-white" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Portfolio'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

CreatePortfolioModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string, // Assuming error is a string message
};

export default CreatePortfolioModal;
