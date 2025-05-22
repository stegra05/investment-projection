import React, { useState } from 'react';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import AlertMessage from '../../../components/AlertMessage/AlertMessage';
import portfolioService from '../../../api/portfolioService';
import PropTypes from 'prop-types';
import { FaPercent, FaDollarSign } from 'react-icons/fa';
import useTheme from '../../../hooks/useTheme';

function AddAssetForm({ portfolioId, refreshPortfolio, assetTypeOptions }) {
  const { theme } = useTheme();
  const [assetType, setAssetType] = useState('');
  const [nameOrTicker, setNameOrTicker] = useState('');
  const [allocationMode, setAllocationMode] = useState('percentage'); 
  const [allocationPercentage, setAllocationPercentage] = useState('');
  const [allocationValue, setAllocationValue] = useState(''); 
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
    case 'allocationValue': 
      setAllocationValue(value);
      break;
    case 'manualExpectedReturn':
      setManualExpectedReturn(value);
      break;
    default:
      break;
    }
  };

  const handleAllocationModeChange = (mode) => {
    setAllocationMode(mode);
    if (mode === 'percentage') {
      setAllocationValue(''); 
      setFieldErrors(prev => ({ ...prev, allocationValue: undefined, allocation_value: undefined }));
    } else {
      setAllocationPercentage(''); 
      setFieldErrors(prev => ({ ...prev, allocationPercentage: undefined, allocation_percentage: undefined }));
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
      ...(manualExpectedReturn && { manual_expected_return: parseFloat(manualExpectedReturn) }),
    };

    if (allocationMode === 'percentage') {
      assetData.allocation_percentage = parseFloat(allocationPercentage) || 0;
      assetData.allocation_value = null;
    } else {
      assetData.allocation_value = parseFloat(allocationValue) || 0;
      assetData.allocation_percentage = null;
    }

    let currentFieldErrors = {};
    if (!assetData.asset_type) currentFieldErrors.assetType = 'Asset type is required.';
    if (!assetData.name_or_ticker) currentFieldErrors.nameOrTicker = 'Name or Ticker is required.';

    if (allocationMode === 'percentage') {
      if (
        isNaN(assetData.allocation_percentage) ||
        assetData.allocation_percentage < 0 ||
        assetData.allocation_percentage > 100
      ) {
        currentFieldErrors.allocationPercentage = 'Allocation percentage must be between 0 and 100.';
      }
    } else {
      if (isNaN(assetData.allocation_value) || assetData.allocation_value < 0) {
        currentFieldErrors.allocationValue = 'Allocation value must be a non-negative number.';
      }
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
      setAllocationMode('percentage'); 
      setAllocationPercentage('');
      setAllocationValue(''); 
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
            else if (fieldName === 'allocation_value') uiFieldName = 'allocationValue'; // Handle new field error
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
      <h3 className={`text-lg font-semibold mb-4 ${theme === 'high-contrast' ? 'text-gray-100' : 'text-gray-900'}`}>Add New Asset</h3>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <AlertMessage type="error" message={addError} />
        <AlertMessage type="success" message={addSuccessMessage} />

        <Select
          label="Asset Type"
          id="assetType"
          name="assetType"
          value={assetType}
          onChange={handleInputChange}
          options={assetTypeOptions}
          required
          placeholder="Select asset type..."
          error={fieldErrors.asset_type || fieldErrors.assetType}
        />
        
        <Input
          label="Name / Ticker"
          id="nameOrTicker"
          name="nameOrTicker"
          value={nameOrTicker}
          onChange={handleInputChange}
          required
          placeholder="e.g., Apple Inc. or AAPL"
          error={fieldErrors.name_or_ticker || fieldErrors.nameOrTicker}
        />

        <fieldset className="mb-4">
          <legend className={`block text-sm font-medium mb-1 ${theme === 'high-contrast' ? 'text-gray-200' : 'text-gray-700'}`}>Allocation Type</legend>
          <div className="inline-flex rounded-md shadow-sm pt-1" role="group">
            <button
              type="button"
              onClick={() => handleAllocationModeChange('percentage')}
              className={`
                px-4 py-2 text-sm font-medium border focus:z-10 focus:outline-none focus:ring-2 rounded-l-lg 
                ${theme === 'high-contrast' ? 
      (allocationMode === 'percentage' ? 'bg-primary-500 text-white border-primary-500' : 'bg-gray-700 text-gray-100 border-gray-600 hover:bg-gray-600 focus:ring-primary-400') : 
      (allocationMode === 'percentage' ? 'bg-primary-100 text-primary-700 border-primary-300' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 focus:ring-primary-300')
    }
              `}
            >
              <FaPercent className={`inline mr-2 ${allocationMode === 'percentage' ? (theme === 'high-contrast' ? 'text-white' : 'text-primary-700') : (theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-500') }`} />
              Percentage
            </button>
            <button
              type="button"
              onClick={() => handleAllocationModeChange('value')}
              className={`
                px-4 py-2 text-sm font-medium border focus:z-10 focus:outline-none focus:ring-2 rounded-r-lg 
                ${theme === 'high-contrast' ? 
      (allocationMode === 'value' ? 'bg-primary-500 text-white border-primary-500' : 'bg-gray-700 text-gray-100 border-gray-600 hover:bg-gray-600 focus:ring-primary-400') : 
      (allocationMode === 'value' ? 'bg-primary-100 text-primary-700 border-primary-300' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 focus:ring-primary-300')
    }
              `}
            >
              <FaDollarSign className={`inline mr-2 ${allocationMode === 'value' ? (theme === 'high-contrast' ? 'text-white' : 'text-primary-700') : (theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-500') }`} />
              Value
            </button>
          </div>
          <p className={`mt-2 text-xs ${theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-500'}`}>Specify allocation as a percentage of the total portfolio or as a fixed monetary value. Only one can be active.</p>
        </fieldset>

        {allocationMode === 'percentage' && (
          <Input
            label="Allocation Percentage (%)"
            id="allocationPercentage"
            name="allocationPercentage"
            type="number"
            value={allocationPercentage}
            onChange={handleInputChange}
            required={allocationMode === 'percentage'}
            placeholder="e.g., 25"
            min="0"
            max="100"
            step="0.01"
            disabled={allocationMode !== 'percentage'}
            error={fieldErrors.allocation_percentage || fieldErrors.allocationPercentage}
          />
        )}

        {allocationMode === 'value' && (
          <Input
            label="Allocation Value ($)"
            id="allocationValue"
            name="allocationValue"
            type="number"
            value={allocationValue}
            onChange={handleInputChange}
            required={allocationMode === 'value'}
            placeholder="e.g., 5000"
            min="0"
            step="0.01"
            disabled={allocationMode !== 'value'}
            error={fieldErrors.allocation_value || fieldErrors.allocationValue}
          />
        )}

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
          error={fieldErrors.manual_expected_return}
        />
        
        <div className="pt-2">
          <Button type="submit" variant="primary" disabled={isAdding}>
            {isAdding ? 'Adding...' : 'Add Asset'}
          </Button>
        </div>
      </form>
    </div>
  );
}

AddAssetForm.propTypes = {
  portfolioId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  refreshPortfolio: PropTypes.func.isRequired,
  assetTypeOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default AddAssetForm; 