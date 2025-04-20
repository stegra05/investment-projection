import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import styles from './PortfolioDetailPage.module.css';

// Import custom hooks
import { usePortfolioData } from '../hooks/usePortfolioData';
import { useAssetManagement } from '../hooks/useAssetManagement';
import { useChangeManagement } from '../hooks/useChangeManagement';

// Import extracted components
import AssetForm from '../components/AssetForm';
import AssetList from '../components/AssetList';
import ChangeForm from '../components/ChangeForm';
import ChangeList from '../components/ChangeList';
import ProjectionChart from '../components/ProjectionChart';

// Main detail page component
export default function PortfolioDetailPage() {
  const { id: portfolioId } = useParams();

  // --- State Management --- 

  // Use the new hook for portfolio data, loading, error, and refetching
  const { portfolio, loading, error: pageError, refetchPortfolio } = usePortfolioData(portfolioId);

  // State for handling errors from save/delete actions specifically
  const [actionError, setActionError] = useState(null);

  // Use existing hooks for managing assets and changes (without the success callback)
  const {
    showAssetForm,
    assetToEdit,
    handleAddAssetClick,
    handleEditAssetClick,
    handleCancelAssetForm,
    handleSaveAsset: saveAssetHook,
    handleDeleteAsset: deleteAssetHook,
    error: assetHookError, // Get potential error state from hook (e.g., if set internally)
    isProcessing: isAssetProcessing,
    setError: setAssetErrorHook,
  } = useAssetManagement(portfolioId);

  const {
    showChangeForm,
    changeToEdit,
    handleAddChangeClick,
    handleEditChangeClick,
    handleCancelChangeForm,
    handleSaveChange: saveChangeHook,
    handleDeleteChange: deleteChangeHook,
    error: changeHookError,
    isProcessing: isChangeProcessing,
    setError: setChangeErrorHook,
  } = useChangeManagement(portfolioId);

  // --- Action Handlers with Refetching --- 

  const handleSaveAssetAndRefetch = async (assetData) => {
    setActionError(null); // Clear previous action errors
    setAssetErrorHook(null); // Clear hook internal error
    try {
      await saveAssetHook(assetData);
      await refetchPortfolio(); // Refetch portfolio data on success
    } catch (err) {
      // Error is already logged in the hook, hook might set its internal error state
      // We can set a page-level action error here for display if needed
      setActionError(assetHookError || 'Failed to save asset.');
    }
  };

  const handleDeleteAssetAndRefetch = async (asset) => {
    setActionError(null);
    setAssetErrorHook(null);
    try {
      await deleteAssetHook(asset);
      await refetchPortfolio();
    } catch (err) {
      setActionError(assetHookError || 'Failed to delete asset.');
    }
  };

  const handleSaveChangeAndRefetch = async (changeData) => {
    setActionError(null);
    setChangeErrorHook(null);
    try {
      await saveChangeHook(changeData);
      await refetchPortfolio();
    } catch (err) {
      setActionError(changeHookError || 'Failed to save change.');
    }
  };

  const handleDeleteChangeAndRefetch = async (change) => {
    setActionError(null);
    setChangeErrorHook(null);
    try {
      await deleteChangeHook(change);
      await refetchPortfolio();
    } catch (err) {
      setActionError(changeHookError || 'Failed to delete change.');
    }
  };

  // --- Render Logic --- 

  // Loading state (uses loading from usePortfolioData)
  if (loading) { // Simplified loading check
    return <p className={styles.loadingText}>Loading portfolio...</p>;
  }

  // Error state for initial load (uses error from usePortfolioData)
  if (pageError && !portfolio) { // Show page error if portfolio couldn't be loaded
    return <p className={styles.errorText}>{pageError}</p>;
  }

  // Portfolio not found state (if loading is false, no error, but no portfolio)
  if (!portfolio) {
    return <p className={styles.errorText}>Portfolio data is unavailable.</p>;
  }

  // Combine hook errors for potential display (optional)
  // Prioritize page load error, then specific action errors
  const currentError = pageError || actionError;

  return (
    <main className={styles.main}>
      <h1 className={styles.pageTitle}>{portfolio.name}</h1>
      {portfolio.description && (
        <p className={styles.portfolioDescription}>{portfolio.description}</p>
      )}

      {/* Display page load or action errors */} 
      {currentError && <p className={styles.errorText}>{currentError}</p>}

      {/* Assets Section */} 
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Assets</h2>
          {!showAssetForm && ( 
            <button
              onClick={handleAddAssetClick}
              className={styles.addButton}
              disabled={isAssetProcessing} // Disable if asset operation is processing
            >
              <PlusIcon className={styles.addButtonIcon} /> Add Asset
            </button>
          )}
        </header>
        {/* Display asset hook specific errors right above the form/list? Optional */} 
        {/* {assetHookError && <p className={styles.warningText}>{assetHookError}</p>} */} 
        {showAssetForm && (
          <AssetForm
            portfolioId={portfolioId}
            existingAsset={assetToEdit}
            onSaved={handleSaveAssetAndRefetch} // Use the new wrapper function
            onCancel={handleCancelAssetForm}
            isProcessing={isAssetProcessing} // Pass processing state
            // Pass setError maybe? Or let the form handle its validation errors?
            // setError={setAssetErrorHook} 
          />
        )}
        <AssetList
          assets={portfolio.assets || []} // Ensure assets is an array
          onEdit={handleEditAssetClick}
          onDelete={handleDeleteAssetAndRefetch} // Use the new wrapper function
          disabled={isAssetProcessing || isChangeProcessing} // Disable list actions during any processing
        />
      </section>

      {/* Planned Changes Section */} 
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Planned Changes</h2>
           {!showChangeForm && ( 
              <button 
                onClick={handleAddChangeClick} 
                className={styles.addButton}
                disabled={isChangeProcessing} // Disable if change operation is processing
              >
                <PlusIcon className={styles.addButtonIcon} /> Add Change
              </button>
           )}
        </header>
        {/* {changeHookError && <p className={styles.warningText}>{changeHookError}</p>} */} 
        {showChangeForm && (
          <ChangeForm
            portfolioId={portfolioId}
            existingChange={changeToEdit}
            onSaved={handleSaveChangeAndRefetch} // Use the new wrapper function
            onCancel={handleCancelChangeForm}
            isProcessing={isChangeProcessing}
            // setError={setChangeErrorHook}
          />
        )}
        <ChangeList
          changes={portfolio.planned_changes || []} // Ensure changes is an array
          onEdit={handleEditChangeClick}
          onDelete={handleDeleteChangeAndRefetch} // Use the new wrapper function
          disabled={isAssetProcessing || isChangeProcessing} // Disable list actions during any processing
        />
      </section>

      {/* Projection Section */} 
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
             <h2 className={styles.sectionTitle}>Projection</h2>
        </header>
        {/* Display loading/error state specific to projection if needed */}
        <ProjectionChart portfolioId={portfolioId} />
      </section>
    </main>
  );
} 