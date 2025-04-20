import { useState, useCallback } from 'react';
import assetService from '../services/assetService';

/**
 * Custom hook to manage asset-related state and actions (add, edit, delete) for a specific portfolio.
 *
 * This hook centralizes the logic for handling the AssetForm visibility, the asset being edited,
 * processing states, errors, and provides callback handlers for triggering these actions.
 *
 * @param {string|number} portfolioId - The ID of the portfolio these assets belong to.
 * @param {Function} onMutationSuccess - Callback function to execute after a successful
 *                                       create, update, or delete operation (e.g., to refetch portfolio data).
 * @returns {object} An object containing state variables and handler functions:
 *   - `showAssetForm` (boolean): Whether the AssetForm should be displayed.
 *   - `assetToEdit` (object|null): The asset object currently being edited, or null if adding a new asset.
 *   - `isProcessing` (boolean): True if an asynchronous operation (like delete) is in progress.
 *   - `error` (string|null): An error message string if an operation failed, otherwise null.
 *   - `handleAddAssetClick` (Function): Opens the form to add a new asset.
 *   - `handleEditAssetClick` (Function): Opens the form to edit a specific asset.
 *   - `handleCancelAssetForm` (Function): Closes the asset form.
 *   - `handleSaveAsset` (Function): Placeholder callback intended to be called by AssetForm upon successful save.
 *                                    It resets the form state and triggers `onMutationSuccess`.
 *   - `handleDeleteAsset` (Function): Initiates the deletion process for a specific asset, including confirmation.
 */
export function useAssetManagement(portfolioId, onMutationSuccess) {
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // To disable buttons during API calls
  const [error, setError] = useState(null);

  // Show form to add a new asset
  const handleAddAssetClick = useCallback(() => {
    setAssetToEdit(null);
    setShowAssetForm(true);
    setError(null); // Clear previous errors
  }, []);

  // Show form to edit an existing asset
  const handleEditAssetClick = useCallback((asset) => {
    setAssetToEdit(asset);
    setShowAssetForm(true);
    setError(null); // Clear previous errors
  }, []);

  // Cancel/close the form
  const handleCancelAssetForm = useCallback(() => {
    setShowAssetForm(false);
    setAssetToEdit(null);
    setError(null); // Clear error when cancelling
  }, []);

  // Handle saving (create or update)
  // This function will be passed to the AssetForm component's onSaved prop
  const handleSaveAsset = useCallback(async () => {
      // The actual saving logic is inside AssetForm, which calls this on success.
      // We just need to handle the state update and callback here.
      setIsProcessing(true); // Optional: Could be set in AssetForm too
      setError(null);
      try {
          // AssetForm handles the actual API call (create/update)
          // Once AssetForm calls its `onSaved` prop (which points to this), we know it succeeded.
          setShowAssetForm(false);
          setAssetToEdit(null);
          if (onMutationSuccess) {
            await onMutationSuccess(); // Re-fetch portfolio data
          }
      } catch (err) { // This catch block might be redundant if AssetForm handles its own errors
          console.error("Error signal from save handler (should be caught in form ideally):", err);
          setError('An unexpected error occurred during save.'); // Generic error
      } finally {
          setIsProcessing(false);
      }
  }, [onMutationSuccess]);

  // Handle deleting an asset
  const handleDeleteAsset = useCallback(async (asset) => {
    // Use window.confirm for simplicity, consider a modal component later
    if (window.confirm(`Are you sure you want to delete the asset "${asset.name_or_ticker}"?`)) {
      setIsProcessing(true);
      setError(null);
      try {
        await assetService.deleteAsset(portfolioId, asset.asset_id);
        if (onMutationSuccess) {
          await onMutationSuccess(); // Re-fetch portfolio data
        }
      } catch (err) {
        console.error('Delete asset failed:', err);
        setError(err.response?.data?.message || 'Failed to delete asset.');
        // Potentially show error to user via toast/notification
      } finally {
        setIsProcessing(false);
      }
    }
  }, [portfolioId, onMutationSuccess]);

  return {
    showAssetForm,
    assetToEdit,
    isProcessing,
    error,
    handleAddAssetClick,
    handleEditAssetClick,
    handleCancelAssetForm,
    handleSaveAsset, // This is the callback for AssetForm's success
    handleDeleteAsset,
    // No need to return setError usually, handle errors internally or via specific feedback
  };
} 