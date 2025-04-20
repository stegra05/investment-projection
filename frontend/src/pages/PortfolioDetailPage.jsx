import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getPortfolioById } from '../services/portfolioService';
import { PlusIcon } from '@heroicons/react/24/outline';
import styles from './PortfolioDetailPage.module.css'; // Import CSS Module

// Import custom hooks
import { useAssetManagement } from '../hooks/useAssetManagement';
import { useChangeManagement } from '../hooks/useChangeManagement';

// Import extracted components
import AssetForm from '../components/AssetForm';
import AssetList from '../components/AssetList';
import ChangeForm from '../components/ChangeForm';
import ChangeList from '../components/ChangeList';
import ProjectionChart from '../components/ProjectionChart';

// Removed inline styles object

// Main detail page component
export default function PortfolioDetailPage() {
  const { id: portfolioId } = useParams(); // Rename id to portfolioId for clarity
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null); // Error specific to fetching portfolio

  // Callback to refresh portfolio data
  const fetchPortfolio = useCallback(async () => {
    setLoading(true); // Set loading true when refetching
    setPageError(null); // Clear previous page errors
    try {
      const data = await getPortfolioById(portfolioId);
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
      setPageError(err.response?.data?.message || 'Failed to load portfolio details.');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]); // Dependency is portfolioId

  // Fetch initial data
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]); // fetchPortfolio is memoized by useCallback

  // Use custom hooks for managing assets and changes
  // Pass fetchPortfolio as the success callback to refresh data
  const {
    showAssetForm,
    assetToEdit,
    handleAddAssetClick,
    handleEditAssetClick,
    handleCancelAssetForm,
    handleSaveAsset,
    handleDeleteAsset,
    error: assetError, // Get error state from hook if needed
  } = useAssetManagement(portfolioId, fetchPortfolio);

  const {
    showChangeForm,
    changeToEdit,
    handleAddChangeClick,
    handleEditChangeClick,
    handleCancelChangeForm,
    handleSaveChange,
    handleDeleteChange,
    error: changeError, // Get error state from hook
  } = useChangeManagement(portfolioId, fetchPortfolio);


  // Loading state
  if (loading && !portfolio) { // Show loading only on initial load or full refresh
    return <p className={styles.loadingText}>Loading portfolio...</p>;
  }

  // Error state for initial load
  if (pageError) {
    return <p className={styles.errorText}>{pageError}</p>;
  }

  // Portfolio not found state
  if (!portfolio) {
    return <p className={styles.errorText}>Portfolio not found.</p>;
  }

  // Combine hook errors for potential display (optional)
  const currentError = assetError || changeError; // Display first error encountered

  return (
    <main className={styles.main}>
      <h1 className={styles.pageTitle}>{portfolio.name}</h1>
      {portfolio.description && (
        <p className={styles.portfolioDescription}>{portfolio.description}</p>
      )}

      {/* Display any errors from hooks (optional) */}
      {currentError && <p className={styles.errorText}>{currentError}</p>}

      {/* Assets Section */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Assets</h2>
          {!showAssetForm && ( // Only show Add button if form isn't visible
            <button onClick={handleAddAssetClick} className={styles.addButton}>
              <PlusIcon className={styles.addButtonIcon} /> Add Asset
            </button>
          )}
        </header>
        {showAssetForm && (
          <AssetForm
            portfolioId={portfolioId}
            existingAsset={assetToEdit}
            onSaved={handleSaveAsset} // The hook's save handler now acts as the success callback
            onCancel={handleCancelAssetForm}
          />
        )}
        <AssetList
          assets={portfolio.assets}
          onEdit={handleEditAssetClick}
          onDelete={handleDeleteAsset}
        />
      </section>

      {/* Planned Changes Section */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Planned Changes</h2>
           {!showChangeForm && ( // Only show Add button if form isn't visible
              <button onClick={handleAddChangeClick} className={styles.addButton}>
                <PlusIcon className={styles.addButtonIcon} /> Add Change
              </button>
           )}
        </header>
        {showChangeForm && (
          <ChangeForm
            portfolioId={portfolioId}
            existingChange={changeToEdit}
            onSaved={handleSaveChange} // Hook's save handler
            onCancel={handleCancelChangeForm}
          />
        )}
        <ChangeList
          changes={portfolio.planned_changes}
          onEdit={handleEditChangeClick}
          onDelete={handleDeleteChange}
        />
      </section>

      {/* Projection Section */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
             <h2 className={styles.sectionTitle}>Projection</h2>
        </header>
        <ProjectionChart portfolioId={portfolioId} />
      </section>
    </main>
  );
} 