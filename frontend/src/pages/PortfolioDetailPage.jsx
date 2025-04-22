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
import { useAllocationManagement } from '../hooks/useAllocationManagement';
import { usePortfolioModals } from '../hooks/usePortfolioModals.jsx';

// Import extracted components
import AssetList from '../components/AssetList';
import ChangeList from '../components/ChangeList';
import ProjectionChart from '../components/ProjectionChart';
import Modal from '../components/Modal';
import Button from '../components/Button';
import PortfolioSummary from '../components/PortfolioSummary';
import Input from '../components/Input';
import PortfolioPageHeader from '../components/PortfolioPageHeader';
import AssetsSectionHeader from '../components/AssetsSectionHeader';
import ChangesSectionHeader from '../components/ChangesSectionHeader';
import ProjectionSectionHeader from '../components/ProjectionSectionHeader';
import TotalValueInputSection from '../components/TotalValueInputSection';

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

  // *** Use the new Allocation Management hook ***
  const {
    currentAllocations,
    totalCurrentAllocation,
    allocationsChanged,
    isSavingAllocations,
    handleAllocationChange,
    handleSaveAllocations,
    saveSuccess,
  } = useAllocationManagement(portfolioId, portfolio?.assets, refetchPortfolio);

  // UPDATED: Use manualTotalValue state as the source for calculatedTotalValue
  const calculatedTotalValue = useMemo(() => {
    const numericValue = parseFloat(manualTotalValue);
    return isNaN(numericValue) ? 0 : numericValue; // Default to 0 if input is not a valid number
  }, [manualTotalValue]);

  // --- Action Handlers with Refetching (Moved Before usePortfolioModals) ---

  // Called from AssetForm onSubmit
  const handleSaveAssetAndRefetch = useCallback(async (assetData) => {
    const scrollPosition = window.scrollY; // Store scroll position
    setAssetErrorHook(null); // Clear previous specific error
    let saveSucceeded = false; // Flag to track if hook resolved successfully
    try {
      await saveAssetHook(assetData); // Call the hook
      saveSucceeded = true;         // If await completes without throwing, mark success
      toast.success('Asset saved successfully!');
    } catch (err) {
      // Error should be set in the hook's state and logged there
      console.log('[DEBUG] Inside catch block. Value of assetHookError:', assetHookError);
      const message = assetHookError || 'Failed to save asset.'; // Use error from hook if available
      toast.error(message);
      // Keep modal open on error, do not set saveSucceeded = true
    } finally {
      // Only refetch if the save operation (within the hook) was successful
      if (saveSucceeded) {
        try {
          await refetchPortfolio(); // Refetch the portfolio data
          console.log("Portfolio refetched successfully after asset save.");
          // Restore scroll position after refetch and re-render
          requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
        } catch (refetchError) {
          console.error("Failed to refetch portfolio after saving asset:", refetchError);
          // Show separate error for refetch failure? Or is the initial success toast enough?
          toast.error("Failed to refresh portfolio data after saving.");
        }
      }
      // If !saveSucceeded, the catch block handled the error message,
      // modal remains open, and we don't refetch because the save failed.
    }
  }, [saveAssetHook, setAssetErrorHook, assetHookError, refetchPortfolio]);

  // Called from DeleteConfirmation for assets
  const handleDeleteAssetConfirmed = useCallback(async (assetToDelete) => {
    if (!assetToDelete) return;

    const scrollPosition = window.scrollY; // Store scroll position
    setAssetErrorHook(null); // Clear previous asset error
    let deleteSucceeded = false;
    try {
      await deleteAssetHook(assetToDelete);
      // After deleting, refetch to update the list and allocations state
      // Refetch will now also update the allocation hook's internal state via the useEffect
      await refetchPortfolio(); // Refetch on success
      // Restore scroll position after refetch and re-render
      deleteSucceeded = true;
      toast.success('Asset deleted successfully!');
    } catch (err) {
      // Error is handled by hook, display via toast
      const message = assetHookError || 'Failed to delete asset.';
      toast.error(message);
      // Keep modal open on error
    } finally {
      if (deleteSucceeded) {
        try {
          await refetchPortfolio(); // Refetch on success
          requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
        } catch (refetchError) {
          console.error("Failed to refetch portfolio after deleting asset:", refetchError);
          toast.error("Failed to refresh portfolio data after deleting.");
        }
      }
    }
  }, [deleteAssetHook, setAssetErrorHook, assetHookError, refetchPortfolio]);

  // Called from ChangeForm onSubmit
  const handleSaveChangeAndRefetch = useCallback(async (changeData) => {
    const scrollPosition = window.scrollY; // Store scroll position
    setChangeErrorHook(null); // Clear previous change error
    let saveSucceeded = false; // Flag to track if change hook resolved
    try {
      await saveChangeHook(changeData);
      saveSucceeded = true; // Mark success
      toast.success('Planned change saved successfully!');
    } catch (err) {
      // Error handled by hook, display via toast
      const message = changeHookError || 'Failed to save change.';
      toast.error(message);
      // Keep modal open on error
    } finally {
       if (saveSucceeded) {
         try {
            await refetchPortfolio(); // Refetch on success
            // Restore scroll position after refetch and re-render
            requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
         } catch (refetchError) {
            console.error("Failed to refetch portfolio after saving change:", refetchError);
            toast.error("Failed to refresh portfolio data after saving.");
         }
       }
    }
  }, [saveChangeHook, setChangeErrorHook, changeHookError, refetchPortfolio]);

  // Called from DeleteConfirmation for changes
  const handleDeleteChangeConfirmed = useCallback(async (changeToDelete) => {
    if (!changeToDelete) return;

    const scrollPosition = window.scrollY; // Store scroll position
    setChangeErrorHook(null); // Clear previous change error
    let deleteSucceeded = false;
    try {
      await deleteChangeHook(changeToDelete);
      await refetchPortfolio(); // Refetch on success
      // Restore scroll position after refetch and re-render
      deleteSucceeded = true;
      toast.success('Planned change deleted successfully!');
    } catch (err) {
      // Error handled by hook, display via toast
      const message = changeHookError || 'Failed to delete change.';
      toast.error(message);
      // Keep modal open on error
    } finally {
      if (deleteSucceeded) {
        try {
          await refetchPortfolio(); // Refetch on success
          requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
        } catch (refetchError) {
          console.error("Failed to refetch portfolio after deleting change:", refetchError);
          toast.error("Failed to refresh portfolio data after deleting.");
        }
      }
    }
  }, [deleteChangeHook, setChangeErrorHook, changeHookError, refetchPortfolio]);

  // Called from DeleteConfirmation for portfolio
  const handleDeletePortfolioConfirmed = useCallback(async () => {
    try {
      await deletePortfolioHook();
      // No need to refetch, we are navigating away
      toast.success(`Portfolio "${portfolio?.name || 'this portfolio'}" deleted successfully!`);
      navigate('/portfolios'); // Navigate away
    } catch (err) {
      // Use hook error if available (pageError), otherwise generic message
      const message = pageError || 'Failed to delete portfolio.';
      toast.error(message);
      // Keep modal open on error
    }
  }, [deletePortfolioHook, portfolio?.name, navigate, pageError]);

  // --- Use the Modal Hook ---
  const {
    modalProps,
    openAddAssetModal,
    openEditAssetModal,
    openDeleteAssetModal,
    openAddChangeModal,
    openEditChangeModal,
    openDeleteChangeModal,
    openDeletePortfolioModal,
  } = usePortfolioModals({
    portfolioId,
    portfolioData: portfolio,
    onSaveAsset: handleSaveAssetAndRefetch,
    onDeleteAssetConfirm: handleDeleteAssetConfirmed,
    onSaveChange: handleSaveChangeAndRefetch,
    onDeleteChangeConfirm: handleDeleteChangeConfirmed,
    onDeletePortfolioConfirm: handleDeletePortfolioConfirmed,
    isAssetProcessing,
    isChangeProcessing,
  });

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

  // Prepare props for header
  const editPortfolioHandler = () => navigate(`/portfolios/${portfolioId}/edit`);
  const isActionDisabled = isAssetProcessing || isChangeProcessing || isSavingAllocations;

  return (
    <main className={styles.main}>
      {/* Use the new header component */}
      <PortfolioPageHeader 
        portfolioName={portfolio.name}
        portfolioDescription={portfolio.description}
        onEdit={editPortfolioHandler}
        onDelete={openDeletePortfolioModal} // Use the modal opening function
        disabled={isActionDisabled}
        styles={styles} // Pass the styles object
      />

      {/* Use the new Total Value Input Section component */}
      <TotalValueInputSection 
        value={manualTotalValue}
        onChange={(e) => setManualTotalValue(e.target.value)}
        // Pass id, label, placeholder, step, note if needed, or rely on defaults
        styles={styles}
      />

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

      {/* Wrap Assets, Changes, and Projection sections in a grid container */}
      <div className={styles.sectionsGrid}>
        {/* Assets Section - Now includes allocation management */}
        <section className={styles.section}>
          <AssetsSectionHeader
            totalCurrentAllocation={totalCurrentAllocation}
            allocationsChanged={allocationsChanged}
            onSaveAllocations={handleSaveAllocations}
            isSavingAllocations={isSavingAllocations}
            saveSuccess={saveSuccess}
            onAddAsset={openAddAssetModal}
            disabled={isActionDisabled}
            styles={styles}
          />

          <AssetList
            assets={portfolio.assets || []}
            allocations={currentAllocations}
            onAllocationChange={handleAllocationChange}
            onEdit={openEditAssetModal}
            onDelete={openDeleteAssetModal}
            disabled={isActionDisabled}
            portfolioId={portfolioId}
          />
        </section>

        {/* Planned Changes Section */}
        <section className={styles.section}>
          <ChangesSectionHeader
            onAddChange={openAddChangeModal}
            disabled={isActionDisabled}
            styles={styles}
          />

          <ChangeList
            changes={portfolio.planned_changes || []}
            onEdit={openEditChangeModal}
            onDelete={openDeleteChangeModal}
            disabled={isActionDisabled}
          />
        </section>

        {/* Projection Section - Add projectionSection class */}
        <section className={`${styles.section} ${styles.projectionSection}`}>
          {/* Use the new Projection Section Header */}
          <ProjectionSectionHeader styles={styles} />

           {/* Pass current allocations to projection chart if it needs them directly */}
           {/* Ensure ProjectionChart uses the fetched/refreshed portfolio data primarily */}
          <ProjectionChart
            portfolioId={portfolioId}
            initialProjectionValue={calculatedTotalValue}
            // Optional: Pass currentAllocations if the chart needs live updates
            // allocations={currentAllocations}
          />
        </section>
      </div> {/* End of sectionsGrid */}

      <Modal {...modalProps} />
    </main>
  );
}
