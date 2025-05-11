import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import portfolioService from '../../../api/portfolioService';
import { usePortfolio } from '../state/PortfolioContext';
import styles from '../../../components/Modal/Modal.module.css'; // Import the CSS module

// Re-using options from AssetsView - consider moving to a shared location later
const assetTypeOptions = [
  { value: 'Stock', label: 'Stock' },
  { value: 'Bond', label: 'Bond' },
  { value: 'Mutual Fund', label: 'Mutual Fund' },
  { value: 'ETF', label: 'ETF' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Cryptocurrency', label: 'Cryptocurrency' },
  { value: 'Options', label: 'Options' },
  { value: 'Other', label: 'Other' },
];

function EditAssetModal({ isOpen, onClose, asset, onSave }) {
  const { portfolioId } = usePortfolio();

  const [assetType, setAssetType] = useState('');
  const [nameOrTicker, setNameOrTicker] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState('');
  const [manualExpectedReturn, setManualExpectedReturn] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (asset) {
      setAssetType(asset.asset_type || '');
      setNameOrTicker(asset.name || '');
      setAllocationPercentage(asset.allocation_percentage || '');
      setManualExpectedReturn(asset.manual_expected_return || '');
      setError(null);
      setFieldErrors({});
      document.getElementById('editAssetType-button')?.focus();
    }
  }, [asset]);

  useEffect(() => {
    const handleEsc = event => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Generic change handler
  const handleInputChange = e => {
    const { name, value } = e.target;
    switch (name) {
    case 'assetType':
      setAssetType(value);
      break;
    case 'nameOrTicker':
      setNameOrTicker(value);
      break;
    case 'allocationPercentage':
      setAllocationPercentage(value);
      break;
    case 'manualExpectedReturn':
      setManualExpectedReturn(value);
      break;
    default:
      break;
    }
  };

  // Form Submission Logic
  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSaving(true);

    if (!portfolioId || !asset?.id) {
      setError('Portfolio or Asset ID is missing.');
      setIsSaving(false);
      return;
    }

    // Construct assetData - ensure keys match backend expectations for PUT/PATCH
    // API spec for PUT shows name_or_ticker, manual_expected_return etc.
    const updatedAssetData = {
      asset_type: assetType,
      name_or_ticker: nameOrTicker, // Sending name_or_ticker
      allocation_percentage: parseFloat(allocationPercentage) || 0,
      ...(manualExpectedReturn !== '' &&
        manualExpectedReturn !== null && {
        manual_expected_return: parseFloat(manualExpectedReturn),
      }), // Handle empty string/null
    };

    // Basic Frontend validation (similar to add form)
    let currentFieldErrors = {};
    if (!updatedAssetData.asset_type) currentFieldErrors.assetType = 'Asset type is required.';
    if (!updatedAssetData.name_or_ticker)
      currentFieldErrors.nameOrTicker = 'Name or Ticker is required.';
    if (
      isNaN(updatedAssetData.allocation_percentage) ||
      updatedAssetData.allocation_percentage < 0 ||
      updatedAssetData.allocation_percentage > 100
    ) {
      // Allow 0 allocation, unlike add form perhaps? Check requirements. Assuming >= 0 now.
      currentFieldErrors.allocationPercentage = 'Allocation must be between 0 and 100.';
    }
    if (Object.keys(currentFieldErrors).length > 0) {
      setFieldErrors(currentFieldErrors);
      setIsSaving(false);
      return;
    }

    try {
      const savedAsset = await portfolioService.updateAssetInPortfolio(
        portfolioId,
        asset.id,
        updatedAssetData
      );
      onSave(savedAsset); // Pass updated asset data back if needed
      onClose(); // Close modal on success
    } catch (err) {
      console.error('Failed to update asset:', err);
      const validationErrors = err.response?.data?.validation_error;
      const detailMessage = err.response?.data?.detail;
      const generalMessage = err.message || 'Failed to update asset. Please try again.';

      if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
        const newFieldErrors = {};
        validationErrors.forEach(valErr => {
          let fieldName = valErr.loc?.[1]; // Assuming loc[1] is field name
          if (fieldName === 'name_or_ticker') fieldName = 'nameOrTicker';
          else if (fieldName === 'asset_type') fieldName = 'assetType';
          else if (fieldName === 'allocation_percentage') fieldName = 'allocationPercentage';
          else if (fieldName === 'manual_expected_return') fieldName = 'manualExpectedReturn';

          if (fieldName) newFieldErrors[fieldName] = valErr.msg;
        });
        setFieldErrors(newFieldErrors);
        setError(null);
      } else {
        setError(detailMessage || generalMessage);
        setFieldErrors({});
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null; // Don't render anything if the modal is closed
  }

  return (
    <div className={styles.modalOverlay}>
      <div
        className={styles.modalContentLargePadding}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-asset-modal-title"
        tabIndex="-1"
      >
        <h2 id="edit-asset-modal-title" className={styles.modalTitleLarge}>
          Edit Asset
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Type */}
          <div>
            <Select
              label="Asset Type"
              id="editAssetType"
              name="assetType"
              value={assetType}
              onChange={handleInputChange}
              options={assetTypeOptions}
              required
              className="mb-0"
            />
            {fieldErrors.assetType && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.assetType}</p>
            )}
          </div>

          {/* Name / Ticker */}
          <div>
            <Input
              label="Name / Ticker"
              id="editNameOrTicker"
              name="nameOrTicker"
              value={nameOrTicker}
              onChange={handleInputChange}
              required
              placeholder="e.g., Apple Inc. or AAPL"
              className="mb-0"
            />
            {fieldErrors.nameOrTicker && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.nameOrTicker}</p>
            )}
          </div>

          {/* Allocation Percentage */}
          <div>
            <Input
              label="Allocation Percentage (%)"
              id="editAllocationPercentage"
              name="allocationPercentage"
              type="number"
              value={allocationPercentage}
              onChange={handleInputChange}
              required
              placeholder="e.g., 25"
              min="0"
              max="100"
              step="0.01"
              className="mb-0"
            />
            {fieldErrors.allocationPercentage && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.allocationPercentage}</p>
            )}
          </div>

          {/* Manual Expected Return */}
          <div>
            <Input
              label="Manual Expected Return (%)"
              id="editManualExpectedReturn"
              name="manualExpectedReturn"
              type="number"
              value={manualExpectedReturn}
              onChange={handleInputChange}
              placeholder="Optional, e.g., 8.5"
              step="0.01"
              helperText="Leave blank to use default market estimates (if available)."
              className="mb-0"
            />
            {fieldErrors.manualExpectedReturn && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.manualExpectedReturn}</p>
            )}
          </div>

          {/* General error message */}
          {error && (
            <div className="text-red-600 text-sm p-2 my-2 bg-red-100 border border-red-400 rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add PropTypes validation
EditAssetModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  asset: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    asset_type: PropTypes.string,
    name: PropTypes.string, // From GET request
    name_or_ticker: PropTypes.string, // Potential property if API changes
    allocation_percentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    manual_expected_return: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.oneOf([null]),
    ]),
    // Add other expected asset properties if needed
  }), // Allow null if modal can be rendered without an asset initially (though `isOpen` controls it)
  onSave: PropTypes.func.isRequired,
};

export default EditAssetModal;
