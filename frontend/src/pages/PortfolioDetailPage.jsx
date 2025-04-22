import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, ArrowPathIcon as SaveIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import styles from './PortfolioDetailPage.module.css';
import portfolioService from '../services/portfolioService';

// Import custom hooks
import { usePortfolioData } from '../hooks/usePortfolioData';
import { useAssetManagement } from '../hooks/useAssetManagement';
import { useChangeManagement } from '../hooks/useChangeManagement';

// Import extracted components
import AssetList from '../components/AssetList';
import ChangeList from '../components/ChangeList';
import ProjectionChart from '../components/ProjectionChart';
import Modal from '../components/Modal';
import AssetForm from '../components/AssetForm';
import ChangeForm from '../components/ChangeForm';
import DeleteConfirmation from '../components/DeleteConfirmation';
import Button from '../components/Button';
import PortfolioSummary from '../components/PortfolioSummary';
import Input from '../components/Input';

// Define modal types
const MODAL_TYPES = {
  ADD_ASSET: 'ADD_ASSET',
  EDIT_ASSET: 'EDIT_ASSET',
  DELETE_ASSET: 'DELETE_ASSET',
  ADD_CHANGE: 'ADD_CHANGE',
  EDIT_CHANGE: 'EDIT_CHANGE',
  DELETE_CHANGE: 'DELETE_CHANGE',
  DELETE_PORTFOLIO: 'DELETE_PORTFOLIO',
};

