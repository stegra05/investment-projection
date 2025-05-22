import React from 'react';
import Button from '../../../components/Button/Button';
import AlertMessage from '../../../components/AlertMessage/AlertMessage';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import useDataManagement from '../hooks/useDataManagement';
import useTheme from '../../../hooks/useTheme';
import {
  HEADING_DATA_MANAGEMENT,
  BUTTON_EXPORT_ALL_DATA,
  BUTTON_DELETE_ACCOUNT,
  // Modal text constants are now sourced from the hook
} from '../../../constants/textConstants';

const DataManagementSection = () => {
  const {
    isDeleteAccountModalOpen,
    isDeletingAccount,
    dataManagementNotification,
    handleExportAllData,
    handleOpenDeleteAccountModal,
    handleCloseDeleteAccountModal,
    handleConfirmDeleteAccount,
    deleteModalTexts, // Contains title, message, confirm, cancel texts
  } = useDataManagement();

  const { theme } = useTheme();

  return (
    <div className={`p-4 md:p-6 ${theme === 'high-contrast' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm rounded-lg border`}>
      <h2 className={`text-xl font-semibold ${theme === 'high-contrast' ? 'text-gray-100 border-gray-600' : 'text-gray-800 border-gray-300'} mb-4 border-b pb-2`}>
        {HEADING_DATA_MANAGEMENT || 'Data Management'}
      </h2>

      {dataManagementNotification.message && !isDeleteAccountModalOpen && (
        // Show general notifications only when modal is not open (modal has its own notification spot)
        <div className="mb-4">
          <AlertMessage type={dataManagementNotification.type} message={dataManagementNotification.message} />
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Button
            onClick={handleExportAllData}
            variant="secondary"
            className="w-full md:w-auto"
          >
            {BUTTON_EXPORT_ALL_DATA || 'Export All Data'}
          </Button>
          <p className={`mt-2 text-sm ${theme === 'high-contrast' ? 'text-gray-400' : 'text-gray-500'}`}>
            Download all your portfolio and application data in a portable format.
          </p>
        </div>

        <div className={`pt-4 ${theme === 'high-contrast' ? 'border-gray-700' : 'border-gray-200'} border-t`}>
          <h4 className={`text-md font-medium ${theme === 'high-contrast' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Account Deletion</h4>
          <Button
            onClick={handleOpenDeleteAccountModal}
            variant="danger"
            className="w-full md:w-auto"
          >
            {BUTTON_DELETE_ACCOUNT || 'Delete Account'}
          </Button>
          <p className={`mt-2 text-sm ${theme === 'high-contrast' ? 'text-gray-400' : 'text-gray-500'}`}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
      </div>

      {isDeleteAccountModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteAccountModalOpen}
          onClose={handleCloseDeleteAccountModal}
          onConfirm={handleConfirmDeleteAccount}
          title={deleteModalTexts.title}
          confirmText={isDeletingAccount ? 'Deleting...' : deleteModalTexts.confirm}
          cancelText={deleteModalTexts.cancel}
          isConfirming={isDeletingAccount}
          confirmButtonVariant="danger"
        >
          <p className={`${theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-700'}`}>{deleteModalTexts.message}</p>
          {/* Notification specifically for within the modal during/after an action attempt */}
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

export default DataManagementSection; 