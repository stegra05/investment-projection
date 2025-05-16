import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom'; // Assuming portfolioId comes from route params
import { motion, AnimatePresence } from 'framer-motion'; // Import framer-motion
import portfolioService from '../../../api/portfolioService';
import analyticsService from '../../../api/analyticsService'; // Import analytics service
import Spinner from '../../../components/Spinner/Spinner'; // Assuming Spinner component exists
import AlertMessage from '../../../components/AlertMessage/AlertMessage'; // Assuming AlertMessage component exists
import Input from '../../../components/Input/Input'; // Assuming Input component exists
import Button from '../../../components/Button/Button'; // Corrected path
import ConfirmationModal from '../../../components/Modal/ConfirmationModal'; // Use for structure
import SkeletonLoader from '../../../components/SkeletonLoader/SkeletonLoader'; // Import SkeletonLoader

// Import store and new constants/services
import useSettingsStore from '../../../store/settingsStore';
import useTheme from '../../../hooks/useTheme'; // Import the useTheme hook
import useNotificationStore from '../../../store/notificationStore'; // Import notification store
import {
  HEADING_APPLICATION_SETTINGS,
  LABEL_DEFAULT_INFLATION_RATE,
  HELPER_TEXT_INFLATION_RATE,
  BUTTON_SAVE_SETTINGS,
  TEXT_SAVING_SETTINGS,
  // Add new constants for Data Management
  HEADING_DATA_MANAGEMENT,
  BUTTON_EXPORT_ALL_DATA,
  BUTTON_DELETE_ACCOUNT,
  MODAL_TITLE_DELETE_ACCOUNT,
  MODAL_MESSAGE_DELETE_ACCOUNT,
  MODAL_CONFIRM_DELETE_ACCOUNT,
  MODAL_CANCEL_DELETE_ACCOUNT,
  HEADING_PORTFOLIO_OVERVIEW,
  // Portfolio Summary Labels
  LABEL_PORTFOLIO_ID,
  LABEL_PORTFOLIO_NAME,
  LABEL_PORTFOLIO_DESCRIPTION,
  LABEL_TOTAL_VALUE,
  LABEL_OVERALL_RISK_PROFILE,
  LABEL_CREATED_ON,
  LABEL_LAST_UPDATED,
  // Aria Labels for Edit Buttons
  ARIA_LABEL_EDIT_PORTFOLIO_NAME,
  ARIA_LABEL_EDIT_PORTFOLIO_DESCRIPTION,
  // Placeholders
  PLACEHOLDER_PORTFOLIO_DESCRIPTION,
  PLACEHOLDER_PORTFOLIO_NAME,
  // Notification Message Constants
  SUCCESS_PORTFOLIO_FIELD_UPDATED_PREFIX,
  SUCCESS_PORTFOLIO_FIELD_UPDATED_SUFFIX,
  SUCCESS_APP_SETTINGS_SAVED,
  // Fallback Error Message Constants
  ERROR_PORTFOLIO_UPDATE_FAILED_FALLBACK,
  ERROR_APP_SETTINGS_SAVE_FAILED_FALLBACK,
} from '../../../constants/textConstants'; // Assuming these constants exist or will be added

// Placeholder for an edit icon if available, otherwise use text
// import { FaPencilAlt } from 'react-icons/fa'; 