// --- Helper function for rounding ---
const roundToTwoDecimals = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// Main detail page component
export default function PortfolioDetailPage() {
  const { id: portfolioId } = useParams();
  const navigate = useNavigate();

  // --- State Management ---

  // Use the new hook for portfolio data, loading, error, and refetching
  const {
    portfolio,
    loading,
    error: pageError,
    refetchPortfolio,
    deletePortfolio: deletePortfolioHook
  } = usePortfolioData(portfolioId);

  // State for modal management { type: MODAL_TYPES | null, data: any }
  const [modalState, setModalState] = useState({ type: null, data: null });

  // State for handling errors from save/delete actions specifically
  const [actionError, setActionError] = useState(null);

  // Use existing hooks for managing assets and changes
  const {
    handleSaveAsset: saveAssetHook,
    handleDeleteAsset: deleteAssetHook,
    error: assetHookError,
    isProcessing: isAssetProcessing,
    setError: setAssetErrorHook,
  } = useAssetManagement(portfolioId);

  const {
    handleSaveChange: saveChangeHook,
    handleDeleteChange: deleteChangeHook,
    error: changeHookError,
    isProcessing: isChangeProcessing,
    setError: setChangeErrorHook,
  } = useChangeManagement(portfolioId);

  // NEW STATE: For user-entered total portfolio value
  const [manualTotalValue, setManualTotalValue] = useState('');

  // NEW STATE: To manage the current allocation percentages locally
  // Format: { [asset_id]: percentage, ... }
  const [currentAllocations, setCurrentAllocations] = useState({});

  // NEW STATE: Track if allocations have changed and need saving
  const [allocationsChanged, setAllocationsChanged] = useState(false);
  const [isSavingAllocations, setIsSavingAllocations] = useState(false); // Loading state for save button

  // Effect to initialize/reset currentAllocations when portfolio data loads or changes
  useEffect(() => {
    if (portfolio?.assets && Array.isArray(portfolio.assets)) {
      const initialAllocations = portfolio.assets.reduce((acc, asset) => {
        // Ensure parsing from string to float, default to 0 if null/undefined/NaN
        const initialPercent = parseFloat(asset.allocation_percentage);
        acc[asset.id] = isNaN(initialPercent) ? 0 : initialPercent;
        return acc;
      }, {});

      // --- Refined Normalization Logic --- 
      const numAssets = portfolio.assets.length;
      if (numAssets > 0) {
          let currentSum = Object.values(initialAllocations).reduce((sum, val) => sum + (Number(val) || 0), 0);
          let remainingDiff = 100 - currentSum;

          // Only normalize if the difference is significant and there are assets to adjust
          if (Math.abs(remainingDiff) > 0.01) {
              if (numAssets === 1) {
                   // If only one asset, set its allocation to 100% directly
                   const onlyAssetId = portfolio.assets[0].id;
                   initialAllocations[onlyAssetId] = 100.00;
                   console.log("Single asset detected, setting initial allocation to 100%");
              } else {
                 // Distribute difference proportionally to existing allocations IF possible
                 // This is complex and might be better handled by simply resetting if sum is wrong?
                 // Alternative: Just ensure the initial state reflects DB, even if not 100%
                 // For now, let's prioritize reflecting DB state accurately and let user adjust.
              }
          }
      }
      // --- End Refined Normalization ---

      // Ensure all values in state are numbers before setting
      const numericAllocations = Object.entries(initialAllocations).reduce((acc, [key, value]) => {
          acc[key] = Number(value) || 0;
          return acc;
      }, {});

      setCurrentAllocations(numericAllocations);
      setAllocationsChanged(false); // Reset changed state on load
    } else {
       setCurrentAllocations({}); // Reset if no assets
       setAllocationsChanged(false);
    }
  }, [portfolio]); // Depend on portfolio data

  // UPDATED: Use manualTotalValue state as the source for calculatedTotalValue
  const calculatedTotalValue = useMemo(() => {
    const numericValue = parseFloat(manualTotalValue);
    return isNaN(numericValue) ? 0 : numericValue; // Default to 0 if input is not a valid number
  }, [manualTotalValue]);

  // --- SIMPLIFIED Allocation Adjustment Logic ---
  const handleAllocationChange = useCallback((changedAssetId, newPercentageStr) => {
    const newPercentage = parseFloat(newPercentageStr);
    if (isNaN(newPercentage)) {
        console.warn("Invalid allocation percentage input (NaN):", newPercentageStr);
        return; // Ignore invalid input
    }
    // Clamp the target value immediately
    const clampedNewPercentage = roundToTwoDecimals(Math.max(0, Math.min(100, newPercentage)));
    const stringChangedAssetId = String(changedAssetId);

    setCurrentAllocations(prevAllocations => {
        // Only update the specific asset that changed
        const updatedAllocations = {
            ...prevAllocations,
            [stringChangedAssetId]: clampedNewPercentage,
        };

        // No redistribution logic here anymore

        setAllocationsChanged(true);
        return updatedAllocations;
    });
  }, []); // Dependencies remain empty as it doesn't rely on external state directly

  // --- Modal Management ---

  const closeModal = useCallback(() => {
    setModalState({ type: null, data: null });
    setActionError(null);
    setAssetErrorHook(null);
    setChangeErrorHook(null);
  }, [setAssetErrorHook, setChangeErrorHook]);

  // --- Action Handlers with Refetching ---

  // Called from AssetForm onSubmit
  const handleSaveAssetAndRefetch = async (assetData) => {
    setActionError(null);
    setAssetErrorHook(null);
    try {
      // Asset form no longer sends allocation, backend defaults to 0
      await saveAssetHook(assetData);
      await refetchPortfolio();
      closeModal();
      toast.success('Asset saved successfully!');
    } catch (err) {
      // Error is handled by hook, just display via toast if it exists
      const message = assetHookError || 'Failed to save asset.';
      toast.error(message);
      // setActionError is removed, hooks manage their errors internally
    }
  };

  // Called from DeleteConfirmation for assets
  const handleDeleteAssetConfirmed = async () => {
    const assetToDelete = modalState.data;
    if (!assetToDelete) return;

    setActionError(null); // Clear any previous general action error
    setAssetErrorHook(null);
    try {
      await deleteAssetHook(assetToDelete);
      // After deleting, refetch to update the list and allocations state
      await refetchPortfolio();
      closeModal();
      toast.success('Asset deleted successfully!');
    } catch (err) {
      // Error is handled by hook, display via toast
      const message = assetHookError || 'Failed to delete asset.';
      toast.error(message);
      // setActionError is removed
      closeModal(); // Close modal even on error
    }
  };

  // --- NEW: Handler for Saving Allocations ---
  const handleSaveAllocations = async () => {
    setActionError(null);
    setIsSavingAllocations(true);
    try {
        // Prepare payload: Array of { asset_id, allocation_percentage } wrapped in object
        const allocationPayload = Object.entries(currentAllocations).map(([id, allocation_percentage]) => ({
            asset_id: parseInt(id, 10), // Use 'asset_id' field name expected by backend schema
            allocation_percentage: allocation_percentage
        }));

        // Wrap the array in an object with the key 'allocations'
        const payload = { allocations: allocationPayload };

        // Pass the wrapped payload to the service function
        await portfolioService.updateAllocations(portfolioId, payload);

        setAllocationsChanged(false); // Reset changed state
        await refetchPortfolio(); // Refetch to confirm backend state matches
        toast.success('Allocations saved successfully!');
    } catch (err) {
        console.error("Failed to save allocations:", err);
        const message = err.response?.data?.message || 'Failed to save allocations.';
        toast.error(message);
        // setActionError is removed
    } finally {
        setIsSavingAllocations(false);
    }
  };

  // Called from ChangeForm onSubmit
  const handleSaveChangeAndRefetch = async (changeData) => {
    setActionError(null);
    setChangeErrorHook(null);
    try {
      await saveChangeHook(changeData);
      await refetchPortfolio();
      closeModal();
      toast.success('Planned change saved successfully!');
    } catch (err) {
      // Error handled by hook, display via toast
      const message = changeHookError || 'Failed to save change.';
      toast.error(message);
      // setActionError is removed
    }
  };

  // Called from DeleteConfirmation for changes
  const handleDeleteChangeConfirmed = async () => {
    const changeToDelete = modalState.data;
    if (!changeToDelete) return;

    setActionError(null); // Clear any previous general action error
    setChangeErrorHook(null);
    try {
      await deleteChangeHook(changeToDelete);
      await refetchPortfolio();
      closeModal();
      toast.success('Planned change deleted successfully!');
    } catch (err) {
      // Error handled by hook, display via toast
      const message = changeHookError || 'Failed to delete change.';
      toast.error(message);
      // setActionError is removed
      closeModal(); // Close modal even on error
    }
  };

  // Called from DeleteConfirmation for portfolio
  const handleDeletePortfolioConfirmed = async () => {
    setActionError(null); // Clear any previous general action error
    try {
      await deletePortfolioHook();
      closeModal();
      toast.success(`Portfolio "${portfolio?.name || 'this portfolio'}" deleted successfully!`);
      navigate('/portfolios');
    } catch (err) {
      // Use hook error if available, otherwise generic message
      // Assuming deletePortfolioHook sets an error state accessible via `pageError` or similar
      const message = pageError || 'Failed to delete portfolio.';
      toast.error(message);
      // setActionError is removed
      closeModal(); // Close modal even on error
    }
  };

  // --- Event Handlers for Triggering Modals ---

  const openAddAssetModal = () => {
    setModalState({ type: MODAL_TYPES.ADD_ASSET, data: null });
  };

  const openEditAssetModal = (asset) => {
    // Pass the full asset data, AssetForm will ignore allocation
    setModalState({ type: MODAL_TYPES.EDIT_ASSET, data: asset });
  };

  const openDeleteAssetModal = (asset) => {
    setModalState({ type: MODAL_TYPES.DELETE_ASSET, data: asset });
  };

  const openAddChangeModal = () => {
    setModalState({ type: MODAL_TYPES.ADD_CHANGE, data: null });
  };

  const openEditChangeModal = (change) => {
    setModalState({ type: MODAL_TYPES.EDIT_CHANGE, data: change });
  };

  const openDeleteChangeModal = (change) => {
    setModalState({ type: MODAL_TYPES.DELETE_CHANGE, data: change });
  };

  // Open portfolio delete confirmation modal
  const openDeletePortfolioModal = () => {
    setModalState({ type: MODAL_TYPES.DELETE_PORTFOLIO, data: portfolio });
  };

  // --- Render Logic ---

  if (loading) {
    return <p className={styles.loadingText}>Loading portfolio...</p>;
  }

  if (pageError && !portfolio) {
    toast.error(`Error loading portfolio details: ${pageError.toString()}`);
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Error loading portfolio details.</p>
        <Button onClick={() => navigate('/portfolios')} variant="secondary">
          Back to Portfolios
        </Button>
      </div>
    );
  }

  if (!portfolio) {
    return (
       <div className={styles.errorContainer}>
        <p className={styles.errorText}>Portfolio not found.</p>
        <Button onClick={() => navigate('/portfolios')} variant="secondary">
          Back to Portfolios
        </Button>
      </div>
    );
  }

  // Calculate total current allocation for display - Ensure values are numbers
  const totalCurrentAllocation = roundToTwoDecimals(Object.values(currentAllocations).reduce((sum, p) => sum + (Number(p) || 0), 0));

  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
            <h1 className={styles.pageTitle}>{portfolio.name}</h1>
            {portfolio.description && (
                <p className={styles.portfolioDescription}>{portfolio.description}</p>
            )}
        </div>
        <div className={styles.headerActions}>
            <Button
                variant="secondary"
                onClick={() => navigate(`/portfolios/${portfolioId}/edit`)}
                icon={<PencilIcon />}
                disabled={isAssetProcessing || isChangeProcessing || isSavingAllocations}
            >
                Edit Portfolio
            </Button>
             <Button
                variant="destructive"
                onClick={openDeletePortfolioModal}
                icon={<TrashIcon />}
                disabled={isAssetProcessing || isChangeProcessing || isSavingAllocations}
            >
                Delete Portfolio
            </Button>
        </div>
      </header>

      {/* --- Manual Total Value Input --- */}
      <section className={`${styles.section} ${styles.manualValueSection}`}>
        <Input
          label="Enter Total Portfolio Value"
          id="manualTotalValue"
          type="number"
          placeholder="e.g., 10000.00"
          value={manualTotalValue}
          onChange={(e) => setManualTotalValue(e.target.value)}
          step="0.01"
        />
        <p className={styles.inputNote}>This value is used to calculate individual asset values based on their allocation percentages for the chart below.</p>
      </section>

      {/* --- Portfolio Summary (Passes the CURRENT allocations and calculatedTotalValue) --- */}
      <PortfolioSummary
        // Pass assets enriched with current allocations
        assets={portfolio.assets?.map(asset => ({
            ...asset,
            // FIX: Convert allocation back to string for PortfolioSummary prop type, use asset.id
            allocation_percentage: (currentAllocations[asset.id] ?? 0).toFixed(2)
        })) || []}
        totalValue={calculatedTotalValue}
      />

      {/* Assets Section - Now includes allocation management */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Assets & Allocation</h2>
          <div className={styles.assetHeaderActions}> {/* Container for buttons */}
            {/* Display Total Allocation and Save Button */}
             <div className={styles.allocationSummary}>
                <span className={`${styles.totalAllocationLabel} ${Math.abs(totalCurrentAllocation - 100) > 0.01 ? styles.totalAllocationWarning : ''}`}> {/* Use tolerance */}
                    Total Allocation: {totalCurrentAllocation.toFixed(2)}%
                </span>
                 {allocationsChanged && (
                    <Button
                        variant="primary"
                        onClick={handleSaveAllocations}
                        icon={<SaveIcon />}
                        // FIX: Adjust loading prop passing
                        disabled={isAssetProcessing || isChangeProcessing || Math.abs(totalCurrentAllocation - 100) > 0.01} // Disable save if not 100% (with tolerance) or processing
                        loading={isSavingAllocations ? true : undefined}
                        className={styles.saveButton} // Add class for specific styling if needed
                    >
                        Save Allocations
                    </Button>
                 )}
              </div>
              <Button
                variant="primary"
                onClick={openAddAssetModal}
                icon={<PlusIcon />}
                disabled={isAssetProcessing || isChangeProcessing || isSavingAllocations}
              >
                Add Asset
              </Button>
          </div>
        </header>
        <AssetList
          assets={portfolio.assets || []}
          allocations={currentAllocations} // Pass current allocation state (contains numbers)
          onAllocationChange={handleAllocationChange} // Pass handler
          onEdit={openEditAssetModal}
          onDelete={openDeleteAssetModal}
          disabled={isAssetProcessing || isChangeProcessing || isSavingAllocations} // Disable list interactions while processing
          portfolioId={portfolioId} // Pass portfolioId if needed inside AssetList
        />
      </section>

      {/* Planned Changes Section */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Planned Changes</h2>
          <Button
            variant="primary"
            onClick={openAddChangeModal}
            icon={<PlusIcon />}
            disabled={isAssetProcessing || isChangeProcessing || isSavingAllocations}
          >
            Add Change
          </Button>
        </header>
        <ChangeList
          changes={portfolio.planned_changes || []}
          onEdit={openEditChangeModal}
          onDelete={openDeleteChangeModal}
          disabled={isAssetProcessing || isChangeProcessing || isSavingAllocations}
        />
      </section>

      {/* Projection Section */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
             <h2 className={styles.sectionTitle}>Projection</h2>
        </header>
         {/* Pass current allocations to projection chart if it needs them directly */}
         {/* Ensure ProjectionChart uses the fetched/refreshed portfolio data primarily */}
        <ProjectionChart
          portfolioId={portfolioId}
          initialProjectionValue={calculatedTotalValue}
          // Optional: Pass currentAllocations if the chart needs live updates
          // allocations={currentAllocations}
        />
      </section>

      <Modal
        isOpen={modalState.type !== null}
        onClose={closeModal}
        title={getModalTitle(modalState.type)}
      >
        {renderModalContent(
           modalState,
           portfolioId,
           closeModal,
           handleSaveAssetAndRefetch, // Pass updated handler
           handleDeleteAssetConfirmed, // Pass updated handler
           handleSaveChangeAndRefetch,
           handleDeleteChangeConfirmed,
           handleDeletePortfolioConfirmed,
           isAssetProcessing, // Pass individual flags if needed by modals
           isChangeProcessing,
           // isSavingAllocations - not directly needed by modals
         )}
      </Modal>
    </main>
  );
}

// Helper function to determine modal title
const getModalTitle = (modalType) => {
  switch (modalType) {
    case MODAL_TYPES.ADD_ASSET: return 'Add New Asset';
    case MODAL_TYPES.EDIT_ASSET: return 'Edit Asset';
    case MODAL_TYPES.DELETE_ASSET: return 'Confirm Delete Asset';
    case MODAL_TYPES.ADD_CHANGE: return 'Add Planned Change';
    case MODAL_TYPES.EDIT_CHANGE: return 'Edit Planned Change';
    case MODAL_TYPES.DELETE_CHANGE: return 'Confirm Delete Change';
    case MODAL_TYPES.DELETE_PORTFOLIO: return 'Confirm Delete Portfolio';
    default: return '';
  }
};

// Helper function to render modal content
const renderModalContent = (
  modalState,
  portfolioId,
  closeModal,
  onSaveAsset, // Renamed prop, ensure AssetForm uses this
  onDeleteAssetConfirm,
  onSaveChange,
  onDeleteChangeConfirm,
  onDeletePortfolioConfirm,
  isAssetProcessing, // Receive individual flags
  isChangeProcessing
) => {
  const { type, data } = modalState;
  // Determine if *any* relevant action is processing
  const isProcessing = isAssetProcessing || isChangeProcessing;

  switch (type) {
    case MODAL_TYPES.ADD_ASSET:
      // Pass onSaveAsset (which is handleSaveAssetAndRefetch)
      return <AssetForm portfolioId={portfolioId} onSubmit={onSaveAsset} onCancel={closeModal} isProcessing={isProcessing} />;
    case MODAL_TYPES.EDIT_ASSET:
      // Pass onSaveAsset (which is handleSaveAssetAndRefetch)
      return <AssetForm portfolioId={portfolioId} initialData={data} onSubmit={onSaveAsset} onCancel={closeModal} isProcessing={isProcessing} />;
    case MODAL_TYPES.DELETE_ASSET:
      // Pass isAssetProcessing specifically if DeleteConfirmation needs finer control
      return <DeleteConfirmation itemType="asset" itemName={data?.name_or_ticker} onConfirm={onDeleteAssetConfirm} onCancel={closeModal} isProcessing={isAssetProcessing} />;
    case MODAL_TYPES.ADD_CHANGE:
      return <ChangeForm portfolioId={portfolioId} onSubmit={onSaveChange} onCancel={closeModal} isProcessing={isProcessing} />;
    case MODAL_TYPES.EDIT_CHANGE:
      return <ChangeForm portfolioId={portfolioId} initialData={data} onSubmit={onSaveChange} onCancel={closeModal} isProcessing={isProcessing} />;
    case MODAL_TYPES.DELETE_CHANGE:
       // Pass isChangeProcessing specifically
      return <DeleteConfirmation itemType="planned change" itemName={data?.description} onConfirm={onDeleteChangeConfirm} onCancel={closeModal} isProcessing={isChangeProcessing} />;
    case MODAL_TYPES.DELETE_PORTFOLIO:
      // Portfolio delete doesn't have its own processing flag here, use general
      return <DeleteConfirmation itemType="portfolio" itemName={data?.name} onConfirm={onDeletePortfolioConfirm} onCancel={closeModal} isProcessing={isProcessing} />;
    default:
      return null;
  }
};
