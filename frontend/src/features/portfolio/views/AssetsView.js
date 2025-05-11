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
  LOADING_PORTFOLIO_DATA,
  HEADING_EXISTING_ASSETS,
} from '../../../constants/textConstants';

function AssetsView() {
  const { portfolio, refreshPortfolio, portfolioId } = usePortfolio();

  const [deletingAssetId, setDeletingAssetId] = useState(null); // State for delete loading indicator on the row
  const [editingAsset, setEditingAsset] = useState(null); // State for asset being edited

  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [assetToDeleteId, setAssetToDeleteId] = useState(null); // State to hold the ID of the asset targeted for deletion

  const [deleteError, setDeleteError] = useState(null); // For delete errors
  const [editError, setEditError] = useState(null); // For edit errors
  const [globalSuccessMessage, setGlobalSuccessMessage] = useState(null); // For success messages not related to Add form

  // --- Handle Asset Deletion Flow ---
  const handleDeleteRequest = assetId => {
    setAssetToDeleteId(assetId);
    setIsConfirmModalOpen(true);
    setDeleteError(null);
    setGlobalSuccessMessage(null);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDeleteId) return;

    setDeleteError(null);
    setDeletingAssetId(assetToDeleteId);
    setIsConfirmModalOpen(false);

    try {
      await portfolioService.deleteAssetFromPortfolio(portfolioId, assetToDeleteId);
      if (refreshPortfolio) {
        refreshPortfolio();
      } else {
        console.warn('refreshPortfolio function not available from context.');
      }
      setGlobalSuccessMessage(SUCCESS_ASSET_DELETED);
      setTimeout(() => setGlobalSuccessMessage(null), 3000);
    } catch (error) {
      const detailMessage = error.response?.data?.detail;
      const generalApiMessage = error.response?.data?.message;
      setDeleteError(detailMessage || generalApiMessage || error.message || ERROR_ASSET_DELETE_FALLBACK);
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
    setGlobalSuccessMessage(null);
  };

  const handleCloseEditModal = () => {
    setEditingAsset(null);
  };

  const handleSaveEdit = () => {
    if (refreshPortfolio) {
      refreshPortfolio();
    } else {
      console.warn('refreshPortfolio function not available from context.');
    }
    handleCloseEditModal();
    setGlobalSuccessMessage(SUCCESS_ASSET_UPDATED);
    setTimeout(() => setGlobalSuccessMessage(null), 3000);
  };

  if (!portfolio) {
    return (
      <div className="p-4 text-center text-gray-500">
        {LOADING_PORTFOLIO_DATA}
      </div>
    );
  }

  return (
    <div className="p-1 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Assets for {portfolio.name}</h2>

        {deleteError && (
          <div className="text-red-600 text-sm p-3 my-2 bg-red-100 border border-red-400 rounded">
            {deleteError}
          </div>
        )}
        {globalSuccessMessage && (
          <div className="text-green-600 text-sm p-3 my-2 bg-green-100 border border-green-400 rounded">
            {globalSuccessMessage}
          </div>
        )}
        {editError && (
          <div className="text-red-600 text-sm p-3 my-2 bg-red-100 border border-red-400 rounded">
            {editError}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">{HEADING_EXISTING_ASSETS}</h3>
          <AssetList
            assets={portfolio.assets}
            editingAsset={editingAsset} /* Pass editingAsset to disable buttons on other rows */
            deletingAssetId={deletingAssetId}
            onEdit={handleOpenEditModal} /* Pass the handler from AssetsView */
            onDelete={handleDeleteRequest} /* Pass the handler from AssetsView */
          />
        </div>
      </div>

      <AddAssetForm
        portfolioId={portfolioId}
        refreshPortfolio={refreshPortfolio} /* This will also show add success/error messages */
        assetTypeOptions={ASSET_TYPE_OPTIONS}
      />

      <EditAssetModal
        isOpen={editingAsset !== null}
        onClose={handleCloseEditModal}
        asset={editingAsset}
        onSave={handleSaveEdit}
        onError={setEditError} /* Pass setEditError to display edit errors */
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
