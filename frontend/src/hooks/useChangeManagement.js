import { useState, useCallback } from 'react';
// import axios from 'axios'; // Use apiClient instead
import apiClient from '../services/apiClient'; // Import the shared apiClient

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'; // Handled by apiClient

/**
 * Custom hook to manage planned future change-related state and actions (add, edit, delete) for a specific portfolio.
 *
 * Manages ChangeForm visibility, editing state, processing, errors, and provides async handlers.
 *
 * @param {string|number} portfolioId - The ID of the portfolio.
 * @returns {object} An object containing state variables and handler functions:
 *   - `showChangeForm` (boolean): Whether the ChangeForm should be displayed.
 *   - `changeToEdit` (object|null): The change object currently being edited.
 *   - `isProcessing` (boolean): True if an async operation is in progress.
 *   - `error` (string|null): An error message string.
 *   - `handleAddChangeClick` (Function): Opens the form to add a new change.
 *   - `handleEditChangeClick` (Function): Opens the form to edit a specific change.
 *   - `handleCancelChangeForm` (Function): Closes the change form.
 *   - `handleSaveChange` (Async Function): Saves (creates/updates) a change. Takes changeData. Returns Promise.
 *   - `handleDeleteChange` (Async Function): Deletes a change. Takes change. Returns Promise.
 */
export function useChangeManagement(portfolioId) {
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [changeToEdit, setChangeToEdit] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  // Removed token, apiClient handles auth

  // Show form to add a new change
  const handleAddChangeClick = useCallback(() => {
    setChangeToEdit(null);
    setShowChangeForm(true);
    setError(null);
  }, []);

  // Show form to edit an existing change
  const handleEditChangeClick = useCallback((change) => {
    setChangeToEdit(change);
    setShowChangeForm(true);
    setError(null);
  }, []);

  // Cancel/close the form
  const handleCancelChangeForm = useCallback(() => {
    setShowChangeForm(false);
    setChangeToEdit(null);
    setError(null);
  }, []);

  // Handle saving (create or update)
  // Now takes changeData and performs the API call using apiClient.
  const handleSaveChange = useCallback(async (changeData) => {
    setIsProcessing(true);
    setError(null);
    try {
      if (changeToEdit) {
        // Update existing change
        await apiClient.put(`/portfolios/${portfolioId}/changes/${changeToEdit.change_id}`, changeData);
      } else {
        // Create new change
        await apiClient.post(`/portfolios/${portfolioId}/changes`, changeData);
      }
      // On success:
      setShowChangeForm(false);
      setChangeToEdit(null);
      // Calling component handles refetching after promise resolves.
    } catch (err) {
      console.error("Save change failed:", err);
      const errorMsg = err.response?.data?.message || `Failed to ${changeToEdit ? 'update' : 'create'} change.`;
      setError(errorMsg);
      // Re-throw the error so the calling component knows the operation failed
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [portfolioId, changeToEdit]);

  // Handle deleting a change
  // Now takes change and performs the API call, returns promise.
  const handleDeleteChange = useCallback(async (change) => {
    // Construct a user-friendly description for the confirmation
    const changeDescription = `${change.change_type} ${change.amount ? `of ${change.amount}` : ''} ${change.description ? `(${change.description})` : ''}`;

    if (window.confirm(`Are you sure you want to delete the change "${changeDescription}" scheduled for ${change.change_date}?`)) {
      setIsProcessing(true);
      setError(null);
      try {
        // Use apiClient which includes base URL and auth header
        await apiClient.delete(`/portfolios/${portfolioId}/changes/${change.change_id}`);
        // Calling component handles refetching after promise resolves.
      } catch (err) {
        console.error('Delete change failed:', err);
        const errorMsg = err.response?.data?.message || 'Failed to delete planned change.';
        setError(errorMsg);
        // Re-throw the error so the calling component knows the operation failed
        throw err;
      } finally {
        setIsProcessing(false);
      }
    } else {
        // If user cancelled confirmation, resolve void
        return Promise.resolve();
    }
  }, [portfolioId]);

  return {
    showChangeForm,
    changeToEdit,
    isProcessing,
    error,
    handleAddChangeClick,
    handleEditChangeClick,
    handleCancelChangeForm,
    handleSaveChange,
    handleDeleteChange,
    setError,
  };
} 