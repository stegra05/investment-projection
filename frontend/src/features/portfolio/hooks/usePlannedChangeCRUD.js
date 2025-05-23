import portfolioService from '../../../api/portfolioService'; // API service for planned change operations.
import {
  SUCCESS_PLANNED_CHANGE_SAVED,
  SUCCESS_PLANNED_CHANGE_DELETED,
  ERROR_PLANNED_CHANGE_SAVE_FALLBACK,
  ERROR_PLANNED_CHANGE_DELETE_FALLBACK,
} from '../../../constants/textConstants'; // UI text constants for notifications.

/**
 * @hook usePlannedChangeCRUD
 * @description A custom React hook that provides functions for Create, Update, and Delete (CRUD)
 * operations for planned financial changes within a specific portfolio.
 * It handles interactions with the `portfolioService`, manages notifications,
 * and triggers data refresh callbacks upon successful operations.
 *
 * @param {object} params - Parameters for initializing the hook.
 * @param {string|number} params.portfolioId - The ID of the portfolio to which the planned changes belong.
 * @param {Function} params.refreshPortfolio - A callback function to refresh the portfolio data
 *                                             (e.g., re-fetch planned changes) after a successful CRUD operation.
 * @param {Function} params.addNotification - A callback function to display global notifications
 *                                            (e.g., from a notification store/context).
 *                                            Receives `message` (string) and `type` ('success'|'error') as arguments.
 *
 * @returns {object} An object containing:
 *  - `savePlannedChange` (Function): An async function to save (create or update) a planned change.
 *                                    Throws an error on failure to allow calling component to handle.
 *  - `deletePlannedChange` (Function): An async function to delete a planned change by its ID.
 *                                     Returns `true` on success, `false` on failure.
 */
export const usePlannedChangeCRUD = ({ portfolioId, refreshPortfolio, addNotification }) => {
  /**
   * Saves a planned change. Handles both creating new changes and updating existing ones.
   * @param {object} changeDataFromPanel - The planned change data from the form/panel.
   *                                       If `id` is present, it's an update; otherwise, it's a create.
   * @throws {Error} Throws an error if the save operation fails, allowing the calling component to handle it.
   */
  const savePlannedChange = async (changeDataFromPanel) => {
    // Guard clause: Ensure portfolioId is available.
    if (!portfolioId) {
      const errorMsg = 'Portfolio ID not loaded. Cannot save planned change.';
      addNotification(errorMsg, 'error'); // Dispatch error notification.
      throw new Error(errorMsg); // Re-throw for the calling component (e.g., a form) to handle.
    }

    // Create a mutable copy of the data from the panel.
    const dataToSend = { ...changeDataFromPanel };
    // Determine if this is an update operation based on the presence of an ID.
    const isUpdating = !!dataToSend.id;

    try {
      if (isUpdating) {
        // For updates, call the updatePlannedChange service method.
        const changeId = dataToSend.id;
        await portfolioService.updatePlannedChange(portfolioId, changeId, dataToSend);
      } else {
        // For creates, remove any 'id' property (as it's backend-generated) and call addPlannedChange.
        // eslint-disable-next-line no-unused-vars
        const { id, ...addData } = dataToSend; // Destructure to exclude 'id' if present.
        await portfolioService.addPlannedChange(portfolioId, addData);
      }
      
      // If a refresh function is provided, call it to update the UI.
      if (refreshPortfolio) {
        await refreshPortfolio(); // Ensure this is awaited if it's async.
      }
      // Dispatch a success notification.
      addNotification(SUCCESS_PLANNED_CHANGE_SAVED, 'success');
    } catch (apiError) {
      // Handle errors from the API call.
      console.error('Failed to save planned change:', apiError);
      // Extract a user-friendly error message from the API response or error object.
      const errorMessage = 
        apiError.response?.data?.message || 
        apiError.response?.data?.detail || // FastAPI often uses 'detail' for errors.
        apiError.message || 
        ERROR_PLANNED_CHANGE_SAVE_FALLBACK; // Fallback message.
      
      addNotification(errorMessage, 'error'); // Dispatch error notification.
      throw apiError; // Re-throw the original error to allow the calling component to perform further actions (e.g., keep a modal open).
    }
  };

  /**
   * Deletes a planned change by its ID.
   * @param {string|number} changeId - The ID of the planned change to delete.
   * @returns {Promise<boolean>} True if deletion was successful, false otherwise.
   */
  const deletePlannedChange = async (changeId) => {
    // Guard clause: Ensure portfolioId is available.
    if (!portfolioId) {
      addNotification('Portfolio not loaded. Cannot delete planned change.', 'error');
      return false; // Return false; typically delete actions might not need to throw for UI flow.
    }
    // Guard clause: Ensure changeId is provided.
    if (!changeId) {
      addNotification('Change ID missing. Cannot delete planned change.', 'error');
      return false;
    }

    try {
      // Call the API service to delete the planned change.
      await portfolioService.deletePlannedChange(portfolioId, changeId);
      
      // If a refresh function is provided, call it.
      if (refreshPortfolio) {
        await refreshPortfolio();
      }
      // Dispatch a success notification.
      addNotification(SUCCESS_PLANNED_CHANGE_DELETED, 'success');
      return true; // Indicate success.
    } catch (apiError) {
      // Handle errors from the API call.
      console.error('Failed to delete planned change:', apiError);
      const errorMessage = 
        apiError.response?.data?.message || 
        apiError.response?.data?.detail || 
        apiError.message || 
        ERROR_PLANNED_CHANGE_DELETE_FALLBACK;
      
      addNotification(errorMessage, 'error');
      // Optional: Re-throw if the caller needs to specifically handle the error beyond a notification.
      // For simple UI delete buttons, just returning false might be sufficient.
      // throw apiError; 
      return false; // Indicate failure.
    }
  };

  // Expose the CRUD functions to the consuming component.
  return {
    savePlannedChange,    // Function to save (create or update) a planned change.
    deletePlannedChange,  // Function to delete a planned change.
  };
};