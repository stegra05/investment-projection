import { useState, useCallback } from 'react'; // Added useCallback
import portfolioService from '../../../api/portfolioService'; // API service for portfolio operations.
import usePortfolioListStore from '../../../store/portfolioListStore'; // Zustand store for global portfolio list.
import useNotificationStore from '../../../store/notificationStore'; // Zustand store for global notifications.
import {
  SUCCESS_PORTFOLIO_FIELD_UPDATED_PREFIX,
  SUCCESS_PORTFOLIO_FIELD_UPDATED_SUFFIX,
  ERROR_PORTFOLIO_UPDATE_FAILED_FALLBACK,
} from '../../../constants/textConstants'; // UI text constants.

/**
 * @hook usePortfolioEditForm
 * @description A custom React hook to manage the state and logic for an inline editing modal
 * used to update specific details of a portfolio, such as its name or description.
 * It handles modal visibility, the field being edited, the field's value, submission status,
 * and local notifications within the modal. It interacts with `portfolioService` for API calls,
 * `useNotificationStore` for global success messages, and `usePortfolioListStore` to refresh
 * the global list of portfolios upon successful update.
 *
 * @param {string|number} routePortfolioId - The ID of the portfolio currently being viewed/edited.
 *                                           This is used in API calls to identify the portfolio.
 * @param {Function} refreshPortfolio - A callback function to trigger a refresh of the current portfolio's
 *                                      detailed data (e.g., in `PortfolioContext`) after a successful update.
 *
 * @returns {object} An object containing:
 *  - `isEditModalOpen` (boolean): State indicating if the edit modal is open.
 *  - `editingField` (string|null): The name of the field currently being edited (e.g., 'name', 'description'), or null.
 *  - `editValue` (string): The current value in the edit input field.
 *  - `setEditValue` (Function): Setter for `editValue`, allowing the input to be controlled.
 *  - `isSubmitting` (boolean): True if the save operation is currently in progress.
 *  - `notification` (object): Local notification state for the modal `{ type: string, message: string }`.
 *  - `setNotification` (Function): Setter for `notification`, allowing external clearing if needed.
 *  - `handleOpenEditModal` (Function): Handler to open the edit modal for a specific field with its current value.
 *  - `handleCloseEditModal` (Function): Handler to close the edit modal and reset related state.
 *  - `handleSaveChanges` (Function): Async handler to submit the changes for the edited field.
 */
const usePortfolioEditForm = (routePortfolioId, refreshPortfolio) => {
  // State to control the visibility of the edit modal.
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // State to store which field is currently being edited (e.g., 'name' or 'description').
  const [editingField, setEditingField] = useState(null);
  // State for the current value of the input field in the modal.
  const [editValue, setEditValue] = useState('');
  // State to indicate if the save operation (API call) is in progress.
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State for displaying local notifications (e.g., error messages) within the modal.
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Get actions from Zustand stores.
  // `addNotification` for dispatching global success messages.
  const addNotification = useNotificationStore.getState().addNotification;
  // `fetchPortfolioList` to refresh the list of portfolios in the dashboard after an update.
  const fetchPortfolioList = usePortfolioListStore.getState().fetchPortfolios;

  /**
   * Opens the edit modal for a specified field and pre-fills it with the current value.
   * Clears any previous notifications.
   * @param {string} field - The name of the field to edit (e.g., 'name', 'description').
   * @param {string} currentValue - The current value of the field.
   */
  const handleOpenEditModal = useCallback((field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue);
    setIsEditModalOpen(true);
    setNotification({ type: '', message: '' }); // Clear previous local notifications when opening.
  }, []);

  /**
   * Closes the edit modal and resets related editing state.
   * Local notifications are typically cleared when the modal opens or on a successful save.
   */
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingField(null); // Reset which field was being edited.
    setEditValue('');      // Clear the edit input value.
    // The local `notification` is not cleared here by default, as it might be displaying a save error
    // which the user should see until they try again or explicitly close.
  }, []);

  /**
   * Handles the submission of changes for the currently editing field.
   * It makes an API call to update the portfolio detail, refreshes relevant data,
   * shows notifications, and manages loading/error states.
   */
  const handleSaveChanges = useCallback(async () => {
    // Guard clause: Do nothing if no field is specified for editing.
    if (!editingField) return;

    setIsSubmitting(true); // Indicate start of submission.
    setNotification({ type: '', message: '' }); // Clear previous local notifications.

    // Construct the data payload for the API update, e.g., { name: "New Name" }.
    const updateData = { [editingField]: editValue };

    try {
      // Call the API service to update portfolio details.
      await portfolioService.updatePortfolioDetails(routePortfolioId, updateData);
      
      // On successful update:
      refreshPortfolio();       // Refresh the detailed portfolio data in the current view (e.g., PortfolioContext).
      fetchPortfolioList();   // Refresh the global list of portfolios (e.g., for Dashboard).

      // Dispatch a global success notification.
      addNotification({
        type: 'success',
        // Construct a dynamic success message, e.g., "Name updated successfully."
        message: `${SUCCESS_PORTFOLIO_FIELD_UPDATED_PREFIX}${editingField.charAt(0).toUpperCase() + editingField.slice(1)}${SUCCESS_PORTFOLIO_FIELD_UPDATED_SUFFIX}`,
      });
      handleCloseEditModal(); // Close the modal on success.
    } catch (err) {
      // Handle errors from the API call.
      console.error(`Failed to update portfolio ${editingField}:`, err);
      // Set a local error notification to be displayed within the modal.
      setNotification({
        type: 'error',
        // Construct a dynamic error message, using the error from API or a fallback.
        message: `Failed to update ${editingField}: ${err.message || ERROR_PORTFOLIO_UPDATE_FAILED_FALLBACK}`,
      });
      // The modal remains open for the user to see the error, retry, or cancel.
    } finally {
      setIsSubmitting(false); // Indicate end of submission process.
    }
  }, [editingField, editValue, routePortfolioId, refreshPortfolio, fetchPortfolioList, addNotification, handleCloseEditModal]); // Dependencies for useCallback.

  // Expose state values and handlers to the consuming component.
  return {
    isEditModalOpen,      // Boolean: Is the edit modal open?
    editingField,         // String|null: Field being edited ('name', 'description').
    editValue,            // String: Current value in the modal's input.
    setEditValue,         // Function: Setter for `editValue` (for controlled input).
    isSubmitting,         // Boolean: Is save operation in progress?
    notification,         // Object: Local notification for the modal {type, message}.
    setNotification,      // Function: Setter for `notification` (e.g., to clear it externally).
    handleOpenEditModal,  // Function: Opens the modal for a specific field.
    handleCloseEditModal, // Function: Closes the modal.
    handleSaveChanges,    // Function: Submits changes.
  };
};

export default usePortfolioEditForm;