import React, { useState } from 'react';
import { usePortfolio } from '../state/PortfolioContext';
import portfolioService from '../../../api/portfolioService'; // Import the service
import EditAssetModal from '../components/EditAssetModal'; // Import the modal
import ConfirmationModal from '../../../components/Modal/ConfirmationModal'; // Import the confirmation modal
import AddAssetForm from '../components/AddAssetForm'; // Import the new form component
import AssetList from '../components/AssetList'; // Import the new list component
import { ASSET_TYPE_OPTIONS } from '../../../constants/portfolioConstants';
import {
  SUCCESS_ASSET_DELETED,
  SUCCESS_ASSET_UPDATED,
  CONFIRM_DELETE_ASSET_TITLE,
  CONFIRM_DELETE_ASSET_BUTTON,
  CONFIRM_DELETE_ASSET_MESSAGE,
  ERROR_ASSET_DELETE_FALLBACK,
  HEADING_EXISTING_ASSETS,
} from '../../../constants/textConstants';
import useNotification from '../../../hooks/useNotification'; // Import the hook
import Spinner from '../../../components/Spinner/Spinner'; // Import Spinner

function AssetsView() {
  const { portfolio, refreshPortfolio, portfolioId } = usePortfolio();
  const { addNotification } = useNotification(); // Use the hook

  const [deletingAssetId, setDeletingAssetId] = useState(null); // State for delete loading indicator on the row
  const [editingAsset, setEditingAsset] = useState(null); // State for asset being edited

  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [assetToDeleteId, setAssetToDeleteId] = useState(null); // State to hold the ID of the asset targeted for deletion

  const [editError, setEditError] = useState(null); // For edit errors

  // --- Handle Asset Deletion Flow ---
  const handleDeleteRequest = assetId => {
    setAssetToDeleteId(assetId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDeleteId) return;

    // setDeleteError(null); // Removed
    setDeletingAssetId(assetToDeleteId);
    setIsConfirmModalOpen(false);

    try {
      await portfolioService.deleteAssetFromPortfolio(portfolioId, assetToDeleteId);
      if (refreshPortfolio) {
        refreshPortfolio();
      }
      addNotification(SUCCESS_ASSET_DELETED, 'success'); // Use notification
    } catch (error) {
      const detailMessage = error.response?.data?.detail;
      const generalApiMessage = error.response?.data?.message;
      const errorMessage = detailMessage || generalApiMessage || error.message || ERROR_ASSET_DELETE_FALLBACK;
      addNotification(errorMessage, 'error'); // Use notification
    } finally {
      setDeletingAssetId(null);
      setAssetToDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setAssetToDeleteId(null);
  };

  // --- Handle Asset Editing ---
  const handleOpenEditModal = assetToEdit => {
    setEditingAsset(assetToEdit);
    setEditError(null);
  };

  const handleCloseEditModal = () => {
    setEditingAsset(null);
  };

  const handleSaveEdit = () => {
    if (refreshPortfolio) {
      refreshPortfolio();
    }
    handleCloseEditModal();
    addNotification(SUCCESS_ASSET_UPDATED, 'success'); // Use notification
  };

  if (!portfolio) {
    return (
      <div className="p-4 flex justify-center items-center min-h-[200px]"> {/* Added flex for centering */}
        <Spinner size="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="p-1 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Assets for {portfolio.name}</h2>
        {editError && (
          <div className="text-red-600 text-sm p-3 my-2 bg-red-100 border border-red-400 rounded">
            {editError}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">{HEADING_EXISTING_ASSETS}</h3>
          <AssetList
            assets={portfolio.assets}
            editingAsset={editingAsset}
            deletingAssetId={deletingAssetId}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteRequest}
          />
        </div>
      </div>

      <AddAssetForm
        portfolioId={portfolioId}
        refreshPortfolio={refreshPortfolio}
        assetTypeOptions={ASSET_TYPE_OPTIONS}
      />

      <EditAssetModal
        isOpen={editingAsset !== null}
        onClose={handleCloseEditModal}
        asset={editingAsset}
        onSave={handleSaveEdit}
        onError={setEditError} /* Keep passing onError for now */
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={CONFIRM_DELETE_ASSET_TITLE}
        confirmText={CONFIRM_DELETE_ASSET_BUTTON}
        isConfirming={deletingAssetId !== null && deletingAssetId === assetToDeleteId}
      >
        {CONFIRM_DELETE_ASSET_MESSAGE}
      </ConfirmationModal>
    </div>
  );
}

export default AssetsView;
