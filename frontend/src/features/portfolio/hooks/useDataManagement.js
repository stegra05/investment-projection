import { useState, useCallback } from 'react';
// import dataManagementService from '../../../api/dataManagementService'; // Future use
import {
  MODAL_TITLE_DELETE_ACCOUNT,
  MODAL_MESSAGE_DELETE_ACCOUNT,
  MODAL_CONFIRM_DELETE_ACCOUNT,
  MODAL_CANCEL_DELETE_ACCOUNT,
} from '../../../constants/textConstants';

const useDataManagement = () => {
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [dataManagementNotification, setDataManagementNotification] = useState({ type: '', message: '' });

  const handleExportAllData = useCallback(async () => {
    // Placeholder for export functionality
    console.log('Export All Data clicked in hook');
    setDataManagementNotification({ type: 'info', message: 'Export functionality not yet implemented.' });
    // Clear notification after a few seconds
    setTimeout(() => setDataManagementNotification({ type: '', message: '' }), 3000);
  }, []);

  const handleOpenDeleteAccountModal = useCallback(() => {
    setDataManagementNotification({ type: '', message: '' }); // Clear previous notifications
    setIsDeleteAccountModalOpen(true);
  }, []);

  const handleCloseDeleteAccountModal = useCallback(() => {
    setIsDeleteAccountModalOpen(false);
    // Optionally clear notification if modal is dismissed without action
    // setDataManagementNotification({ type: '', message: '' }); 
  }, []);

  const handleConfirmDeleteAccount = useCallback(async () => {
    setIsDeletingAccount(true);
    setDataManagementNotification({ type: '', message: '' });
    // Placeholder for delete account API call
    console.log('Delete Account confirmed in hook');
    try {
      // const response = await dataManagementService.deleteAccount(); // Future implementation
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setDataManagementNotification({ type: 'success', message: 'Account deletion process initiated (placeholder).' });
      // Potentially redirect user or log them out here
      // For now, just close the modal
      setIsDeleteAccountModalOpen(false);
    } catch (err) {
      console.error('Failed to delete account:', err);
      setDataManagementNotification({ type: 'error', message: `Failed to delete account: ${err.message || 'Please try again.'}` });
      // Modal remains open for user to see error
    } finally {
      setIsDeletingAccount(false);
    }
  }, []);

  return {
    isDeleteAccountModalOpen,
    isDeletingAccount,
    dataManagementNotification,
    // Expose setters if direct manipulation is needed from component, though usually not for notifications
    // setDataManagementNotification, 
    handleExportAllData,
    handleOpenDeleteAccountModal,
    handleCloseDeleteAccountModal,
    handleConfirmDeleteAccount,
    // Constants for modal can also be returned if the component shouldn't import them
    deleteModalTexts: {
      title: MODAL_TITLE_DELETE_ACCOUNT || 'Confirm Account Deletion',
      message: MODAL_MESSAGE_DELETE_ACCOUNT || 'Are you sure you want to permanently delete your account? All your data, including portfolios and settings, will be erased. This action cannot be undone.',
      confirm: MODAL_CONFIRM_DELETE_ACCOUNT || 'Delete My Account',
      cancel: MODAL_CANCEL_DELETE_ACCOUNT || 'Cancel',
    },
  };
};

export default useDataManagement; 