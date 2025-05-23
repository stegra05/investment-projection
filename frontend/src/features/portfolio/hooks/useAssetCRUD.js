import { useState } from 'react';
import portfolioService from '../../../api/portfolioService'; // API service for asset operations.
import {
  SUCCESS_ASSET_DELETED,
  SUCCESS_ASSET_UPDATED, // For post-update success notification.
  ERROR_ASSET_DELETE_FALLBACK, // Fallback error message for deletion.
} from '../../../constants/textConstants'; // UI text constants.

/**
 * @hook useAssetCRUD
 * @description A custom React hook to encapsulate logic for Create, Read, Update, Delete (CRUD)
 * operations related to assets within a specific portfolio. Currently, it primarily focuses on
 * asset deletion and handling post-update success actions (like refreshing data and showing notifications).
 * The actual creation/update forms might use this hook or parts of its logic.
 *
 * @param {object} params - Parameters for initializing the hook.
 * @param {string|number} params.portfolioId - The ID of the portfolio to which the assets belong.
 * @param {Function} params.refreshPortfolio - A callback function to refresh the portfolio data
 *                                             (e.g., re-fetch assets) after a successful CRUD operation.
 * @param {Function} params.addNotification - A callback function to display global notifications
 *                                            (e.g., from a notification store/context).
 *                                            Receives `message` (string) and `type` ('success'|'error') as arguments.
 *
 * @returns {object} An object containing:
 *  - `deleteAsset` (Function): An async function to delete an asset by its ID.
 *                              Returns `true` on success, `false` on failure.
 *  - `isDeletingAsset` (string|number|null): The ID of the asset currently being deleted, or `null` if no deletion is in progress.
 *                                            Useful for showing loading indicators on specific UI elements.
 *  - `handleAssetUpdateSuccess` (Function): A helper function to be called after an asset is successfully updated elsewhere.
 *                                           It triggers `refreshPortfolio` and shows a success notification.
 */
export const useAssetCRUD = ({ portfolioId, refreshPortfolio, addNotification }) => {
  // State to track the ID of the asset currently being deleted.
  // This allows UI to show a loading state specifically for that asset's delete button.
  const [isDeletingAsset, setIsDeletingAsset] = useState(null); 
  // Note: Specific error state for deletion is not managed locally in this hook;
  // errors are directly dispatched as notifications via `addNotification`.
  // A local error state could be added if more complex UI reactions to delete errors are needed.

  /**
   * Asynchronously deletes an asset from the portfolio.
   * Manages loading state for the specific asset being deleted and dispatches notifications.
   * @param {string|number} assetId - The ID of the asset to delete.
   * @returns {Promise<boolean>} True if deletion was successful, false otherwise.
   */
  const deleteAsset = async (assetId) => {
    // Guard clause: ensure necessary IDs are present.
    if (!portfolioId || !assetId) {
      addNotification('Portfolio or Asset ID missing. Cannot delete asset.', 'error');
      return false; // Indicate failure.
    }

    setIsDeletingAsset(assetId); // Set loading state for this specific asset ID.
    try {
      // Call the API service to delete the asset.
      await portfolioService.deleteAssetFromPortfolio(portfolioId, assetId);
      
      // If a refresh function is provided, call it to update the portfolio data.
      if (refreshPortfolio) {
        await refreshPortfolio(); // Ensure this is awaited if it's async.
      }
      
      // Dispatch a success notification.
      addNotification(SUCCESS_ASSET_DELETED, 'success');
      return true; // Indicate success.
    } catch (error) {
      // Log the full error for debugging.
      console.error('Failed to delete asset:', error);
      // Attempt to extract a user-friendly error message from the API response or error object.
      const detailMessage = error.response?.data?.detail;
      const generalApiMessage = error.response?.data?.message;
      const errorMessage = 
        detailMessage || 
        generalApiMessage || 
        error.message || 
        ERROR_ASSET_DELETE_FALLBACK; // Fallback message from constants.
      
      // Dispatch an error notification.
      addNotification(errorMessage, 'error');
      return false; // Indicate failure.
    } finally {
      setIsDeletingAsset(null); // Clear the loading state for the asset ID.
    }
  };

  /**
   * A helper function to be called after an asset has been successfully updated
   * (e.g., by an external form/modal). It triggers a portfolio refresh and
   * dispatches a success notification.
   */
  const handleAssetUpdateSuccess = () => {
    // If a refresh function is provided, call it.
    if (refreshPortfolio) {
      refreshPortfolio();
    }
    // Dispatch a success notification for the update.
    addNotification(SUCCESS_ASSET_UPDATED, 'success');
  };

  // Expose the delete function, loading state, and success handler to the consuming component.
  return {
    deleteAsset,                // Function to initiate asset deletion.
    isDeletingAsset,            // ID of the asset currently being deleted (or null).
    handleAssetUpdateSuccess,   // Handler for successful asset updates.
  };
};