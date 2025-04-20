import { useState, useCallback } from 'react';
import assetService from '../services/assetService';

/**
 * Custom hook to manage asset-related state and actions (add, edit, delete) for a specific portfolio.
 *
 * Centralizes logic for AssetForm visibility, editing state, processing, errors, and provides async handlers.
 *
 * @param {string|number} portfolioId - The ID of the portfolio.
 * @returns {object} An object containing state variables and handler functions:
 *   - `showAssetForm` (boolean): Whether the AssetForm should be displayed.
 *   - `assetToEdit` (object|null): The asset object currently being edited.
 *   - `isProcessing` (boolean): True if an async operation is in progress.
 *   - `error` (string|null): An error message string.
 *   - `handleAddAssetClick` (Function): Opens the form to add a new asset.
 *   - `handleEditAssetClick` (Function): Opens the form to edit a specific asset.
 *   - `handleCancelAssetForm` (Function): Closes the asset form.
 *   - `handleSaveAsset` (Async Function): Saves (creates/updates) an asset. Takes assetData. Returns Promise.
 *   - `handleDeleteAsset` (Async Function): Deletes an asset. Takes asset. Returns Promise.
 */
export function useAssetManagement(portfolioId) {
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
  // Now takes assetData and performs the API call.
  const handleSaveAsset = useCallback(async (assetData) => {
      setIsProcessing(true);
      setError(null);
      try {
          if (assetToEdit) {
              // Update existing asset
              await assetService.updateAsset(portfolioId, assetToEdit.asset_id, assetData);
          } else {
              // Create new asset
              await assetService.createAsset(portfolioId, assetData);
          }
          // On success:
          setShowAssetForm(false);
          setAssetToEdit(null);
          // The calling component will handle refetching after this promise resolves.
          // No need for onMutationSuccess callback here.
      } catch (err) {
          console.error("Save asset failed:", err);
          const errorMsg = err.response?.data?.message || `Failed to ${assetToEdit ? 'update' : 'create'} asset.`;
          setError(errorMsg);
          // Re-throw the error so the calling component knows the operation failed
          throw err;
      } finally {
          setIsProcessing(false);
      }
  }, [portfolioId, assetToEdit]); // Added dependencies

  // Handle deleting an asset
  // Now takes asset and performs the API call, returns promise.
  const handleDeleteAsset = useCallback(async (asset) => {
    // Use window.confirm for simplicity, consider a modal component later
    if (window.confirm(`Are you sure you want to delete the asset "${asset.name_or_ticker}"?`)) {
      setIsProcessing(true);
      setError(null);
      try {
        await assetService.deleteAsset(portfolioId, asset.asset_id);
        // The calling component will handle refetching after this promise resolves.
        // No need for onMutationSuccess callback here.
      } catch (err) {
        console.error('Delete asset failed:', err);
        const errorMsg = err.response?.data?.message || 'Failed to delete asset.';
        setError(errorMsg);
        // Re-throw the error so the calling component knows the operation failed
        throw err;
      } finally {
        setIsProcessing(false);
      }
    } else {
      // If user cancelled confirmation, throw an error or resolve? Resolve seems less disruptive.
      // Or simply do nothing and let the promise resolve void.
      return Promise.resolve(); // Indicate cancellation didn't cause an error
    }
  }, [portfolioId]); // Added dependency

  return {
    showAssetForm,
    assetToEdit,
    isProcessing,
    error,
    handleAddAssetClick,
    handleEditAssetClick,
    handleCancelAssetForm,
    handleSaveAsset, // Now performs save and returns promise
    handleDeleteAsset, // Now performs delete and returns promise
    setError, // Expose setError for potential use in form component if needed
  };
} 