import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../state/PortfolioContext'; 
import TimelineView from '../components/TimelineView.jsx';
import AddEditChangePanel from '../components/AddEditChangePanel.jsx';
import ChangeFilters from '../components/ChangeFilters.jsx';
import ChangeDetailsList from '../components/ChangeDetailsList.jsx';
import useFilteredChanges from '../hooks/useFilteredChanges';
import useNotification from '../../../hooks/useNotification';
import { usePlannedChangeCRUD } from '../hooks/usePlannedChangeCRUD';
import Spinner from '../../../components/Spinner/Spinner.jsx'; 
import Button from '../../../components/Button/Button.jsx'; 

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
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">Planned Changes</h2>
        <Button
          variant="primary"
          onClick={handleOpenAddPanel}
          // The original button had text-sm. If this is desired, add className="text-sm"
          // Default primary button size/font should be acceptable for consistency.
        >
          Add New Change
        </Button>
      </header>

      <ChangeFilters filters={filters} onFilterChange={handleFilterChange} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="md:col-span-1 bg-white p-4 rounded-lg shadow overflow-y-auto min-h-0"
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
