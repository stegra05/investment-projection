import React, { useState, useEffect, useRef } from 'react';
import { usePortfolio } from '../state/PortfolioContext'; // Corrected path
import TimelineView from '../components/TimelineView'; // Import TimelineView
import ChangeItemCard from '../components/ChangeItemCard'; // Assuming this exists as per Task 2.5
import AddEditChangePanel from '../components/AddEditChangePanel'; // Import the new panel
import portfolioService from '../../../api/portfolioService'; // Adjusted path and import type

// TODO: Define these types, perhaps from a shared enum/constants file
const CHANGE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'CONTRIBUTION', label: 'Contribution' },
  { value: 'WITHDRAWAL', label: 'Withdrawal' },
  { value: 'REALLOCATION', label: 'Reallocation' },
  // Add other types as defined in backend enums
];

const ChangesView = () => {
  const {
    portfolio,
    isLoading: isPortfolioLoading,
    error: portfolioError,
    refreshPortfolio,
    setDraftChangeForPreview, // New from context
    clearDraftChangeForPreview, // New from context
  } = usePortfolio();

  const [displayedChanges, setDisplayedChanges] = useState([]); // Renamed from plannedChanges for clarity
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

  // Refs for scrolling
  const itemRefs = useRef({}); // To store refs for each change item

  useEffect(() => {
    setIsLoading(isPortfolioLoading);
  }, [isPortfolioLoading]);

  useEffect(() => {
    setError(portfolioError);
    if (portfolioError) {
      setDisplayedChanges([]); // Clear changes on error
    }
  }, [portfolioError]);

  useEffect(() => {
    if (portfolio && portfolio.planned_changes) {
      let filteredChanges = [...portfolio.planned_changes];

      // Apply type filter
      if (filters.type) {
        filteredChanges = filteredChanges.filter(change => change.change_type === filters.type);
      }

      // Apply date filters (basic string comparison, consider date objects for more robust filtering)
      if (filters.startDate) {
        filteredChanges = filteredChanges.filter(
          change => new Date(change.change_date) >= new Date(filters.startDate)
        );
      }
      if (filters.endDate) {
        filteredChanges = filteredChanges.filter(
          change => new Date(change.change_date) <= new Date(filters.endDate)
        );
      }

      // Apply description filter (case-insensitive)
      if (filters.description) {
        const searchTerm = filters.description.toLowerCase();
        filteredChanges = filteredChanges.filter(
          change => change.description && change.description.toLowerCase().includes(searchTerm)
        );
      }
      setDisplayedChanges(filteredChanges);
      // Reset refs when displayed changes update
      itemRefs.current = filteredChanges.reduce((acc, change) => {
        acc[change.id] = React.createRef();
        return acc;
      }, {});
    } else if (!isPortfolioLoading && !portfolioError) {
      // Handle case where portfolio is loaded but has no planned_changes or is null
      setDisplayedChanges([]);
      itemRefs.current = {};
    }
  }, [portfolio, filters, portfolioError, isPortfolioLoading]); // Added portfolioError and isPortfolioLoading

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
  }, [selectedChangeId]);

  const handleSaveChanges = async changeDataFromPanel => {
    console.log('ChangesView (handleSaveChanges): portfolio context:', portfolio); // Diagnostic log
    if (!portfolio || !portfolio.portfolio_id) {
      console.error('Portfolio ID is missing, cannot save change.');
      throw new Error('Portfolio not loaded. Cannot save change.');
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
        const { ...addData } = dataToSend; // remove id if present
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
      throw apiError;
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

  if (isLoading) {
    return <div className="p-4">Loading planned changes...</div>; // Basic loading state
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading planned changes: {error.message || 'Unknown error'}
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

      {/* Filters Section */}
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <h2 className="text-md font-semibold text-gray-700 mb-3">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type-filter"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
            >
              {CHANGE_TYPES.map(typeOpt => (
                <option key={typeOpt.value} value={typeOpt.value}>
                  {typeOpt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="start-date-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Date
            </label>
            <input
              type="date"
              id="start-date-filter"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="end-date-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              End Date
            </label>
            <input
              type="date"
              id="end-date-filter"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="description-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <input
              type="text"
              id="description-filter"
              name="description"
              value={filters.description}
              onChange={handleFilterChange}
              placeholder="Search description..."
              className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area - Placeholders for Timeline and Details List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Timeline Section */}
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

        {/* Change Details List Placeholder */}
        <div
          className="md:col-span-2 bg-white p-4 rounded-lg shadow overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 250px)' }}
        >
          <h3 className="text-md font-semibold text-gray-700 mb-3">
            Change Details ({displayedChanges.length})
          </h3>
          {displayedChanges.length > 0 ? (
            <div className="space-y-3">
              {displayedChanges.map(change => (
                <div key={change.id} ref={itemRefs.current[change.id]}>
                  <ChangeItemCard
                    change={change}
                    isSelected={selectedChangeId === change.id}
                    onSelectChange={() => handleSelectChange(change.id)}
                    onEdit={() => handleOpenEditPanel(change)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No planned changes match the current filters.
            </div>
          )}
        </div>
      </div>

      <AddEditChangePanel
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
