import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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
    if (!token) {
        alert('Authentication error. Please log in again.'); // Simple alert
        return;
    }
    if (window.confirm(`Are you sure you want to delete the change "${change.change_type}" on ${change.change_date}?`)) {
      setIsProcessing(true);
      setError(null);
      try {
        await axios.delete(`${API_URL}/portfolios/${portfolioId}/changes/${change.change_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
  }, [portfolioId, token, onMutationSuccess]);

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