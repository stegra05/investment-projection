import { useState, useCallback } from 'react';
// import axios from 'axios'; // Use apiClient instead
import apiClient from '../services/apiClient'; // Import the shared apiClient

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'; // Handled by apiClient

/**
 * Custom hook to manage planned future change-related state and actions (add, edit, delete) for a specific portfolio.
 *
 * Similar to useAssetManagement, this hook manages the ChangeForm visibility, the change being edited,
 * processing states, errors, and provides callback handlers for triggering these actions.
 *
 * @param {string|number} portfolioId - The ID of the portfolio these changes belong to.
 * @param {Function} onMutationSuccess - Callback function to execute after a successful
 *                                       create, update, or delete operation (e.g., to refetch portfolio data).
 * @returns {object} An object containing state variables and handler functions:
 *   - `showChangeForm` (boolean): Whether the ChangeForm should be displayed.
 *   - `changeToEdit` (object|null): The change object currently being edited, or null if adding a new change.
 *   - `isProcessing` (boolean): True if an asynchronous operation (like delete) is in progress.
 *   - `error` (string|null): An error message string if an operation failed, otherwise null.
 *   - `handleAddChangeClick` (Function): Opens the form to add a new change.
 *   - `handleEditChangeClick` (Function): Opens the form to edit a specific change.
 *   - `handleCancelChangeForm` (Function): Closes the change form.
 *   - `handleSaveChange` (Function): Placeholder callback intended to be called by ChangeForm upon successful save.
 *                                    It resets the form state and triggers `onMutationSuccess`.
 *   - `handleDeleteChange` (Function): Initiates the deletion process for a specific change, including confirmation.
 */
export function useChangeManagement(portfolioId, onMutationSuccess) {
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [changeToEdit, setChangeToEdit] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token'); // Get token for API calls

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
  // Passed to ChangeForm's onSaved prop
  const handleSaveChange = useCallback(async () => {
    // Logic is similar to useAssetManagement - form handles API call
    setIsProcessing(true);
    setError(null);
    try {
      // ChangeForm calls its `onSaved` prop (this function) on success.
      setShowChangeForm(false);
      setChangeToEdit(null);
      if (onMutationSuccess) {
        await onMutationSuccess(); // Re-fetch portfolio data
      }
    } catch (err) {
      console.error("Error signal from change save handler:", err);
      setError('An unexpected error occurred while saving the change.');
    } finally {
      setIsProcessing(false);
    }
  }, [onMutationSuccess]);

  // Handle deleting a change
  const handleDeleteChange = useCallback(async (change) => {
    // No need to check token explicitly, apiClient interceptor handles it.
    // if (!token) {
    //     alert('Authentication error. Please log in again.'); // Simple alert
    //     return;
    // }
    // Construct a user-friendly description for the confirmation
    const changeDescription = `${change.change_type} ${change.amount ? `of ${change.amount}` : ''} ${change.description ? `(${change.description})` : ''}`;
    if (window.confirm(`Are you sure you want to delete the change "${changeDescription}" scheduled for ${change.change_date}?`)) {
      setIsProcessing(true);
      setError(null);
      try {
        // Use apiClient which includes base URL and auth header
        await apiClient.delete(`/portfolios/${portfolioId}/changes/${change.change_id}`);
        // await axios.delete(`${API_URL}/portfolios/${portfolioId}/changes/${change.change_id}`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        if (onMutationSuccess) {
          await onMutationSuccess(); // Re-fetch portfolio data
        }
      } catch (err) {
        console.error('Delete change failed:', err);
        setError(err.response?.data?.message || 'Failed to delete planned change.');
        // Show error to user?
      } finally {
        setIsProcessing(false);
      }
    }
  }, [portfolioId, onMutationSuccess]);

  return {
    showChangeForm,
    changeToEdit,
    isProcessing,
    error, // Expose error state if needed for display
    handleAddChangeClick,
    handleEditChangeClick,
    handleCancelChangeForm,
    handleSaveChange, // Callback for ChangeForm success
    handleDeleteChange,
  };
} 