import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getPortfolioById } from '../services/portfolioService';
import { PlusIcon } from '@heroicons/react/24/outline';

// Import custom hooks
import { useAssetManagement } from '../hooks/useAssetManagement';
import { useChangeManagement } from '../hooks/useChangeManagement';

// Import extracted components
import AssetForm from '../components/AssetForm';
import AssetList from '../components/AssetList';
import ChangeForm from '../components/ChangeForm';
import ChangeList from '../components/ChangeList';
import ProjectionChart from '../components/ProjectionChart';

// Simplified styles for the page layout
const styles = {
  main: {
    margin: 'var(--space-xl) auto',
    padding: 'var(--space-l)',
    maxWidth: '800px', // Keep content constrained
    // Ensure background color is set for the page content area if needed
    // background: 'var(--color-app-background-light)', // Example
    color: 'var(--color-text-primary-light)', // Ensure text color is set
  },
  pageTitle: {
    fontSize: '2rem', // Use H1 size from typography rules
    fontWeight: 700,
    marginBottom: 'var(--space-xs)', // Adjust spacing
    color: 'var(--color-text-primary-light)',
  },
  portfolioDescription: {
    marginBottom: 'var(--space-xl)', // Larger space after description
    fontSize: '1rem', // Body text size
    color: 'var(--color-text-secondary-light)', // Use secondary color
  },
  section: {
    marginBottom: 'var(--space-xxl)', // Consistent large spacing between sections
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-m)', // Space between header and content/form
    paddingBottom: 'var(--space-s)', // Space below header text/button
    borderBottom: '1px solid var(--color-border-light)', // Optional visual separator
  },
  sectionTitle: {
    fontSize: '1.5rem', // H2 size
    fontWeight: 600,
    margin: 0, // Remove default margins
    color: 'var(--color-text-primary-light)',
  },
  addButton: {
    // Apply button styles based on DLS rules (consider creating a Button component)
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    background: 'transparent',
    border: '1px solid var(--color-primary)', // Secondary button style
    color: 'var(--color-primary)',
    padding: 'var(--space-s) var(--space-m)', // Use standard button padding
    borderRadius: '6px', // Use standard border radius
    cursor: 'pointer',
    fontSize: '0.875rem', // Slightly smaller for add buttons? Or 1rem.
    fontWeight: 500,
    transition: 'background-color 0.2s ease, color 0.2s ease',
    // Add hover/focus states from Button DLS rule
  },
  addButtonIcon: {
    width: '1rem',
    height: '1rem',
  },
  loadingText: {
      padding: 'var(--space-xl)',
      textAlign: 'center',
      fontSize: '1.25rem',
      color: 'var(--color-text-secondary-light)',
  },
  errorText: { // Style for general page errors or hook errors
    padding: 'var(--space-l)',
    color: 'var(--color-error-light)',
    background: 'rgba(222, 53, 11, 0.1)',
    border: '1px solid var(--color-error-light)',
    borderRadius: '4px',
    textAlign: 'center',
    marginBottom: 'var(--space-l)',
  },
};


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
    return <p style={styles.loadingText}>Loading portfolio...</p>;
  }

  // Error state for initial load
  if (pageError) {
    return <p style={styles.errorText}>{pageError}</p>;
  }

  // Portfolio not found state
  if (!portfolio) {
    return <p style={styles.errorText}>Portfolio not found.</p>;
  }

  // Combine hook errors for potential display (optional)
  const currentError = assetError || changeError; // Display first error encountered

  return (
    <main style={styles.main}>
      <h1 style={styles.pageTitle}>{portfolio.name}</h1>
      {portfolio.description && (
        <p style={styles.portfolioDescription}>{portfolio.description}</p>
      )}

      {/* Display any errors from hooks (optional) */}
      {currentError && <p style={styles.errorText}>{currentError}</p>}

      {/* Assets Section */}
      <section style={styles.section}>
        <header style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Assets</h2>
          {!showAssetForm && ( // Only show Add button if form isn't visible
            <button onClick={handleAddAssetClick} style={styles.addButton}>
              <PlusIcon style={styles.addButtonIcon} /> Add Asset
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
      <section style={styles.section}>
        <header style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Planned Changes</h2>
           {!showChangeForm && ( // Only show Add button if form isn't visible
              <button onClick={handleAddChangeClick} style={styles.addButton}>
                <PlusIcon style={styles.addButtonIcon} /> Add Change
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
      <section style={styles.section}>
        <header style={styles.sectionHeader}>
             <h2 style={styles.sectionTitle}>Projection</h2>
        </header>
        <ProjectionChart portfolioId={portfolioId} />
      </section>
    </main>
  );
} 