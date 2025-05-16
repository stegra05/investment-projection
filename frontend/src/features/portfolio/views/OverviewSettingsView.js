import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Assuming portfolioId comes from route params
import Spinner from '../../../components/Spinner/Spinner'; // Assuming Spinner component exists
import AlertMessage from '../../../components/AlertMessage/AlertMessage'; // Assuming AlertMessage component exists
import Button from '../../../components/Button/Button'; // Corrected path
import SkeletonLoader from '../../../components/SkeletonLoader/SkeletonLoader'; // Import SkeletonLoader
import { usePortfolio } from '../state/PortfolioContext'; // Import usePortfolio
import useTheme from '../../../hooks/useTheme'; // Import the useTheme hook

import {
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
} from '../../../constants/textConstants'; // Assuming these constants exist or will be added

// Placeholder for an edit icon if available, otherwise use text
// import { FaPencilAlt } from 'react-icons/fa'; 

// Import the new hook and component
import usePortfolioEditForm from '../hooks/usePortfolioEditForm';
import EditPortfolioDetailModal from '../components/EditPortfolioDetailModal';
import ApplicationSettingsSection from '../components/ApplicationSettingsSection'; // Import new component
import DataManagementSection from '../components/DataManagementSection'; // Import new component

const OverviewSettingsView = () => {
  const { portfolioId: routePortfolioId } = useParams(); // Renamed to avoid conflict with context's portfolioId if any
  const {
    portfolio: portfolioData, // Use 'portfolio' from context as 'portfolioData'
    isLoading: isPortfolioLoading, // Use 'isLoading' from context
    error: portfolioError, // Use 'error' from context
    refreshPortfolio,
    riskProfile, // Use 'riskProfile' from context
    isAnalyticsLoading, // Use 'isAnalyticsLoading' from context
    analyticsError, // Use 'analyticsError' from context
    fetchRiskProfile, // Keep if OverviewSettingsView still needs to trigger this independently. Or remove if context handles it.
    // Assuming PortfolioContext's portfolioId is the definitive one, so we might not need routePortfolioId directly if context provides it
  } = usePortfolio();
  
  // General notification for page-level events, not edit modal.
  const [viewNotification, setViewNotification] = useState({ type: '', message: '' });

  // Portfolio Edit Modal Hook
  const {
    isEditModalOpen,
    editingField,
    editValue,
    setEditValue,
    isSubmitting: isEditSubmitting, // Renamed to avoid conflict
    notification: editModalNotification, // Renamed
    // setNotification: setEditModalNotification, // Not directly used here
    handleOpenEditModal,
    handleCloseEditModal,
    handleSaveChanges: handleEditSaveChanges, // Renamed
  } = usePortfolioEditForm(routePortfolioId, refreshPortfolio);

  // Theme hook integration
  const { theme } = useTheme();

  // fetchPortfolioDetails and fetchAnalyticsData are now handled by PortfolioContext
  // const fetchPortfolioDetails = useCallback(async () => { ... }); // Removed
  // const fetchAnalyticsData = useCallback(async () => { ... }); // Removed

  useEffect(() => {
    if (routePortfolioId && portfolioData && !riskProfile && !isAnalyticsLoading && !analyticsError) {
      fetchRiskProfile();
    }
    setViewNotification({ type: '', message: '' });
  }, [routePortfolioId, portfolioData, riskProfile, isAnalyticsLoading, analyticsError, fetchRiskProfile]);

  // Skeleton loaders should use isPortfolioLoading and isAnalyticsLoading from context
  if (isPortfolioLoading) { // Check context's loading state
    return (
      <div className="p-4 md:p-6 space-y-6">
        <SkeletonLoader type="heading" />
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
    );
  }

  // Error display should use portfolioError from context
  if (portfolioError) { // Check context's error state
    return (
      <AlertMessage
        type="error"
        message={portfolioError.message || 'Failed to load portfolio information. Please try refreshing or check the portfolio ID.'}
        className="m-4"
      />
    );
  }

  if (!portfolioData) { // Check context's portfolio data
    return (
      <AlertMessage
        type="info"
        message="No portfolio data could be loaded. Please try refreshing the page or check the portfolio ID."
        className="m-4"
      />
    );
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

  // This is the Portfolio Overview Display section that could also be extracted
  // For now, keeping it here as per initial scope of extracting the larger sections.
  const portfolioOverviewSection = (
    <div className={`p-4 md:p-6 ${theme === 'high-contrast' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm rounded-lg border`}>
      <h2 className={`text-xl font-semibold ${theme === 'high-contrast' ? 'text-gray-100 border-gray-600' : 'text-gray-800 border-gray-300'} mb-4 border-b pb-2`}>{HEADING_PORTFOLIO_OVERVIEW || 'Portfolio Overview'}</h2>

      {viewNotification.message && (
        <div className="mb-4">
          <AlertMessage type={viewNotification.type} message={viewNotification.message} />
        </div>
      )}

      {portfolioData && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">{LABEL_PORTFOLIO_ID || 'Portfolio ID'}</p>
            <p className={`text-lg ${theme === 'high-contrast' ? 'text-gray-50' : 'text-gray-900'}`}>{portfolioData.id || 'N/A'}</p>
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
            <p className={`text-lg font-semibold ${theme === 'high-contrast' ? 'text-primary-400' : 'text-primary-600'}`}>{formatCurrency(portfolioData.total_value)}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">{LABEL_OVERALL_RISK_PROFILE || 'Overall Risk Profile'}</p>
            {isAnalyticsLoading ? (
              <div className="h-6 mt-1 flex items-center">
                <Spinner size="sm" />
                <span className="ml-2 text-sm text-gray-500">Loading risk data...</span>
              </div>
            ) : analyticsError ? (
              <AlertMessage type="warning" size="sm" message={analyticsError.message || 'Error loading risk'} />
            ) : riskProfile && riskProfile.overall_risk_level ? (
              <p className={`text-lg ${theme === 'high-contrast' ? 'text-gray-50' : 'text-gray-900'}`}>{riskProfile.overall_risk_level}</p>
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

      <EditPortfolioDetailModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleEditSaveChanges}
        editingField={editingField}
        editValue={editValue}
        setEditValue={setEditValue}
        isSubmitting={isEditSubmitting}
        notification={editModalNotification}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {portfolioOverviewSection}
      <ApplicationSettingsSection />
      <DataManagementSection />
    </div>
  );
};

export default OverviewSettingsView; 