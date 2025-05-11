import { useState } from 'react';
import portfolioService from '../../../api/portfolioService';
import {
  SUCCESS_ASSET_DELETED,
  SUCCESS_ASSET_UPDATED, // For post-update actions
  ERROR_ASSET_DELETE_FALLBACK,
} from '../../../constants/textConstants';

export const useAssetCRUD = ({ portfolioId, refreshPortfolio, addNotification }) => {
  const [isDeletingAsset, setIsDeletingAsset] = useState(null); // Tracks the ID of the asset being deleted
  // Error for deletion can be handled by just notification, or state if needed for specific UI reaction

  const deleteAsset = async (assetId) => {
    if (!portfolioId || !assetId) {
      addNotification('Portfolio or Asset ID missing. Cannot delete asset.', 'error');
      return false;
    }

    setIsDeletingAsset(assetId);
    try {
      await portfolioService.deleteAssetFromPortfolio(portfolioId, assetId);
      if (refreshPortfolio) {
        await refreshPortfolio();
      }
      addNotification(SUCCESS_ASSET_DELETED, 'success');
      return true;
    } catch (error) {
      const detailMessage = error.response?.data?.detail;
      const generalApiMessage = error.response?.data?.message;
      const errorMessage = detailMessage || generalApiMessage || error.message || ERROR_ASSET_DELETE_FALLBACK;
      addNotification(errorMessage, 'error');
      return false;
    } finally {
      setIsDeletingAsset(null);
    }
  };

  // This helper can be called after an asset is successfully updated by another component (e.g., EditAssetModal)
  const handleAssetUpdateSuccess = () => {
    if (refreshPortfolio) {
      refreshPortfolio();
    }
    addNotification(SUCCESS_ASSET_UPDATED, 'success');
  };

  return {
    deleteAsset,
    isDeletingAsset, // Expose this to show loading state on the specific asset/button
    handleAssetUpdateSuccess,
  };
}; 