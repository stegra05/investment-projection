import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import styles from './PortfolioDetailPage.module.css';

// Import custom hooks
import { usePortfolioData } from '../hooks/usePortfolioData';
import { useAssetManagement } from '../hooks/useAssetManagement';
import { useChangeManagement } from '../hooks/useChangeManagement';

// Import extracted components
import AssetList from '../components/AssetList';
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

  // Use existing hooks for managing assets and changes
  // We still need the handlers to potentially trigger modals/navigation later
  const {
    handleAddAssetClick,
    handleEditAssetClick,
    handleSaveAsset: saveAssetHook,
    handleDeleteAsset: deleteAssetHook,
    error: assetHookError,
    isProcessing: isAssetProcessing,
    setError: setAssetErrorHook,
  } = useAssetManagement(portfolioId);

  const {
    handleAddChangeClick,
    handleEditChangeClick,
    handleSaveChange: saveChangeHook,
    handleDeleteChange: deleteChangeHook,
    error: changeHookError,
    isProcessing: isChangeProcessing,
    setError: setChangeErrorHook,
  } = useChangeManagement(portfolioId);

  // --- Action Handlers with Refetching --- 

  // These handlers will likely be called from the modal/edit page components in the future
  const handleSaveAssetAndRefetch = async (assetData) => {
    setActionError(null); 
    setAssetErrorHook(null); 
    try {
      await saveAssetHook(assetData);
      await refetchPortfolio(); 
      // Close modal/navigate back (logic to be added when modal/page is implemented)
    } catch (err) {
      setActionError(assetHookError || 'Failed to save asset.');
      // Keep modal open or show error on edit page 
    }
  };

  const handleDeleteAssetAndRefetch = async (asset) => {
    setActionError(null);
    setAssetErrorHook(null);
    // Confirmation dialog might be good here before deleting
    if (window.confirm(`Are you sure you want to delete asset "${asset.name}"?`)) {
      try {
        await deleteAssetHook(asset);
        await refetchPortfolio();
      } catch (err) {
        setActionError(assetHookError || 'Failed to delete asset.');
      }
    }
  };

  const handleSaveChangeAndRefetch = async (changeData) => {
    setActionError(null);
    setChangeErrorHook(null);
    try {
      await saveChangeHook(changeData);
      await refetchPortfolio();
      // Close modal/navigate back
    } catch (err) {
      setActionError(changeHookError || 'Failed to save change.');
      // Keep modal open or show error on edit page
    }
  };

  const handleDeleteChangeAndRefetch = async (change) => {
    setActionError(null);
    setChangeErrorHook(null);
    // Confirmation dialog
    if (window.confirm(`Are you sure you want to delete this change?`)) {
      try {
        await deleteChangeHook(change);
        await refetchPortfolio();
      } catch (err) {
        setActionError(changeHookError || 'Failed to delete change.');
      }
    }
  };

  // --- Event Handlers for Triggering Modals/Navigation (Placeholders) --- 
  // These will replace the direct calls from buttons/list items

  const openAddAssetModal = () => {
    handleAddAssetClick(); // May need adjustment based on modal implementation
    console.log("Open Add Asset Modal/Page...");
    // TODO: Implement modal opening logic or navigation
  };

  const openEditAssetModal = (asset) => {
    handleEditAssetClick(asset); // Sets assetToEdit in the hook
    console.log("Open Edit Asset Modal/Page for:", asset);
    // TODO: Implement modal opening logic or navigation, passing asset data
  };

  const openAddChangeModal = () => {
    handleAddChangeClick();
    console.log("Open Add Change Modal/Page...");
    // TODO: Implement modal opening logic or navigation
  };

  const openEditChangeModal = (change) => {
    handleEditChangeClick(change);
    console.log("Open Edit Change Modal/Page for:", change);
    // TODO: Implement modal opening logic or navigation, passing change data
  };


  // --- Render Logic --- 

  if (loading) {
    return <p className={styles.loadingText}>Loading portfolio...</p>;
  }

  if (pageError && !portfolio) {
    return <p className={styles.errorText}>{pageError}</p>;
  }

  if (!portfolio) {
    return <p className={styles.errorText}>Portfolio data is unavailable.</p>;
  }

  const currentError = pageError || actionError;

  return (
    <main className={styles.main}>
      <h1 className={styles.pageTitle}>{portfolio.name}</h1>
      {portfolio.description && (
        <p className={styles.portfolioDescription}>{portfolio.description}</p>
      )}

      {currentError && <p className={styles.errorText}>{currentError}</p>}

      {/* Assets Section */} 
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Assets</h2>
          {/* Always show Add button, trigger modal/navigation */}
          <button
            onClick={openAddAssetModal} // Use the new handler
            className={styles.addButton}
            disabled={isAssetProcessing || isChangeProcessing} // Disable if any operation is processing
          >
            <PlusIcon className={styles.addButtonIcon} /> Add Asset
          </button>
        </header>
        <AssetList
          assets={portfolio.assets || []} 
          onEdit={openEditAssetModal} // Use the new handler
          onDelete={handleDeleteAssetAndRefetch} // Keep existing delete
          disabled={isAssetProcessing || isChangeProcessing} 
        />
      </section>

      {/* Planned Changes Section */} 
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Planned Changes</h2>
          {/* Always show Add button, trigger modal/navigation */}
          <button 
            onClick={openAddChangeModal} // Use the new handler
            className={styles.addButton}
            disabled={isAssetProcessing || isChangeProcessing} 
          >
            <PlusIcon className={styles.addButtonIcon} /> Add Change
          </button>
        </header>
        <ChangeList
          changes={portfolio.planned_changes || []} 
          onEdit={openEditChangeModal} // Use the new handler
          onDelete={handleDeleteChangeAndRefetch} // Keep existing delete
          disabled={isAssetProcessing || isChangeProcessing} 
        />
      </section>

      {/* Projection Section */} 
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
             <h2 className={styles.sectionTitle}>Projection</h2>
             {/* No add button for projection */}
        </header>
        <ProjectionChart portfolioId={portfolioId} />
      </section>
    </main>
  );
} 