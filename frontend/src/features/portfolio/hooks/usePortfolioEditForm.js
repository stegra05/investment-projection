import { useState } from 'react';
import portfolioService from '../../../api/portfolioService';
import usePortfolioListStore from '../../../store/portfolioListStore';
import useNotificationStore from '../../../store/notificationStore';
import {
  SUCCESS_PORTFOLIO_FIELD_UPDATED_PREFIX,
  SUCCESS_PORTFOLIO_FIELD_UPDATED_SUFFIX,
  ERROR_PORTFOLIO_UPDATE_FAILED_FALLBACK,
} from '../../../constants/textConstants';

const usePortfolioEditForm = (routePortfolioId, refreshPortfolio) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null); // 'name' or 'description'
  const [editValue, setEditValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const addNotification = useNotificationStore.getState().addNotification;
  const fetchPortfolioList = usePortfolioListStore.getState().fetchPortfolios;

  const handleOpenEditModal = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue);
    setIsEditModalOpen(true);
    setNotification({ type: '', message: '' }); // Clear previous notifications
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingField(null);
    setEditValue('');
    // Notification is cleared when modal opens or on successful save
  };

  const handleSaveChanges = async () => {
    if (!editingField) return;

    setIsSubmitting(true);
    setNotification({ type: '', message: '' }); // Clear local notification

    const updateData = { [editingField]: editValue };

    try {
      await portfolioService.updatePortfolioDetails(routePortfolioId, updateData);
      refreshPortfolio(); // Refresh the portfolio data in the context
      fetchPortfolioList(); // Refresh the portfolio list in the store

      addNotification({
        type: 'success',
        message: `${SUCCESS_PORTFOLIO_FIELD_UPDATED_PREFIX}${editingField.charAt(0).toUpperCase() + editingField.slice(1)}${SUCCESS_PORTFOLIO_FIELD_UPDATED_SUFFIX}`,
      });
      handleCloseEditModal(); // Close modal on success
    } catch (err) {
      console.error(`Failed to update ${editingField}:`, err);
      setNotification({
        type: 'error',
        message: `Failed to update ${editingField}: ${err.message || ERROR_PORTFOLIO_UPDATE_FAILED_FALLBACK}`,
      });
      // Modal remains open for user to see the error and retry or cancel
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isEditModalOpen,
    editingField,
    editValue,
    setEditValue, // Expose setter for input onChange
    isSubmitting,
    notification, // This is the local notification for the modal
    setNotification, // Allow clearing notification from component if needed
    handleOpenEditModal,
    handleCloseEditModal,
    handleSaveChanges,
  };
};

export default usePortfolioEditForm; 