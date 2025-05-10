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
    setDraftChangeForPreview, // New from context
    clearDraftChangeForPreview, // New from context
  } = usePortfolio();

  // Removed displayedChanges state, now comes from useFilteredChanges
  const [isLoading, setIsLoading] = useState(false); // Or initialize based on isPortfolioLoading
  const [error, setError] = useState(null); // Or initialize based on portfolioError
  const [filters, setFilters] = useState({
    type: '', // Default to 'All Types'
    startDate: '',
    endDate: '',
    description: '',
  });
  const [selectedChangeId, setSelectedChangeId] = useState(null);

  // State for the slide-in panel
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingChangeData, setEditingChangeData] = useState(null); // To hold data for editing
  const [actionError, setActionError] = useState(null); // Generic error state for actions like delete

  // Refs for scrolling - now managed by useFilteredChanges
  // const itemRefs = useRef({}); // To store refs for each change item

  // Use the custom hook for filtering
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
    // if (portfolioError) { // This logic is now in the hook
    //   setDisplayedChanges([]); // Clear changes on error
    // }
  }, [portfolioError]);

  // useEffect for filtering is now in useFilteredChanges.js
  // useEffect(() => {
  //   if (portfolio && portfolio.planned_changes) {
  //     let filteredChanges = [...portfolio.planned_changes];
  //     // ... filtering logic ...
  //     setDisplayedChanges(filteredChanges);
  //     // Reset refs when displayed changes update
  //     itemRefs.current = filteredChanges.reduce((acc, change) => {
  //       acc[change.id] = React.createRef();
  //       return acc;
  //     }, {});
  //   } else if (!isPortfolioLoading && !portfolioError) {
  //     setDisplayedChanges([]);
  //     itemRefs.current = {};
  //   }
  // }, [portfolio, filters, portfolioError, isPortfolioLoading]);

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleSelectChange = changeId => {
    setSelectedChangeId(prevId => (prevId === changeId ? null : changeId)); // Toggle selection
  };

  // Functions to control the panel
  const handleOpenAddPanel = () => {
    setEditingChangeData(null); // Ensure we are in 'add' mode
    setIsPanelOpen(true);
  };

  const handleOpenEditPanel = changeData => {
    setEditingChangeData(changeData);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setEditingChangeData(null); // Clear editing data on close
    clearDraftChangeForPreview(); // Clear draft on panel close
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
  }, [selectedChangeId, itemRefs]); // itemRefs is now a dependency

  const handleSaveChanges = async changeDataFromPanel => {
    console.log('ChangesView (handleSaveChanges): portfolio context:', portfolio); // Diagnostic log
    setActionError(null); // Clear previous action errors
    if (!portfolio || !portfolio.portfolio_id) {
      console.error('Portfolio ID is missing, cannot save change.');
      const err = new Error('Portfolio not loaded. Cannot save change.');
      setActionError(err.message);
      throw err;
    }

    // The changeDataFromPanel is already prepared by AddEditChangePanel's handleSubmit
    const dataToSend = { ...changeDataFromPanel };
    const isUpdating = !!dataToSend.id; // if id exists, it's an update

    try {
      if (isUpdating) {
        const changeId = dataToSend.id;
        // Remove id from dataToSend if backend expects it that way for updates, else keep.
        // Assuming backend expects ID in URL, not body for update, or handles it if present.
        // Let's assume dataToSend can keep the id for update service.
        await portfolioService.updatePlannedChange(portfolio.portfolio_id, changeId, dataToSend);
      } else {
        // For adding, ensure no id is sent if backend auto-generates it
        const { id, ...addData } = dataToSend; // remove id if present
        await portfolioService.addPlannedChange(portfolio.portfolio_id, addData);
      }
      // On successful API call
      if (refreshPortfolio) {
        await refreshPortfolio(); // Refresh portfolio data to get updated planned_changes
      }
      // Panel closing is handled by AddEditChangePanel on successful promise resolution
    } catch (apiError) {
      console.error('API Error saving planned change:', apiError);
      // Re-throw the error so AddEditChangePanel can catch it and display it
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

  if (isLoading && !displayedChanges.length) { // Adjusted loading condition
    return <div className="p-4">Loading planned changes...</div>; // Basic loading state
  }

  if (error || actionError) { // Combined general error and action error display
    return (
      <div className="p-4 text-red-600">
        Error: {error?.message || actionError || 'Unknown error'}
      </div>
    ); // Basic error state
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

      {/* Filters Section - Now uses ChangeFilters component */}
      <ChangeFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Main Content Area - Placeholders for Timeline and Details List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Timeline Section */}
        <div
          className="md:col-span-1 bg-white p-4 rounded-lg shadow overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 250px)' }}
        >
          <h3 className="text-md font-semibold text-gray-700 mb-3">Timeline</h3>
          <TimelineView
            plannedChanges={displayedChanges} // Comes from the hook
            selectedChangeId={selectedChangeId}
            onSelectChange={handleSelectChange}
          />
        </div>

        {/* Change Details List - Now uses ChangeDetailsList component */}
        <ChangeDetailsList
          displayedChanges={displayedChanges} // Comes from the hook
          selectedChangeId={selectedChangeId}
          onSelectChange={handleSelectChange}
          onEdit={handleOpenEditPanel}
          onDelete={handleDeleteChange}
          itemRefs={itemRefs} // Comes from the hook
        />
      </div>

      <AddEditChangePanel
        key={editingChangeData ? editingChangeData.id : 'new'}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        initialData={editingChangeData}
        onSave={handleSaveChanges}
        onPreviewRequest={handleRequestPreview}
        // Pass CHANGE_TYPES if it's used by AddEditChangePanel for its own type dropdown
        // changeTypes={CHANGE_TYPES}
      />
    </div>
  );
};

export default ChangesView;
