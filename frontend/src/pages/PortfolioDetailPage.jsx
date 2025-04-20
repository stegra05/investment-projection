import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
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
import Button from '../components/Button';

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
      await saveAssetHook(assetData);
      await refetchPortfolio();
      closeModal();
      toast.success('Asset saved successfully!');
    } catch (err) {
      setActionError(assetHookError || 'Failed to save asset.');
    }
  };

  // Called from DeleteConfirmation for assets
  const handleDeleteAssetConfirmed = async () => {
    const assetToDelete = modalState.data;
    if (!assetToDelete) return;

    setActionError(null);
    setAssetErrorHook(null);
    try {
      await deleteAssetHook(assetToDelete);
      await refetchPortfolio();
      closeModal();
      toast.success('Asset deleted successfully!');
    } catch (err) {
      closeModal();
      setActionError(assetHookError || 'Failed to delete asset.');
      toast.error(assetHookError || 'Failed to delete asset.');
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
      setActionError(changeHookError || 'Failed to save change.');
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
      toast.success('Planned change deleted successfully!');
    } catch (err) {
      closeModal();
      setActionError(changeHookError || 'Failed to delete change.');
      toast.error(changeHookError || 'Failed to delete change.');
    }
  };

  // Called from DeleteConfirmation for portfolio
  const handleDeletePortfolioConfirmed = async () => {
    setActionError(null);
    try {
      await deletePortfolioHook();
      closeModal();
      toast.success(`Portfolio "${portfolio?.name || 'this portfolio'}" deleted successfully!`);
      navigate('/portfolios');
    } catch (err) {
      closeModal();
      setActionError('Failed to delete portfolio.');
      toast.error('Failed to delete portfolio.');
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

  // Open portfolio delete confirmation modal
  const openDeletePortfolioModal = () => {
    setModalState({ type: MODAL_TYPES.DELETE_PORTFOLIO, data: portfolio });
  };

  // --- Render Logic ---

  if (loading) {
    return <p className={styles.loadingText}>Loading portfolio...</p>;
  }

  if (pageError && !portfolio) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Error loading portfolio details.</p>
        <p className={styles.errorDetails}>{pageError.toString()}</p>
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

  const currentActionError = actionError || assetHookError || changeHookError;
  const isProcessing = isAssetProcessing || isChangeProcessing;

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
                disabled={isProcessing} 
            >
                Edit Portfolio
            </Button>
             <Button
                variant="destructive"
                onClick={openDeletePortfolioModal}
                icon={<TrashIcon />}
                disabled={isProcessing}
            >
                Delete Portfolio
            </Button>
        </div>
      </header>

      {currentActionError && <p className={`${styles.errorText} ${styles.actionError}`}>{currentActionError}</p>}

      {/* Assets Section */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Assets</h2>
          <Button
            variant="primary"
            onClick={openAddAssetModal}
            icon={<PlusIcon />}
            disabled={isProcessing}
          >
            Add Asset
          </Button>
        </header>
        <AssetList
          assets={portfolio.assets || []}
          onEdit={openEditAssetModal}
          onDelete={openDeleteAssetModal}
          disabled={isProcessing}
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
            disabled={isProcessing}
          >
            Add Change
          </Button>
        </header>
        <ChangeList
          changes={portfolio.planned_changes || []}
          onEdit={openEditChangeModal}
          onDelete={openDeleteChangeModal}
          disabled={isProcessing}
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
           handleDeletePortfolioConfirmed,
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
  onSaveAsset,
  onDeleteAssetConfirm,
  onSaveChange,
  onDeleteChangeConfirm,
  onDeletePortfolioConfirm,
  isAssetProcessing,
  isChangeProcessing
) => {
  const { type, data } = modalState;
  const isProcessing = isAssetProcessing || isChangeProcessing;

  switch (type) {
    case MODAL_TYPES.ADD_ASSET:
      return <AssetForm portfolioId={portfolioId} onSubmit={onSaveAsset} onCancel={closeModal} isProcessing={isProcessing} />;
    case MODAL_TYPES.EDIT_ASSET:
      return <AssetForm portfolioId={portfolioId} initialData={data} onSubmit={onSaveAsset} onCancel={closeModal} isProcessing={isProcessing} />;
    case MODAL_TYPES.DELETE_ASSET:
      return <DeleteConfirmation itemType="asset" itemName={data?.name} onConfirm={onDeleteAssetConfirm} onCancel={closeModal} isProcessing={isProcessing} />;
    case MODAL_TYPES.ADD_CHANGE:
      return <ChangeForm portfolioId={portfolioId} onSubmit={onSaveChange} onCancel={closeModal} isProcessing={isProcessing} />;
    case MODAL_TYPES.EDIT_CHANGE:
      return <ChangeForm portfolioId={portfolioId} initialData={data} onSubmit={onSaveChange} onCancel={closeModal} isProcessing={isProcessing} />;
    case MODAL_TYPES.DELETE_CHANGE:
      return <DeleteConfirmation itemType="planned change" itemName={data?.description} onConfirm={onDeleteChangeConfirm} onCancel={closeModal} isProcessing={isProcessing} />;
    case MODAL_TYPES.DELETE_PORTFOLIO:
      return <DeleteConfirmation itemType="portfolio" itemName={data?.name} onConfirm={onDeletePortfolioConfirm} onCancel={closeModal} isProcessing={isProcessing} />;
    default:
      return null;
  }
};
