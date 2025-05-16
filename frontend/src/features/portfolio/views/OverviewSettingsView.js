import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Assuming portfolioId comes from route params
import portfolioService from '../../../api/portfolioService';
import analyticsService from '../../../api/analyticsService'; // Import analytics service
import Spinner from '../../../components/Spinner/Spinner'; // Assuming Spinner component exists
import AlertMessage from '../../../components/AlertMessage/AlertMessage'; // Assuming AlertMessage component exists
import Input from '../../../components/Input/Input'; // Assuming Input component exists
import Button from '../../../components/Button/Button'; // Assuming Button component exists
import ConfirmationModal from '../../../components/Modal/ConfirmationModal'; // Use for structure

// Placeholder for an edit icon if available, otherwise use text
// import { FaPencilAlt } from 'react-icons/fa'; 

const OverviewSettingsView = () => {
  const { portfolioId } = useParams();
  
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // State for editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null); // 'name' or 'description'
  const [editValue, setEditValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for analytics snippet
  const [riskProfile, setRiskProfile] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  const fetchPortfolioDetails = async () => {
    setIsLoading(true);
    setError(null);
    setAnalyticsError(null); // Reset analytics error on main fetch
    try {
      const data = await portfolioService.getPortfolioById(portfolioId, 'summary');
      setPortfolioData(data);
      // After fetching portfolio, fetch analytics data
      // We only set main loading to false after analytics also tries to load
    } catch (err) {
      console.error('Failed to fetch portfolio details:', err);
      setError(err.message || 'Failed to load portfolio information.');
      setIsLoading(false); // Stop loading if main data fails
    }
  };

  const fetchAnalyticsData = async () => {
    if (!portfolioId) return;
    setIsAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      // Assuming getRiskProfile returns an object like { overallRiskScore: 'Medium' }
      const analyticsData = await analyticsService.getRiskProfile(portfolioId);
      setRiskProfile(analyticsData);
    } catch (err) {
      console.warn('Failed to fetch analytics snippet:', err);
      setAnalyticsError(err.message || 'Could not load analytics snippet.');
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (!portfolioId) {
      console.warn('Portfolio ID not available yet.');
      setIsLoading(false);
      setError('Portfolio ID is missing. Cannot display details.');
      return;
    }
    
    const loadData = async () => {
      await fetchPortfolioDetails();
      // Only fetch analytics if main portfolio details were successful (portfolioData would be set)
      // However, fetchPortfolioDetails sets its own loading to false if it errors, so check portfolioId again
      if (portfolioId) { // Check if portfolioId is still valid (not strictly necessary here as it's a dep)
        await fetchAnalyticsData();
      }
      setIsLoading(false); // Master loading indicator turns off after all attempts
    };
    loadData();

  }, [portfolioId]);

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
    // Keep general error, but clear notification for this specific action
    setNotification({ type: '', message: '' });

    const updateData = { [editingField]: editValue };

    try {
      const updatedPortfolio = await portfolioService.updatePortfolioDetails(portfolioId, updateData);
      setPortfolioData(updatedPortfolio); 
      setNotification({ type: 'success', message: `${editingField.charAt(0).toUpperCase() + editingField.slice(1)} updated successfully.` });
      setError(null); // Clear general error on successful save
      handleCloseEditModal();
    } catch (err) {
      console.error(`Failed to update ${editingField}:`, err);
      // Set notification for the modal error
      setNotification({ type: 'error', message: `Failed to update ${editingField}: ${err.message || 'Please try again.'}` });
      // Also set general error to be displayed outside modal if needed
      setError(err.message || `Failed to update ${editingField}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combined loading state considering initial portfolio load and analytics load
  if (isLoading) { 
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
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
    <div className="p-4 md:p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Portfolio Overview</h2>

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
            <p className="text-sm font-medium text-gray-500">Portfolio ID</p>
            <p className="text-lg text-gray-900">{portfolioData.portfolio_id || 'N/A'}</p>
          </div>
          
          <div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500">Name</p>
              <Button variant="icon" size="sm" onClick={() => handleOpenEditModal('name', portfolioData.name)} className="text-primary-600 hover:text-primary-800">
                Edit
              </Button>
            </div>
            <p className="text-lg text-gray-900">{portfolioData.name || 'N/A'}</p>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500">Description</p>
              <Button variant="icon" size="sm" onClick={() => handleOpenEditModal('description', portfolioData.description || '')} className="text-primary-600 hover:text-primary-800">
                Edit
              </Button>
            </div>
            <p className="text-lg text-gray-900">{portfolioData.description || <span className="italic text-gray-400">No description provided.</span>}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Total Value</p>
            <p className="text-lg font-semibold text-primary-600">{formatCurrency(portfolioData.totalValue)}</p>
          </div>

          {/* Analytics Snippet Section */}
          <div>
            <p className="text-sm font-medium text-gray-500">Overall Risk Profile</p>
            {isAnalyticsLoading ? (
              <div className="h-6 mt-1 flex items-center">
                <Spinner size="sm" />
                <span className="ml-2 text-sm text-gray-500">Loading risk data...</span>
              </div>
            ) : analyticsError ? (
              <AlertMessage type="warning" size="sm" message={analyticsError} />
            ) : riskProfile && riskProfile.overallRiskScore ? (
              <p className="text-lg text-gray-900">{riskProfile.overallRiskScore}</p>
            ) : (
              <p className="text-sm italic text-gray-400">Risk data not available.</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Created On</p>
            <p className="text-lg text-gray-900">{formatDate(portfolioData.created_at)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Last Updated</p>
            <p className="text-lg text-gray-900">{formatDate(portfolioData.updated_at)}</p>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <ConfirmationModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onConfirm={handleSaveChanges}
          title={`Edit ${editingField.charAt(0).toUpperCase() + editingField.slice(1)}`}
          confirmText={isSubmitting ? 'Saving...' : 'Save Changes'}
          isConfirming={isSubmitting}
        >
          <div className="my-4">
            {notification.message && isEditModalOpen && (
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {/* General error from saveChanges shown via notification above now */}
          </div>
        </ConfirmationModal>
      )}
    </div>
  );
};

export default OverviewSettingsView; 