import React from 'react';
import Button from '../../../components/Button/Button';
import AlertMessage from '../../../components/AlertMessage/AlertMessage'; // For displaying notifications/errors.
import ConfirmationModal from '../../../components/Modal/ConfirmationModal'; // For account deletion confirmation.
import useDataManagement from '../hooks/useDataManagement'; // Custom hook for data management logic.
import useTheme from '../../../hooks/useTheme'; // Custom hook for theme management.
import {
  HEADING_DATA_MANAGEMENT,
  BUTTON_EXPORT_ALL_DATA,
  BUTTON_DELETE_ACCOUNT,
  // Modal text constants (title, message, confirm, cancel) are now sourced from the `deleteModalTexts` object returned by the useDataManagement hook.
} from '../../../constants/textConstants'; // UI text constants.

/**
 * @component DataManagementSection
 * @description A UI section component that provides users with options for managing their application data.
 * This includes functionality to export all their data and to permanently delete their account.
 * It utilizes the `useDataManagement` hook to handle the underlying logic for these actions,
 * including managing modal states for confirmations, handling API calls (implicitly via the hook),
 * and displaying relevant notifications or error messages. The `useTheme` hook is used for theming.
 *
 * @example
 * // Typically used within a user settings or profile page.
 * <DataManagementSection />
 *
 * @returns {JSX.Element} The rendered data management section.
 */
const DataManagementSection = () => {
  // Destructure state and handlers from the useDataManagement custom hook.
  const {
    isDeleteAccountModalOpen,    // Boolean state controlling visibility of the delete account confirmation modal.
    isDeletingAccount,           // Boolean state indicating if the account deletion process is in progress (for loading states).
    dataManagementNotification,  // Object { type, message } for displaying success/error notifications related to data operations.
    handleExportAllData,         // Function to trigger the export all data process.
    handleOpenDeleteAccountModal,// Function to open the delete account confirmation modal.
    handleCloseDeleteAccountModal, // Function to close the delete account confirmation modal.
    handleConfirmDeleteAccount,  // Function to execute the account deletion after confirmation.
    deleteModalTexts,            // Object containing localized/dynamic texts for the delete confirmation modal (title, message, confirm, cancel).
  } = useDataManagement();

  // Access the current theme state from the useTheme hook for styling.
  const { theme } = useTheme();

  return (
    // Main container for the section, with theme-dependent background and border.
    <div className={`p-4 md:p-6 ${theme === 'high-contrast' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm rounded-lg border`}>
      {/* Section Title, using text from constants. */}
      <h2 className={`text-xl font-semibold ${theme === 'high-contrast' ? 'text-gray-100 border-gray-600' : 'text-gray-800 border-gray-300'} mb-4 border-b pb-2`}>
        {HEADING_DATA_MANAGEMENT || 'Data Management'}
      </h2>

      {/* Display general notifications (e.g., after export) only when the delete modal is not open,
          as the modal has its own dedicated space for notifications related to the delete action. */}
      {dataManagementNotification.message && !isDeleteAccountModalOpen && (
        <div className="mb-4">
          <AlertMessage type={dataManagementNotification.type} message={dataManagementNotification.message} />
        </div>
      )}

      {/* Container for data management actions, spaced vertically. */}
      <div className="space-y-4">
        {/* Export All Data Section */}
        <div>
          <Button
            onClick={handleExportAllData} // Trigger export data handler.
            variant="secondary" // Secondary button style.
            className="w-full md:w-auto" // Responsive width.
          >
            {BUTTON_EXPORT_ALL_DATA || 'Export All Data'}
          </Button>
          <p className={`mt-2 text-sm ${theme === 'high-contrast' ? 'text-gray-400' : 'text-gray-500'}`}>
            Download all your portfolio and application data in a portable format.
          </p>
        </div>

        {/* Account Deletion Section, separated by a themed border. */}
        <div className={`pt-4 ${theme === 'high-contrast' ? 'border-gray-700' : 'border-gray-200'} border-t`}>
          <h4 className={`text-md font-medium ${theme === 'high-contrast' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Account Deletion</h4>
          <Button
            onClick={handleOpenDeleteAccountModal} // Open the confirmation modal.
            variant="danger" // Danger button style for destructive action.
            className="w-full md:w-auto"
          >
            {BUTTON_DELETE_ACCOUNT || 'Delete Account'}
          </Button>
          <p className={`mt-2 text-sm ${theme === 'high-contrast' ? 'text-gray-400' : 'text-gray-500'}`}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
      </div>

      {/* Confirmation Modal for Account Deletion. Rendered only if `isDeleteAccountModalOpen` is true. */}
      {isDeleteAccountModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteAccountModalOpen} // Controls visibility.
          onClose={handleCloseDeleteAccountModal} // Handler for closing the modal.
          onConfirm={handleConfirmDeleteAccount} // Handler for confirming the deletion.
          title={deleteModalTexts.title} // Modal title from hook.
          // Confirm button text changes based on loading state.
          confirmText={isDeletingAccount ? 'Deleting...' : deleteModalTexts.confirm}
          cancelText={deleteModalTexts.cancel} // Cancel button text from hook.
          isConfirming={isDeletingAccount} // Propagates loading state to the modal's confirm button.
          confirmButtonVariant="danger" // Uses danger styling for the confirm button.
        >
          {/* Message content for the confirmation modal, styled based on theme. */}
          <p className={`${theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-700'}`}>{deleteModalTexts.message}</p>
          {/* Display notifications (e.g., error during deletion attempt) specifically within the modal. */}
          {dataManagementNotification.message && isDeleteAccountModalOpen && (
            <div className="mt-3">
              <AlertMessage type={dataManagementNotification.type} message={dataManagementNotification.message} />
            </div>
          )}
        </ConfirmationModal>
      )}
    </div>
  );
};

// This component primarily uses hooks for its data and actions, and does not receive direct props
// for its core functionality, so PropTypes are not defined here.
export default DataManagementSection;