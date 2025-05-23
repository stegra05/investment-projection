import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion'; // For modal appearance/disappearance animation.
import ConfirmationModal from '../../../components/Modal/ConfirmationModal'; // Base modal structure.
import Input from '../../../components/Input/Input'; // Reusable Input component.
import AlertMessage from '../../../components/AlertMessage/AlertMessage'; // For displaying notifications.
import {
  PLACEHOLDER_PORTFOLIO_DESCRIPTION,
  PLACEHOLDER_PORTFOLIO_NAME,
} from '../../../constants/textConstants'; // UI text constants for placeholders.

/**
 * @component EditPortfolioDetailModal
 * @description A modal dialog component used for editing specific details of a portfolio,
 * such as its name or description. It dynamically adapts the input field based on the
 * `editingField` prop. The modal uses `ConfirmationModal` for its base structure and
 * includes an `Input` field for editing. It's animated using `framer-motion`.
 *
 * @example
 * const [isModalOpen, setIsModalOpen] = useState(false);
 * const [editValue, setEditValue] = useState('');
 * const [editingField, setEditingField] = useState('name'); // or 'description'
 * // ... other state for submitting, notification
 *
 * <EditPortfolioDetailModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSave={handleSaveChanges}
 *   editingField={editingField}
 *   editValue={editValue}
 *   setEditValue={setEditValue}
 *   isSubmitting={isSaving}
 *   notification={saveNotification}
 * />
 *
 * @param {object} props - The component's props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal. Required.
 * @param {Function} props.onClose - Callback function to close the modal. Required.
 * @param {Function} props.onSave - Callback function to save the edited value. Called when the confirm button in `ConfirmationModal` is clicked. Required.
 * @param {'name'|'description'} props.editingField - Specifies which portfolio detail is being edited ('name' or 'description'). Required.
 * @param {string} props.editValue - The current value of the field being edited. Controlled by parent. Required.
 * @param {Function} props.setEditValue - Callback function to update `editValue` in the parent component. Required.
 * @param {boolean} props.isSubmitting - If true, indicates the save operation is in progress (disables confirm button, shows loading text). Required.
 * @param {object} props.notification - An object to display notifications within the modal, e.g., `{ type: 'error', message: 'Save failed' }`. Required.
 *
 * @returns {JSX.Element|null} The rendered modal for editing a portfolio detail, or null if `isOpen` is false.
 */
const EditPortfolioDetailModal = ({
  isOpen,
  onClose,
  onSave,
  editingField, // Determines if editing 'name' or 'description'.
  editValue,      // Current value of the field being edited.
  setEditValue,   // Function to update the editValue.
  isSubmitting,   // True if the save operation is in progress.
  notification,   // Object for displaying notifications: { type: 'success'|'error', message: string }.
}) => {
  // If the modal is not open, render nothing.
  // AnimatePresence handles the exit animation, so isOpen check here is also for logic.
  if (!isOpen) return null;

  // Dynamically determine the label for the input field based on `editingField`.
  const fieldLabel = editingField === 'name' ? 'Portfolio Name' : 'Portfolio Description';
  // Dynamically determine the input type ('text' or 'textarea') based on `editingField`.
  const inputType = editingField === 'description' ? 'textarea' : 'text';
  // Dynamically set placeholder text using constants.
  const placeholder = 
    editingField === 'description'
      ? PLACEHOLDER_PORTFOLIO_DESCRIPTION || 'Add a description...'
      : editingField === 'name'
        ? PLACEHOLDER_PORTFOLIO_NAME || 'Enter portfolio name'
        : ''; // Default empty placeholder if field is somehow unknown.

  return (
    // AnimatePresence enables enter/exit animations for the modal.
    <AnimatePresence>
      {isOpen && ( // Conditionally render the modal based on the isOpen prop.
        // motion.div for the modal overlay, with fade and scale animation.
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} // Initial animation state (hidden).
          animate={{ opacity: 1, scale: 1 }}    // Animate to visible state.
          exit={{ opacity: 0, scale: 0.95 }}     // Animate to hidden on exit.
          transition={{ duration: 0.2 }}        // Animation duration.
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" // Styling for overlay.
        >
          {/* Use ConfirmationModal as the base structure for the dialog. */}
          <ConfirmationModal
            isOpen={isOpen} // This prop mainly controls internal elements of ConfirmationModal now, as AnimatePresence handles overall visibility.
            onClose={onClose} // Pass through the onClose handler.
            onConfirm={onSave} // Pass through the onSave handler (ConfirmationModal calls it onConfirm).
            // Dynamically set the modal title based on the field being edited.
            title={`Edit ${editingField.charAt(0).toUpperCase() + editingField.slice(1)}`}
            // Confirm button text changes based on submission state.
            confirmText={isSubmitting ? 'Saving...' : 'Save Changes'}
            isConfirming={isSubmitting} // Propagates loading state to ConfirmationModal's confirm button.
          >
            {/* Content passed as children to ConfirmationModal. */}
            <div className="my-4">
              {/* Display notification messages (e.g., save errors) if present. */}
              {notification && notification.message && (
                <div className="mb-3">
                  <AlertMessage type={notification.type} message={notification.message} />
                </div>
              )}
              {/* Input field for editing the portfolio detail. */}
              <Input
                label={fieldLabel} // Dynamic label.
                type={inputType}   // Dynamic input type ('text' or 'textarea').
                id={`edit-${editingField}`} // Unique ID for the input.
                name={`edit-${editingField}`} // Name for the input.
                value={editValue} // Controlled input value.
                onChange={(e) => setEditValue(e.target.value)} // Update parent's state on change.
                rows={editingField === 'description' ? 4 : undefined} // Set rows for textarea.
                placeholder={placeholder} // Dynamic placeholder.
                // autofocus // Consider adding autofocus to the input when modal opens.
                // Add any necessary ARIA attributes or classes for styling if needed.
              />
            </div>
          </ConfirmationModal>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Define PropTypes for type-checking and component documentation.
EditPortfolioDetailModal.propTypes = {
  /** Controls whether the modal is currently open or hidden. */
  isOpen: PropTypes.bool.isRequired,
  /** Callback function to be invoked when the modal is requested to be closed (e.g., by backdrop click or cancel button). */
  onClose: PropTypes.func.isRequired,
  /** Callback function to be invoked when the user confirms the changes (clicks the "Save Changes" button). */
  onSave: PropTypes.func.isRequired,
  /** Specifies which portfolio detail is being edited. Must be either 'name' or 'description'. */
  editingField: PropTypes.oneOf(['name', 'description']).isRequired,
  /** The current value of the field being edited. This is a controlled component prop. */
  editValue: PropTypes.string.isRequired,
  /** Callback function to update the `editValue` in the parent component's state when the input changes. */
  setEditValue: PropTypes.func.isRequired,
  /** Boolean indicating if the save operation is currently in progress. Used to show loading states. */
  isSubmitting: PropTypes.bool.isRequired,
  /** 
   * An object for displaying notifications (e.g., success or error messages) within the modal.
   * Expected shape: `{ type: string (e.g., 'success', 'error'), message: string }`.
   * The `message` property should be non-empty for the notification to display.
   */
  notification: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string,
  }).isRequired,
};

export default EditPortfolioDetailModal;