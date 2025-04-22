import React, { useState, useCallback, useMemo } from 'react';

// Import required components used within the modal content
import AssetForm from '../components/AssetForm.jsx';
import ChangeForm from '../components/ChangeForm';
import DeleteConfirmation from '../components/DeleteConfirmation';

// Define modal types (can be shared or redefined here)
const MODAL_TYPES = {
  ADD_ASSET: 'ADD_ASSET',
  EDIT_ASSET: 'EDIT_ASSET',
  DELETE_ASSET: 'DELETE_ASSET',
  ADD_CHANGE: 'ADD_CHANGE',
  EDIT_CHANGE: 'EDIT_CHANGE',
  DELETE_CHANGE: 'DELETE_CHANGE',
  DELETE_PORTFOLIO: 'DELETE_PORTFOLIO',
};

export function usePortfolioModals({ // Destructure props for clarity
  portfolioId,
  portfolioData, // Needed for portfolio name in delete confirmation
  onSaveAsset,
  onDeleteAssetConfirm,
  onSaveChange,
  onDeleteChangeConfirm,
  onDeletePortfolioConfirm,
  isAssetProcessing,
  isChangeProcessing,
  // Add other processing states if needed by modals, e.g., isSavingAllocations
}) {
  const [modalState, setModalState] = useState({ type: null, data: null });

  const closeModal = useCallback(() => {
    setModalState({ type: null, data: null });
    // Potential: Call clear error functions passed in props if needed on close?
  }, []);

  // --- Modal Opening Functions ---
  const openAddAssetModal = useCallback(() => setModalState({ type: MODAL_TYPES.ADD_ASSET, data: null }), []);
  const openEditAssetModal = useCallback((asset) => setModalState({ type: MODAL_TYPES.EDIT_ASSET, data: asset }), []);
  const openDeleteAssetModal = useCallback((asset) => setModalState({ type: MODAL_TYPES.DELETE_ASSET, data: asset }), []);
  const openAddChangeModal = useCallback(() => setModalState({ type: MODAL_TYPES.ADD_CHANGE, data: null }), []);
  const openEditChangeModal = useCallback((change) => setModalState({ type: MODAL_TYPES.EDIT_CHANGE, data: change }), []);
  const openDeleteChangeModal = useCallback((change) => setModalState({ type: MODAL_TYPES.DELETE_CHANGE, data: change }), []);
  const openDeletePortfolioModal = useCallback(() => setModalState({ type: MODAL_TYPES.DELETE_PORTFOLIO, data: portfolioData }), [portfolioData]);

  // --- Modal Title Calculation ---
  const modalTitle = useMemo(() => {
    switch (modalState.type) {
      case MODAL_TYPES.ADD_ASSET: return 'Add New Asset';
      case MODAL_TYPES.EDIT_ASSET: return 'Edit Asset';
      case MODAL_TYPES.DELETE_ASSET: return 'Confirm Delete Asset';
      case MODAL_TYPES.ADD_CHANGE: return 'Add Planned Change';
      case MODAL_TYPES.EDIT_CHANGE: return 'Edit Planned Change';
      case MODAL_TYPES.DELETE_CHANGE: return 'Confirm Delete Change';
      case MODAL_TYPES.DELETE_PORTFOLIO: return 'Confirm Delete Portfolio';
      default: return '';
    }
  }, [modalState.type]);

  // --- Modal Content Rendering Logic ---
  const modalContent = useMemo(() => {
    const { type, data } = modalState;
    // Determine if *any* relevant action is processing for general disabling
    const isProcessing = isAssetProcessing || isChangeProcessing;

    switch (type) {
      case MODAL_TYPES.ADD_ASSET:
        return <AssetForm portfolioId={portfolioId} onSubmit={onSaveAsset} onCancel={closeModal} isProcessing={isProcessing} />;
      case MODAL_TYPES.EDIT_ASSET:
        return <AssetForm portfolioId={portfolioId} initialData={data} onSubmit={onSaveAsset} onCancel={closeModal} isProcessing={isProcessing} />;
      case MODAL_TYPES.DELETE_ASSET:
        return <DeleteConfirmation itemType="asset" itemName={data?.name_or_ticker} onConfirm={onDeleteAssetConfirm} onCancel={closeModal} isProcessing={isAssetProcessing} />;
      case MODAL_TYPES.ADD_CHANGE:
        return <ChangeForm portfolioId={portfolioId} onSubmit={onSaveChange} onCancel={closeModal} isProcessing={isProcessing} />;
      case MODAL_TYPES.EDIT_CHANGE:
        return <ChangeForm portfolioId={portfolioId} initialData={data} onSubmit={onSaveChange} onCancel={closeModal} isProcessing={isProcessing} />;
      case MODAL_TYPES.DELETE_CHANGE:
        return <DeleteConfirmation itemType="planned change" itemName={data?.description} onConfirm={onDeleteChangeConfirm} onCancel={closeModal} isProcessing={isChangeProcessing} />;
      case MODAL_TYPES.DELETE_PORTFOLIO:
        // Uses portfolioData passed into the hook for the name
        return <DeleteConfirmation itemType="portfolio" itemName={data?.name} onConfirm={onDeletePortfolioConfirm} onCancel={closeModal} isProcessing={isProcessing} />;
      default:
        return null;
    }
    // Dependencies: Include all props used in rendering the content
  }, [modalState, portfolioId, closeModal, onSaveAsset, onDeleteAssetConfirm, onSaveChange, onDeleteChangeConfirm, onDeletePortfolioConfirm, isAssetProcessing, isChangeProcessing]);

  // Prepare props for the Modal component
  const modalProps = {
    isOpen: modalState.type !== null,
    onClose: closeModal,
    title: modalTitle,
    children: modalContent,
  };

  return {
    modalProps,
    // Expose specific open functions
    openAddAssetModal,
    openEditAssetModal,
    openDeleteAssetModal,
    openAddChangeModal,
    openEditChangeModal,
    openDeleteChangeModal,
    openDeletePortfolioModal,
  };
} 