const OverviewSettingsView = () => {
  const { portfolioId } = useParams();
  
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // State for editing portfolio name/description
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null); // 'name' or 'description'
  const [editValue, setEditValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for analytics snippet
  const [riskProfile, setRiskProfile] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // State for Data Management
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [dataManagementNotification, setDataManagementNotification] = useState({ type: '', message: '' });

  // Settings store integration
  const {
    defaultInflationRate,
    isLoading: isSettingsLoading,
    error: settingsError,
    fetchSettings,
    updateDefaultInflationRate,
    clearError: clearSettingsError,
  } = useSettingsStore();

  const [inflationInput, setInflationInput] = useState('');
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);
  const [settingsNotification, setSettingsNotification] = useState({ type: '', message: '' });

  // Theme hook integration
  const { theme, toggleTheme } = useTheme();

  const fetchPortfolioDetails = useCallback(async () => {
    try {
      const data = await portfolioService.getPortfolioById(portfolioId, 'summary');
      setPortfolioData(data);
      return true; // Indicate success for chaining
    } catch (err) {
      console.error('Failed to fetch portfolio details:', err);
      setError(err.message || 'Failed to load portfolio information.');
      return false; // Indicate failure
    }
  }, [portfolioId]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!portfolioId) return;
    try {
      const analyticsData = await analyticsService.getRiskProfile(portfolioId);
      setRiskProfile(analyticsData);
    } catch (err) {
      console.warn('Failed to fetch analytics snippet:', err);
      setAnalyticsError(err.message || 'Could not load analytics snippet.');
    }
  }, [portfolioId]);

  // Fetch initial settings
  useEffect(() => {
    fetchSettings().then((fetchedRate) => {
      if (fetchedRate !== null && fetchedRate !== undefined) {
        setInflationInput(String(fetchedRate));
      }
    });
  }, [fetchSettings]);

  useEffect(() => {
    if (!portfolioId) {
      console.warn('Portfolio ID not available yet.');
      setIsLoading(false);
      setError('Portfolio ID is missing. Cannot display details.');
      return;
    }
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null); // Reset errors at the start of a load sequence
      setAnalyticsError(null);
      setNotification({ type: '', message: '' }); // Clear notifications too

      const portfolioSuccess = await fetchPortfolioDetails();
      if (portfolioSuccess) {
        setIsAnalyticsLoading(true); // Set loading for analytics specifically
        await fetchAnalyticsData();
        setIsAnalyticsLoading(false);
      }
      setIsLoading(false); // Master loading indicator
    };
    loadData();

  }, [portfolioId, fetchPortfolioDetails, fetchAnalyticsData]);

  const handleOpenEditModal = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue);
    setIsEditModalOpen(true);
    setNotification({ type: '', message: '' }); 
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingField(null);
    setEditValue('');
  };

  const handleSaveChanges = async () => {
    if (!editingField) return;

    setIsSubmitting(true);
    // Clear local notification; errors will re-populate it if they occur.
    setNotification({ type: '', message: '' });
    const addNotification = useNotificationStore.getState().addNotification; // Get addNotification action

    const updateData = { [editingField]: editValue };

    try {
      const updatedPortfolio = await portfolioService.updatePortfolioDetails(portfolioId, updateData);
      setPortfolioData(updatedPortfolio);
      // Use global toast for success
      addNotification({
        type: 'success',
        message: `${SUCCESS_PORTFOLIO_FIELD_UPDATED_PREFIX}${editingField.charAt(0).toUpperCase() + editingField.slice(1)}${SUCCESS_PORTFOLIO_FIELD_UPDATED_SUFFIX}`,
      });
      setError(null); // Clear general error on successful save
      handleCloseEditModal();
    } catch (err) {
      console.error(`Failed to update ${editingField}:`, err);
      // Set notification for the modal error
      setNotification({
        type: 'error',
        message: `Failed to update ${editingField}: ${err.message || ERROR_PORTFOLIO_UPDATE_FAILED_FALLBACK}`,
      });
      // Also set general error to be displayed outside modal if needed
      setError(err.message || ERROR_PORTFOLIO_UPDATE_FAILED_FALLBACK);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInflationInputChange = (e) => {
    setInflationInput(e.target.value);
    if (settingsNotification.message) setSettingsNotification({ type: '', message: '' }); // Clear notification on input change
    if (settingsError) clearSettingsError(); // Clear store error on input change
  };

  const handleSaveAppSettings = async () => {
    setIsSubmittingSettings(true);
    setSettingsNotification({ type: '', message: '' });
    clearSettingsError();
    const addNotification = useNotificationStore.getState().addNotification; // Get addNotification action

    try {
      const rateToSave = inflationInput.trim() === '' ? null : inflationInput;
      await updateDefaultInflationRate(rateToSave);
      // Use global toast for success
      addNotification({ type: 'success', message: SUCCESS_APP_SETTINGS_SAVED });
    } catch (err) {
      // error is already set in the store by updateDefaultInflationRate if it throws
      // we can use settingsError from the store to display, or set a local notification too.
      setSettingsNotification({ type: 'error', message: err.message || ERROR_APP_SETTINGS_SAVE_FAILED_FALLBACK });
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  const handleExportAllData = async () => {
    // Placeholder for export functionality
    console.log('Export All Data clicked');
    setDataManagementNotification({ type: 'info', message: 'Export functionality not yet implemented.' });
    // Clear notification after a few seconds
    setTimeout(() => setDataManagementNotification({ type: '', message: '' }), 3000);
  };

  const handleOpenDeleteAccountModal = () => {
    setDataManagementNotification({ type: '', message: '' }); // Clear previous notifications
    setIsDeleteAccountModalOpen(true);
  };

  const handleCloseDeleteAccountModal = () => {
    setIsDeleteAccountModalOpen(false);
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDataManagementNotification({ type: '', message: '' });
    // Placeholder for delete account API call
    console.log('Delete Account confirmed');
    try {
      // const response = await dataManagementService.deleteAccount(); // Future implementation
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setDataManagementNotification({ type: 'success', message: 'Account deletion process initiated (placeholder).' });
      // Potentially redirect user or log them out here
      setIsDeleteAccountModalOpen(false);
    } catch (err) {
      console.error('Failed to delete account:', err);
      setDataManagementNotification({ type: 'error', message: `Failed to delete account: ${err.message || 'Please try again.'}` });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Combined loading state considering initial portfolio load and analytics load
  if (isLoading) { 
    return (
      <div className="space-y-8">
        {/* Skeleton for Portfolio Overview Section */}
        <div className={`p-4 md:p-6 ${theme === 'high-contrast' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm rounded-lg border`}>
          <SkeletonLoader className="h-6 mb-6 w-1/2" /> {/* Heading */}
          <div className="space-y-5">
            <SkeletonLoader className="h-4 w-1/4" /> {/* Label */}
            <SkeletonLoader className="h-5 w-3/4" /> {/* Value */}
            <SkeletonLoader className="h-4 w-1/3 mt-2" /> {/* Label */}
            <SkeletonLoader className="h-5 w-full" /> {/* Value */}
            <SkeletonLoader className="h-4 w-1/4 mt-2" /> {/* Label */}
            <SkeletonLoader className="h-5 w-1/2" /> {/* Value */}
            <SkeletonLoader className="h-4 w-1/3 mt-2" /> {/* Label */}
            <SkeletonLoader className="h-5 w-1/3" /> {/* Value */}
            <SkeletonLoader className="h-4 w-1/4 mt-2" /> {/* Label */}
            <SkeletonLoader className="h-5 w-1/2" /> {/* Value */}
            <SkeletonLoader className="h-4 w-1/3 mt-2" /> {/* Label */}
            <SkeletonLoader className="h-5 w-1/2" /> {/* Value */}
          </div>
        </div>
        {/* Application Settings could have its own skeleton or spinner if needed, currently it has an internal spinner */}
      </div>
    );
  }

  // Main error display if portfolio data couldn't be loaded
  if (error && !portfolioData) { 
    return <AlertMessage type="error" message={error} />;
  }
  
  if (!portfolioData && !isLoading) { // Should be caught by above if error, or means no ID
    return <AlertMessage type="info" message="No portfolio ID provided or portfolio data could not be loaded." />;
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="space-y-8"> {/* Added space-y-8 for separation between sections */} 
      {/* Portfolio Overview Section */}
      <div className={`p-4 md:p-6 ${theme === 'high-contrast' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm rounded-lg border`}>
        <h2 className={`text-xl font-semibold ${theme === 'high-contrast' ? 'text-gray-100 border-gray-600' : 'text-gray-800 border-gray-300'} mb-4 border-b pb-2`}>{HEADING_PORTFOLIO_OVERVIEW || 'Portfolio Overview'}</h2>

        {notification.message && !isEditModalOpen && (
          <div className="mb-4">
            <AlertMessage type={notification.type} message={notification.message} />
          </div>
        )}
        
        {/* Display general error if portfolioData exists but an action (like update) failed */}
        {error && portfolioData && !isEditModalOpen && (
          <div className="mb-4">
            <AlertMessage type="error" message={`An error occurred: ${error}`} />
          </div>
        )}

        {/* This spinner for subsequent loading/refreshing, not initial load */}
        {/* Consider if this is needed if individual sections have spinners */}
        {/* {isLoading && portfolioData && ( ... )} */}

        {portfolioData && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">{LABEL_PORTFOLIO_ID || 'Portfolio ID'}</p>
              <p className={`text-lg ${theme === 'high-contrast' ? 'text-gray-50' : 'text-gray-900'}`}>{portfolioData.portfolio_id || 'N/A'}</p>
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-500">{LABEL_PORTFOLIO_NAME || 'Name'}</p>
                <Button 
                  variant="icon" 
                  size="sm" 
                  onClick={() => handleOpenEditModal('name', portfolioData.name)} 
                  className={`${theme === 'high-contrast' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-800'}`}
                  aria-label={ARIA_LABEL_EDIT_PORTFOLIO_NAME || 'Edit portfolio name'}
                >
                  Edit
                </Button>
              </div>
              <p className={`text-lg font-semibold ${theme === 'high-contrast' ? 'text-gray-50' : 'text-gray-900'}`}>{portfolioData.name || 'N/A'}</p>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-500">{LABEL_PORTFOLIO_DESCRIPTION || 'Description'}</p>
                <Button 
                  variant="icon" 
                  size="sm" 
                  onClick={() => handleOpenEditModal('description', portfolioData.description || '')} 
                  className={`${theme === 'high-contrast' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-800'}`}
                  aria-label={ARIA_LABEL_EDIT_PORTFOLIO_DESCRIPTION || 'Edit portfolio description'}
                >
                  Edit
                </Button>
              </div>
              <p className={`text-lg ${theme === 'high-contrast' ? 'text-gray-50' : 'text-gray-900'}`}>{portfolioData.description || <span className={`italic ${theme === 'high-contrast' ? 'text-gray-400' : 'text-gray-400'}`}>No description provided.</span>}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">{LABEL_TOTAL_VALUE || 'Total Value'}</p>
              <p className={`text-lg font-semibold ${theme === 'high-contrast' ? 'text-primary-400' : 'text-primary-600'}`}>{formatCurrency(portfolioData.totalValue)}</p>
            </div>

            {/* Analytics Snippet Section */}
            <div>
              <p className="text-sm font-medium text-gray-500">{LABEL_OVERALL_RISK_PROFILE || 'Overall Risk Profile'}</p>
              {isAnalyticsLoading ? (
                <div className="h-6 mt-1 flex items-center">
                  <Spinner size="sm" />
                  <span className="ml-2 text-sm text-gray-500">Loading risk data...</span>
                </div>
              ) : analyticsError ? (
                <AlertMessage type="warning" size="sm" message={analyticsError} />
              ) : riskProfile && riskProfile.overallRiskScore ? (
                <p className={`text-lg ${theme === 'high-contrast' ? 'text-gray-50' : 'text-gray-900'}`}>{riskProfile.overallRiskScore}</p>
              ) : (
                <p className={`text-sm italic ${theme === 'high-contrast' ? 'text-gray-400' : 'text-gray-400'}`}>Risk data not available.</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">{LABEL_CREATED_ON || 'Created On'}</p>
              <p className={`text-lg ${theme === 'high-contrast' ? 'text-gray-50' : 'text-gray-900'}`}>{formatDate(portfolioData.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{LABEL_LAST_UPDATED || 'Last Updated'}</p>
              <p className={`text-lg ${theme === 'high-contrast' ? 'text-gray-50' : 'text-gray-900'}`}>{formatDate(portfolioData.updated_at)}</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isEditModalOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              // Applying some basic modal positioning styles. Adjust if ConfirmationModal handles this differently.
              // These ensure the motion.div acts as a proper overlay container.
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            >
              <ConfirmationModal
                isOpen={isEditModalOpen} // isOpen might be redundant if AnimatePresence handles visibility
                onClose={handleCloseEditModal}
                onConfirm={handleSaveChanges}
                title={`Edit ${editingField.charAt(0).toUpperCase() + editingField.slice(1)}`}
                confirmText={isSubmitting ? 'Saving...' : 'Save Changes'}
                isConfirming={isSubmitting}
                // Pass a style to prevent the modal itself from trying to be fixed positioned if not needed
                // style={{ position: 'relative', zIndex: 'auto' }} // Example, might not be needed
              >
                <div className="my-4">
                  {notification.message && (
                    <div className="mb-3">
                      <AlertMessage type={notification.type} message={notification.message} />
                    </div>
                  )}
                  <Input
                    label={editingField === 'name' ? 'Portfolio Name' : 'Portfolio Description'}
                    type={editingField === 'description' ? 'textarea' : 'text'} 
                    id={`edit-${editingField}`}
                    name={`edit-${editingField}`}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={editingField === 'description' ? 4 : undefined} 
                    placeholder={
                      editingField === 'description'
                        ? (PLACEHOLDER_PORTFOLIO_DESCRIPTION || 'Add a description...')
                        : editingField === 'name'
                          ? (PLACEHOLDER_PORTFOLIO_NAME || 'Enter portfolio name')
                          : undefined
                    }
                  />
                </div>
              </ConfirmationModal>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Application Settings Section */}
      <div className={`p-4 md:p-6 ${theme === 'high-contrast' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm rounded-lg border`}>
        <h2 className={`text-xl font-semibold ${theme === 'high-contrast' ? 'text-gray-100 border-gray-600' : 'text-gray-800 border-gray-300'} mb-4 border-b pb-2`}>{HEADING_APPLICATION_SETTINGS || 'Application Settings'}</h2>
        
        {isSettingsLoading && !defaultInflationRate && (
          <div className="flex justify-center items-center h-20"><Spinner /></div>
        )}

        {settingsNotification.message && (
          <div className="mb-4">
            <AlertMessage type={settingsNotification.type} message={settingsNotification.message} />
          </div>
        )}
        {/* Display error from store if no local notification is more specific */}
        {settingsError && !settingsNotification.message && (
          <div className="mb-4">
            <AlertMessage type="error" message={settingsError} />
          </div>
        )}

        <div className="space-y-6"> {/* Increased spacing for clarity */}
          <div>
            <Input
              label={LABEL_DEFAULT_INFLATION_RATE || 'Default Annual Inflation Rate (%)'}
              id="defaultInflationRate"
              name="defaultInflationRate"
              type="number"
              value={inflationInput}
              onChange={handleInflationInputChange}
              placeholder="e.g., 2.5 for 2.5%"
              helperText={HELPER_TEXT_INFLATION_RATE || 'This rate will be used for real terms projections. Enter as a percentage (e.g., 2.5).'}
              min="0"
              step="0.01"
              className="max-w-xs" // Added to control width
            />
          </div>
          <div>
            <Button 
              onClick={handleSaveAppSettings} 
              disabled={isSubmittingSettings || isSettingsLoading}
              variant="primary" // Assuming a primary variant exists for Button
            >
              {isSubmittingSettings ? (TEXT_SAVING_SETTINGS || 'Saving...') : (BUTTON_SAVE_SETTINGS || 'Save Settings')}
            </Button>
          </div>

          {/* Theme Toggle Section */}
          <div className={`pt-4 ${theme === 'high-contrast' ? 'border-gray-700' : 'border-gray-200'} border-t`}>
            <h3 className={`text-lg font-semibold ${theme === 'high-contrast' ? 'text-gray-100' : 'text-gray-800'} mb-3`}>Appearance</h3>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-700'}`}>
                High Contrast Mode
              </span>
              <button
                onClick={toggleTheme}
                type="button"
                className={`${ 
                  theme === 'high-contrast' ? 'bg-primary-600' : 'bg-gray-200'
                } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                role="switch"
                aria-checked={theme === 'high-contrast'}
              >
                <span className="sr-only">Use setting</span>
                <span
                  aria-hidden="true"
                  className={`${ 
                    theme === 'high-contrast' ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                />
              </button>
            </div>
            {theme === 'high-contrast' && (
              <p className={`mt-2 text-xs ${theme === 'high-contrast' ? 'text-gray-400' : 'text-gray-500'}`}>
                High contrast mode is enabled.
              </p>
            )}
          </div>

          {/* Data Management Sub-Section */}
          <div className={`pt-6 mt-6 ${theme === 'high-contrast' ? 'border-gray-700' : 'border-gray-200'} border-t`}>
            <h3 className={`text-lg font-semibold ${theme === 'high-contrast' ? 'text-gray-100' : 'text-gray-800'} mb-3`}>{HEADING_DATA_MANAGEMENT || 'Data Management'}</h3>

            {dataManagementNotification.message && (
              <div className="mb-4">
                <AlertMessage type={dataManagementNotification.type} message={dataManagementNotification.message} />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Button
                  onClick={handleExportAllData}
                  variant="secondary"
                  className="w-full md:w-auto" // Responsive width
                >
                  {BUTTON_EXPORT_ALL_DATA || 'Export All Data'}
                </Button>
                <p className="mt-2 text-sm text-gray-500">
                  Download all your portfolio and application data in a portable format.
                </p>
              </div>

              <div className={`pt-4 ${theme === 'high-contrast' ? 'border-gray-700' : 'border-gray-200'} border-t`}> {/* Inner border for separation from export */}
                <h4 className={`text-md font-medium ${theme === 'high-contrast' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Account Deletion</h4>
                <Button
                  onClick={handleOpenDeleteAccountModal}
                  variant="danger"
                  className="w-full md:w-auto" // Responsive width
                >
                  {BUTTON_DELETE_ACCOUNT || 'Delete Account'}
                </Button>
                <p className="mt-2 text-sm text-gray-500">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isDeleteAccountModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteAccountModalOpen}
          onClose={handleCloseDeleteAccountModal}
          onConfirm={handleConfirmDeleteAccount}
          title={MODAL_TITLE_DELETE_ACCOUNT || 'Confirm Account Deletion'}
          confirmText={isDeletingAccount ? 'Deleting...' : (MODAL_CONFIRM_DELETE_ACCOUNT || 'Delete My Account')}
          cancelText={MODAL_CANCEL_DELETE_ACCOUNT || 'Cancel'}
          isConfirming={isDeletingAccount}
          confirmButtonVariant="danger"
        >
          <p>{MODAL_MESSAGE_DELETE_ACCOUNT || 'Are you sure you want to permanently delete your account? All your data, including portfolios and settings, will be erased. This action cannot be undone.'}</p>
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

export default OverviewSettingsView; 