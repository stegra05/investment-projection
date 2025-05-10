import React, { useState, useEffect, useRef } from 'react';
import { usePortfolio } from '../state/PortfolioContext'; // Corrected path
import TimelineView from '../components/TimelineView'; // Import TimelineView
// import ChangeItemCard from '../components/ChangeItemCard'; // No longer directly used here
import AddEditChangePanel from '../components/AddEditChangePanel'; // Import the new panel
import portfolioService from '../../../api/portfolioService'; // Adjusted path and import type
// import Input from '../../../components/Input/Input'; // No longer directly used here
import { CHANGE_TYPES } from '../../../constants/portfolioConstants'; // Still needed for AddEditChangePanel or other logic if any remains

// Import new components and hook
import ChangeFilters from '../components/ChangeFilters';
import ChangeDetailsList from '../components/ChangeDetailsList';
import useFilteredChanges from '../hooks/useFilteredChanges';

// TODO: Define these types, perhaps from a shared enum/constants file
// const CHANGE_TYPES = [
//   { value: '', label: 'All Types' },
//   { value: 'CONTRIBUTION', label: 'Contribution' },
//   { value: 'WITHDRAWAL', label: 'Withdrawal' },
//   { value: 'REALLOCATION', label: 'Reallocation' },
//   // Add other types as defined in backend enums
// ];

const ChangesView = () => {
  const {
    portfolio,
    isLoading: isPortfolioLoading,
    error: portfolioError,
    refreshPortfolio,
    setDraftChangeForPreview,
    clearDraftChangeForPreview,
  } = usePortfolio();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [selectedChangeId, setSelectedChangeId] = useState(null);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingChangeData, setEditingChangeData] = useState(null);
  const [actionError, setActionError] = useState(null);

  const { displayedChanges, itemRefs } = useFilteredChanges(
    portfolio,
    filters,
    isPortfolioLoading,
    portfolioError
  );

  useEffect(() => {
    setIsLoading(isPortfolioLoading);
  }, [isPortfolioLoading]);

  useEffect(() => {
    setError(portfolioError);
  }, [portfolioError]);

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleSelectChange = changeId => {
    setSelectedChangeId(prevId => (prevId === changeId ? null : changeId));
  };

  const handleOpenAddPanel = () => {
    setEditingChangeData(null);
    setIsPanelOpen(true);
  };

  const handleOpenEditPanel = changeData => {
    setEditingChangeData(changeData);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setEditingChangeData(null);
    clearDraftChangeForPreview();
  };

  // Effect to scroll to selected item
  useEffect(() => {
    if (
      selectedChangeId &&
      itemRefs.current[selectedChangeId] &&
      itemRefs.current[selectedChangeId].current
    ) {
      itemRefs.current[selectedChangeId].current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedChangeId, itemRefs]);

  const handleSaveChanges = async changeDataFromPanel => {
    console.log('ChangesView (handleSaveChanges): portfolio context:', portfolio);
    setActionError(null);
    if (!portfolio || !portfolio.portfolio_id) {
      console.error('Portfolio ID is missing, cannot save change.');
      const err = new Error('Portfolio not loaded. Cannot save change.');
      setActionError(err.message);
      throw err;
    }

    const dataToSend = { ...changeDataFromPanel };
    const isUpdating = !!dataToSend.id;

    try {
      if (isUpdating) {
        const changeId = dataToSend.id;
        await portfolioService.updatePlannedChange(portfolio.portfolio_id, changeId, dataToSend);
      } else {
        const { id, ...addData } = dataToSend;
        await portfolioService.addPlannedChange(portfolio.portfolio_id, addData);
      }
      if (refreshPortfolio) {
        await refreshPortfolio();
      }
    } catch (apiError) {
      console.error('API Error saving planned change:', apiError);
      setActionError(apiError.message || 'Failed to save change.');
      throw apiError;
    }
  };

  const handleDeleteChange = async (changeId) => {
    setActionError(null); // Clear previous action errors
    if (!portfolio || !portfolio.portfolio_id) {
      console.error('Portfolio ID is missing, cannot delete change.');
      setActionError('Portfolio not loaded. Cannot delete change.');
      return;
    }
    if (!changeId) {
      console.error('Change ID is missing, cannot delete change.');
      setActionError('Change ID missing. Cannot delete change.');
      return;
    }

    // Optional: Add a confirmation dialog here
    // if (!window.confirm('Are you sure you want to delete this planned change?')) {
    //   return;
    // }

    try {
      await portfolioService.deletePlannedChange(portfolio.portfolio_id, changeId);
      if (refreshPortfolio) {
        await refreshPortfolio(); // Refresh portfolio data
      }
      // Optionally: Show a success notification (e.g., using a toast library)
    } catch (apiError) {
      console.error('API Error deleting planned change:', apiError);
      setActionError(apiError.message || 'Failed to delete planned change.');
      // Optionally: Show an error notification
    }
  };

  const handleRequestPreview = draftData => {
    if (!portfolio || !portfolio.portfolio_id) {
      console.error('Portfolio ID is missing, cannot request preview.');
      // Optionally, you could throw an error to be displayed in AddEditChangePanel for preview attempts
      // throw new Error("Portfolio not loaded. Cannot request preview.");
      return; // Or simply do nothing if portfolio not ready
    }
    console.log('ChangesView: Requesting preview with draft data:', draftData);
    setDraftChangeForPreview(draftData);
    // User will then need to switch to ProjectionPanel or it auto-updates
  };

  if (isLoading && !displayedChanges.length) {
    return <div className="p-4">Loading planned changes...</div>;
  }

  if (error || actionError) {
    return (
      <div className="p-4 text-red-600">
        Error: {error?.message || actionError || 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Planned Changes</h1>
        <button
          type="button"
          onClick={handleOpenAddPanel}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Add New Change
        </button>
      </header>

      <ChangeFilters filters={filters} onFilterChange={handleFilterChange} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="md:col-span-1 bg-white p-4 rounded-lg shadow overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 250px)' }}
        >
          <h3 className="text-md font-semibold text-gray-700 mb-3">Timeline</h3>
          <TimelineView
            plannedChanges={displayedChanges}
            selectedChangeId={selectedChangeId}
            onSelectChange={handleSelectChange}
          />
        </div>

        <ChangeDetailsList
          displayedChanges={displayedChanges}
          selectedChangeId={selectedChangeId}
          onSelectChange={handleSelectChange}
          onEdit={handleOpenEditPanel}
          onDelete={handleDeleteChange}
          itemRefs={itemRefs}
        />
      </div>

      <AddEditChangePanel
        key={editingChangeData ? editingChangeData.id : 'new'}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        initialData={editingChangeData}
        onSave={handleSaveChanges}
        onPreviewRequest={handleRequestPreview}
      />
    </div>
  );
};

export default ChangesView;
