import React, { useState, useEffect, useRef } from 'react';
import { usePortfolio } from '../state/PortfolioContext'; // Corrected path
import TimelineView from '../components/TimelineView'; // Import TimelineView
import AddEditChangePanel from '../components/AddEditChangePanel'; // Import the new panel
import ChangeFilters from '../components/ChangeFilters';
import ChangeDetailsList from '../components/ChangeDetailsList';
import useFilteredChanges from '../hooks/useFilteredChanges';
import useNotification from '../../../hooks/useNotification'; // Import the hook
import { usePlannedChangeCRUD } from '../hooks/usePlannedChangeCRUD'; // Import the new CRUD hook
import Spinner from '../../../components/Spinner/Spinner'; // Import Spinner

const ChangesView = () => {
  const {
    portfolio,
    isLoading: isPortfolioLoading,
    error: portfolioError,
    refreshPortfolio,
    setDraftChangeForPreview,
    clearDraftChangeForPreview,
  } = usePortfolio();
  const { addNotification } = useNotification(); // Use the hook

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [selectedChangeId, setSelectedChangeId] = useState(null);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingChangeData, setEditingChangeData] = useState(null);

  const { displayedChanges, itemRefs } = useFilteredChanges(
    portfolio,
    filters,
    isPortfolioLoading,
    portfolioError
  );

  // Instantiate the CRUD hook
  const { savePlannedChange, deletePlannedChange } = usePlannedChangeCRUD({
    portfolioId: portfolio?.portfolio_id,
    refreshPortfolio,
    addNotification,
  });

  useEffect(() => {
    setIsLoading(isPortfolioLoading);
  }, [isPortfolioLoading]);

  // Display initial portfolio loading error via notification if it occurs
  useEffect(() => {
    if (portfolioError) {
      addNotification(portfolioError.message || 'Error loading portfolio data.', 'error');
    }
  }, [portfolioError, addNotification]);

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

  // Wrapper for delete to match expected signature if any, or to handle UI logic like clearing selection
  const handleDeleteChangeWrapper = async (changeId) => {
    const success = await deletePlannedChange(changeId);
    if (success && selectedChangeId === changeId) {
      setSelectedChangeId(null); // Clear selection if deleted item was selected
    }
  };

  const handleRequestPreview = draftData => {
    if (!portfolio || !portfolio.portfolio_id) {
      addNotification('Portfolio not loaded. Cannot request preview.', 'error');
      return;
    }
    setDraftChangeForPreview(draftData);
  };

  // Create a map of asset IDs to names
  const assetIdToNameMap = React.useMemo(() => {
    if (!portfolio || !portfolio.assets) {
      return {};
    }
    return portfolio.assets.reduce((acc, asset) => {
      acc[asset.asset_id] = asset.name_or_ticker || `Asset ${asset.asset_id}`;
      return acc;
    }, {});
  }, [portfolio]);

  if (isLoading && !displayedChanges.length && !portfolioError) {
    return (
      <div className="p-4 flex justify-center items-center min-h-[200px]">
        <Spinner size="h-8 w-8" />
      </div>
    );
  }

  // Initial load error is handled by useEffect notification, so don't show generic error div for it
  // Action errors (save/delete) are now toasts.

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
          onDelete={handleDeleteChangeWrapper}
          itemRefs={itemRefs}
          assetIdToNameMap={assetIdToNameMap}
        />
      </div>

      <AddEditChangePanel
        key={editingChangeData ? editingChangeData.id : 'new'}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        initialData={editingChangeData}
        onSave={savePlannedChange}
        onPreviewRequest={handleRequestPreview}
      />
    </div>
  );
};

export default ChangesView;
