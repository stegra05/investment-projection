import React, { useState } from 'react';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import portfolioService from '../../../api/portfolioService';

function AddAssetForm({ portfolioId, refreshPortfolio, assetTypeOptions }) {
  const [assetType, setAssetType] = useState('');
  const [nameOrTicker, setNameOrTicker] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState('');
  const [manualExpectedReturn, setManualExpectedReturn] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [addSuccessMessage, setAddSuccessMessage] = useState(null);

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

  const handleSubmit = async e => {
    e.preventDefault();
    setAddError(null);
    setFieldErrors({});

    if (!portfolioId) {
      setAddError('Portfolio ID is missing.');
      return;
    }

    const assetData = {
      asset_type: assetType,
      name_or_ticker: nameOrTicker,
      allocation_percentage: parseFloat(allocationPercentage) || 0,
      ...(manualExpectedReturn && { manual_expected_return: parseFloat(manualExpectedReturn) }),
    };

    let currentFieldErrors = {};
    if (!assetData.asset_type) currentFieldErrors.assetType = 'Asset type is required.';
    if (!assetData.name_or_ticker) currentFieldErrors.nameOrTicker = 'Name or Ticker is required.';
    if (
      isNaN(assetData.allocation_percentage) ||
      assetData.allocation_percentage <= 0 ||
      assetData.allocation_percentage > 100
    ) {
      currentFieldErrors.allocationPercentage = 'Allocation must be between 0 and 100.';
    }
    if (Object.keys(currentFieldErrors).length > 0) {
      setFieldErrors(currentFieldErrors);
      return;
    }

    setIsAdding(true);

    try {
      await portfolioService.addAssetToPortfolio(portfolioId, assetData);
      setAssetType('');
      setNameOrTicker('');
      setAllocationPercentage('');
      setManualExpectedReturn('');
      if (refreshPortfolio) {
        refreshPortfolio();
      } else {
        console.warn('refreshPortfolio function not available from context.');
      }
      setAddSuccessMessage('Asset added successfully!');
      setTimeout(() => {
        setAddSuccessMessage(null);
      }, 3000);
    } catch (error) {
      const validationErrors = error.response?.data?.validation_error;
      const apiErrors = error.response?.data?.errors;
      const detailMessage = error.response?.data?.detail;
      const generalMessage =
        error.response?.data?.message ||
        detailMessage ||
        error.message ||
        'Failed to add asset. Please try again.';

      if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
        const newFieldErrors = {};
        validationErrors.forEach(err => {
          let fieldName = null;
          if (err.loc && err.loc.length === 1 && typeof err.loc[0] === 'string') {
            fieldName = err.loc[0];
          } else if (err.loc && err.loc.length > 1 && typeof err.loc[1] === 'string') {
            fieldName = err.loc[1];
          }

          if (fieldName) {
            let uiFieldName = fieldName;
            if (fieldName === 'name_or_ticker') uiFieldName = 'nameOrTicker';
            else if (fieldName === 'asset_type') uiFieldName = 'assetType';
            else if (fieldName === 'allocation_percentage') uiFieldName = 'allocationPercentage';
            else if (fieldName === 'manual_expected_return') uiFieldName = 'manualExpectedReturn';

            newFieldErrors[uiFieldName] = err.msg;
            newFieldErrors[fieldName] = err.msg;
          }
        });
        setFieldErrors(newFieldErrors);
        setAddError(null);
      } else if (apiErrors && typeof apiErrors === 'object' && Object.keys(apiErrors).length > 0) {
        setFieldErrors(apiErrors);
        setAddError(null);
      } else {
        setAddError(generalMessage);
        setFieldErrors({});
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">Add New Asset</h3>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <Select
            label="Asset Type"
            id="assetType"
            name="assetType"
            value={assetType}
            onChange={handleInputChange}
            options={assetTypeOptions}
            required
            placeholder="Select asset type..."
            className="mb-0"
          />
          {(fieldErrors.asset_type || fieldErrors.assetType) && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.asset_type || fieldErrors.assetType}
            </p>
          )}
        </div>
        <div>
          <Input
            label="Name / Ticker"
            id="nameOrTicker"
            name="nameOrTicker"
            value={nameOrTicker}
            onChange={handleInputChange}
            required
            placeholder="e.g., Apple Inc. or AAPL"
            className="mb-0"
          />
          {(fieldErrors.name_or_ticker || fieldErrors.nameOrTicker) && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.name_or_ticker || fieldErrors.nameOrTicker}
            </p>
          )}
        </div>
        <div>
          <Input
            label="Allocation Percentage (%)"
            id="allocationPercentage"
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
          {(fieldErrors.allocation_percentage || fieldErrors.allocationPercentage) && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.allocation_percentage || fieldErrors.allocationPercentage}
            </p>
          )}
        </div>
        <div>
          <Input
            label="Manual Expected Return (%)"
            id="manualExpectedReturn"
            name="manualExpectedReturn"
            type="number"
            value={manualExpectedReturn}
            onChange={handleInputChange}
            placeholder="Optional, e.g., 8.5"
            step="0.01"
            helperText="Leave blank to use default market estimates (if available)."
            className="mb-0"
          />
          {fieldErrors.manual_expected_return && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.manual_expected_return}</p>
          )}
        </div>
        {addError && (
          <div className="text-red-600 text-sm p-3 my-2 bg-red-100 border border-red-400 rounded">
            {addError}
          </div>
        )}
        {addSuccessMessage && (
          <div className="text-green-600 text-sm p-3 my-2 bg-green-100 border border-green-400 rounded">
            {addSuccessMessage}
          </div>
        )}
        <div className="pt-2">
          <Button type="submit" variant="primary" disabled={isAdding}>
            {isAdding ? 'Adding...' : 'Add Asset'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AddAssetForm; 