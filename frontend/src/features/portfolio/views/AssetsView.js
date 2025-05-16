import React, { useState } from 'react';
import { usePortfolio } from '../state/PortfolioContext';
import EditAssetModal from '../components/EditAssetModal'; // Import the modal
import ConfirmationModal from '../../../components/Modal/ConfirmationModal'; // Import the confirmation modal
import AddAssetForm from '../components/AddAssetForm'; // Import the new form component
import AssetList from '../components/AssetList'; // Import the new list component
import { ASSET_TYPE_OPTIONS } from '../../../constants/portfolioConstants';
import {
  CONFIRM_DELETE_ASSET_TITLE,
  CONFIRM_DELETE_ASSET_BUTTON,
  CONFIRM_DELETE_ASSET_MESSAGE,
  HEADING_EXISTING_ASSETS,
} from '../../../constants/textConstants';
import useNotification from '../../../hooks/useNotification'; // Import the hook
import Spinner from '../../../components/Spinner/Spinner'; // Import Spinner
import { useAssetCRUD } from '../hooks/useAssetCRUD'; // Import the new hook

function AssetsView() {
  const { portfolio, refreshPortfolio, portfolioId } = usePortfolio();
  const { addNotification } = useNotification(); // Use the hook

  // Instantiate the CRUD hook
  const {
    deleteAsset,
    isDeletingAsset, // Replaces deletingAssetId state
    handleAssetUpdateSuccess,
  } = useAssetCRUD({ portfolioId, refreshPortfolio, addNotification });

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

  const handleConfirmDeleteWrapper = async () => {
    if (!assetToDeleteId) return;
    // Call deleteAsset from the hook
    const success = await deleteAsset(assetToDeleteId);
    setIsConfirmModalOpen(false); // Close modal regardless of success, notification handles feedback
    if (success) {
      // Optionally, if any UI state depends on assetToDeleteId specifically beyond modal
      setAssetToDeleteId(null); 
    }
    // No need to manage deletingAssetId or error state here, hook does it
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

  const handleSaveEditWrapper = () => {
    // The actual save is done by EditAssetModal. We just handle post-success actions.
    handleAssetUpdateSuccess(); // Call the hook's success handler
    handleCloseEditModal();
    // addNotification(SUCCESS_ASSET_UPDATED, 'success'); // Moved to hook
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
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">Assets for {portfolio.name}</h2>
        {editError && (
          <div className="text-red-600 text-sm p-3 my-2 bg-red-100 border border-red-400 rounded">
            {editError}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">{HEADING_EXISTING_ASSETS}</h3>
          <AssetList
            assets={portfolio.assets}
            editingAsset={editingAsset}
            deletingAssetId={isDeletingAsset} // Pass isDeletingAsset from hook
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
        onSave={handleSaveEditWrapper} // Use the wrapper
        onError={setEditError} 
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDeleteWrapper} // Use the wrapper
        title={CONFIRM_DELETE_ASSET_TITLE}
        confirmText={CONFIRM_DELETE_ASSET_BUTTON}
        isConfirming={isDeletingAsset === assetToDeleteId} // Compare hook state with targeted ID
      >
        {CONFIRM_DELETE_ASSET_MESSAGE}
      </ConfirmationModal>
    </div>
  );
}

export default AssetsView;
