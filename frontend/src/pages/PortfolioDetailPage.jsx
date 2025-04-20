import React, { useState, useCallback } from 'react';
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
import Modal from '../components/Modal';
import AssetForm from '../components/AssetForm';
import ChangeForm from '../components/ChangeForm';
import DeleteConfirmation from '../components/DeleteConfirmation';

// Define modal types
const MODAL_TYPES = {
  ADD_ASSET: 'ADD_ASSET',
  EDIT_ASSET: 'EDIT_ASSET',
  DELETE_ASSET: 'DELETE_ASSET',
  ADD_CHANGE: 'ADD_CHANGE',
  EDIT_CHANGE: 'EDIT_CHANGE',
  DELETE_CHANGE: 'DELETE_CHANGE',
};

// Main detail page component
export default function PortfolioDetailPage() {
  const { id: portfolioId } = useParams();

  // --- State Management ---

  // Use the new hook for portfolio data, loading, error, and refetching
  const { portfolio, loading, error: pageError, refetchPortfolio } = usePortfolioData(portfolioId);

  // State for modal management { type: MODAL_TYPES | null, data: any }
  const [modalState, setModalState] = useState({ type: null, data: null });

  // State for handling errors from save/delete actions specifically
  const [actionError, setActionError] = useState(null);

  // Use existing hooks for managing assets and changes
  // Note: The click handlers in these hooks might become less relevant if forms are always in modals
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


  // --- Modal Management ---

  const closeModal = useCallback(() => {
    setModalState({ type: null, data: null });
    setActionError(null); // Clear action errors when closing modal
    setAssetErrorHook(null); // Clear hook errors
    setChangeErrorHook(null); // Clear hook errors
  }, [setAssetErrorHook, setChangeErrorHook]); // Dependencies for clearing errors


  // --- Action Handlers with Refetching ---

  // Called from AssetForm onSubmit
  const handleSaveAssetAndRefetch = async (assetData) => {
    setActionError(null);
    setAssetErrorHook(null);
    try {
      // The AssetForm component now handles distinguishing between create/update
      // It calls the appropriate service function (createAsset/updateAsset)
      // We just need to ensure refetching and closing the modal on success
      await saveAssetHook(assetData); // Assume saveAssetHook handles create/update logic based on assetData
      await refetchPortfolio();
      closeModal(); // Close modal on success
    } catch (err) {
      // AssetForm likely handles its own error display, but we might catch broader errors here
      setActionError(assetHookError || 'Failed to save asset.');
      // Keep modal open to show error within the form
    }
  };

  // Called from DeleteConfirmation for assets
  const handleDeleteAssetConfirmed = async () => {
    const assetToDelete = modalState.data;
    if (!assetToDelete) return;

    setActionError(null);
    setAssetErrorHook(null);
    try {
      await deleteAssetHook(assetToDelete); // Call the hook's delete function
      await refetchPortfolio();
      closeModal(); // Close modal on success
    } catch (err) {
      setActionError(assetHookError || 'Failed to delete asset.');
      // Keep modal open or potentially close and show error on page?
      // For now, keep modal open to show error within confirmation (if needed) or close? Let's close.
      closeModal();
      setActionError(assetHookError || 'Failed to delete asset.'); // Show error on page after closing
    }
  };


  // Called from ChangeForm onSubmit
  const handleSaveChangeAndRefetch = async (changeData) => {
    setActionError(null);
    setChangeErrorHook(null);
    try {
      // ChangeForm handles create/update distinction
      await saveChangeHook(changeData); // Assume hook handles create/update
      await refetchPortfolio();
      closeModal(); // Close modal on success
    } catch (err) {
      setActionError(changeHookError || 'Failed to save change.');
      // Keep modal open
    }
  };

 // Called from DeleteConfirmation for changes
 const handleDeleteChangeConfirmed = async () => {
    const changeToDelete = modalState.data;
    if (!changeToDelete) return;

    setActionError(null);
    setChangeErrorHook(null);
    try {
      await deleteChangeHook(changeToDelete);
      await refetchPortfolio();
      closeModal();
    } catch (err) {
      // Close modal and show error on page
      closeModal();
      setActionError(changeHookError || 'Failed to delete change.');
    }
  };


  // --- Event Handlers for Triggering Modals ---

  const openAddAssetModal = () => {
    setModalState({ type: MODAL_TYPES.ADD_ASSET, data: null });
  };

  const openEditAssetModal = (asset) => {
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

  const currentError = actionError;

  return (
    <main className={styles.main}>
      <h1 className={styles.pageTitle}>{portfolio.name}</h1>
      {portfolio.description && (
        <p className={styles.portfolioDescription}>{portfolio.description}</p>
      )}

      {currentError && <p className={`${styles.errorText} ${styles.actionError}`}>{currentError}</p>}

      {/* Assets Section */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Assets</h2>
          <button
            onClick={openAddAssetModal}
            className={styles.addButton}
            disabled={isAssetProcessing || isChangeProcessing}
          >
            <PlusIcon className={styles.addButtonIcon} /> Add Asset
          </button>
        </header>
        <AssetList
          assets={portfolio.assets || []}
          onEdit={openEditAssetModal}
          onDelete={openDeleteAssetModal}
          disabled={isAssetProcessing || isChangeProcessing}
        />
      </section>

      {/* Planned Changes Section */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Planned Changes</h2>
          <button
            onClick={openAddChangeModal}
            className={styles.addButton}
            disabled={isAssetProcessing || isChangeProcessing}
          >
            <PlusIcon className={styles.addButtonIcon} /> Add Change
          </button>
        </header>
        <ChangeList
          changes={portfolio.planned_changes || []}
          onEdit={openEditChangeModal}
          onDelete={openDeleteChangeModal}
          disabled={isAssetProcessing || isChangeProcessing}
        />
      </section>

      {/* Projection Section */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
             <h2 className={styles.sectionTitle}>Projection</h2>
        </header>
        <ProjectionChart portfolioId={portfolioId} />
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
           handleSaveAssetAndRefetch,
           handleDeleteAssetConfirmed,
           handleSaveChangeAndRefetch,
           handleDeleteChangeConfirmed,
           isAssetProcessing,
           isChangeProcessing
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
    case MODAL_TYPES.DELETE_ASSET: return 'Confirm Deletion';
    case MODAL_TYPES.ADD_CHANGE: return 'Add Planned Change';
    case MODAL_TYPES.EDIT_CHANGE: return 'Edit Planned Change';
    case MODAL_TYPES.DELETE_CHANGE: return 'Confirm Deletion';
    default: return '';
  }
};

// Helper function to render modal content
const renderModalContent = (
  modalState,
  portfolioId,
  closeModal,
  onSaveAsset,
  onDeleteAssetConfirm,
  onSaveChange,
  onDeleteChangeConfirm,
  isAssetProcessing,
  isChangeProcessing
) => {
  const { type, data } = modalState;

  switch (type) {
    case MODAL_TYPES.ADD_ASSET:
      return (
        <AssetForm
          portfolioId={portfolioId}
          onSaved={onSaveAsset}
          onCancel={closeModal}
        />
      );
    case MODAL_TYPES.EDIT_ASSET:
      return (
        <AssetForm
          portfolioId={portfolioId}
          existingAsset={data}
          onSaved={onSaveAsset}
          onCancel={closeModal}
        />
      );
    case MODAL_TYPES.DELETE_ASSET:
      return (
        <DeleteConfirmation
          itemType="asset"
          itemName={data?.name_or_ticker || data?.name}
          onConfirm={onDeleteAssetConfirm}
          onCancel={closeModal}
          isProcessing={isAssetProcessing}
        />
      );
     case MODAL_TYPES.ADD_CHANGE:
      return (
        <ChangeForm
          portfolioId={portfolioId}
          onSaved={onSaveChange}
          onCancel={closeModal}
        />
      );
    case MODAL_TYPES.EDIT_CHANGE:
      return (
        <ChangeForm
          portfolioId={portfolioId}
          existingChange={data}
          onSaved={onSaveChange}
          onCancel={closeModal}
        />
      );
    case MODAL_TYPES.DELETE_CHANGE:
       return (
         <DeleteConfirmation
           itemType="planned change"
           itemName={data?.description}
           onConfirm={onDeleteChangeConfirm}
           onCancel={closeModal}
           isProcessing={isChangeProcessing}
         />
       );
    default:
      return null;
  }
}; 