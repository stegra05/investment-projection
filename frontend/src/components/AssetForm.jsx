import React, { useState, useEffect } from 'react';
import assetService from '../services/assetService';
import { PlusIcon } from '@heroicons/react/24/outline';
import styles from './AssetForm.module.css'; // Import CSS Module
import { useFormState } from '../hooks/useFormState'; // <-- Add this
// Import new components
import Button from './Button';
import Input from './Input';
import Select from './Select';

// Predefined asset types (could be fetched or managed elsewhere)
const assetTypeOptions = [
    { value: 'Stock', label: 'Stock' },
    { value: 'Bond', label: 'Bond' },
    { value: 'ETF', label: 'ETF' },
    { value: 'Mutual Fund', label: 'Mutual Fund' },
    { value: 'Real Estate', label: 'Real Estate' },
    { value: 'Cash', label: 'Cash/Equivalent' },
    { value: 'Other', label: 'Other (Custom)' },
];

/**
 * A form component for creating or editing an asset within a portfolio.
 *
 * Handles input fields for asset type (including custom), name/ticker, allocation,
 * and expected return. Manages loading and error states. Calls appropriate
 * service functions (createAsset, updateAsset) on submit.
 *
 * @param {object} props - The component props.
 * @param {string|number} props.portfolioId - The ID of the portfolio this asset belongs to.
 * @param {object} [props.existingAsset=null] - If provided, the form will be pre-filled with this asset's data
 *                                             for editing. If null, the form is for creating a new asset.
 * @param {Function} props.onSaved - Callback function executed successfully after creating or updating an asset.
 * @param {Function} [props.onCancel] - Optional callback function executed when the cancel button is clicked.
 * @returns {JSX.Element} The AssetForm component.
 */
export default function AssetForm({ portfolioId, existingAsset = null, onSaved, onCancel }) {
  const { isEditing, error, setError } = useFormState(existingAsset); // <-- Use hook
  const [assetType, setAssetType] = useState('');
  const [customAssetType, setCustomAssetType] = useState('');
  const [ticker, setTicker] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState('0');
  const [expectedReturn, setExpectedReturn] = useState('0');

  useEffect(() => {
    if (isEditing && existingAsset) {
        const predefinedType = assetTypeOptions.find(opt => opt.value === existingAsset.asset_type);
        if (predefinedType && existingAsset.asset_type !== 'Other') {
            setAssetType(existingAsset.asset_type);
            setCustomAssetType(''); // Reset custom type
        } else {
            setAssetType('Other');
            setCustomAssetType(existingAsset.asset_type || ''); // Set custom type if not predefined or explicitly 'Other'
        }
        setTicker(existingAsset.name_or_ticker || '');
        setAllocationPercentage(String(existingAsset.allocation_percentage ?? 0));
        setExpectedReturn(String(existingAsset.manual_expected_return ?? 0));
    } else {
        // Reset form for adding new asset
        setAssetType('');
        setCustomAssetType('');
        setTicker('');
        setAllocationPercentage('0');
        setExpectedReturn('0');
    }
    setError(''); // Clear error on init or change (using setError from hook)
  }, [existingAsset, isEditing, setError]); // <-- Add setError dependency

  // Helper to handle updates from either slider or number input
  const handleValueChange = (setter) => (e) => {
    const value = e.target.value;
    // Allow empty string temporarily in number input, default to 0 if needed later
    setter(value);
  };

  // Helper to parse value for submission, handling potential empty strings
  const parseNumericValue = (value, defaultValue = 0) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors (using setError from hook)
    try {
      const finalAssetType = assetType === 'Other' ? customAssetType : assetType;
      // Basic validation
      if (!finalAssetType || !ticker) {
          setError('Asset Type and Name/Ticker are required fields.');
          return;
      }
      if (assetType === 'Other' && !customAssetType) {
          setError('Please specify the custom asset type name when selecting "Other".');
          return;
      }

      // Use helper to parse values, ensuring they are numeric before sending
      const parsedAllocation = parseNumericValue(allocationPercentage);
      const parsedReturn = parseNumericValue(expectedReturn);

      // Additional validation for range if needed
      if (parsedAllocation < 0 || parsedAllocation > 100) {
        setError('Allocation must be between 0% and 100%.');
        return;
      }
      // Add range validation for expected return if necessary (-10 to 25)

      const payload = {
        asset_type: finalAssetType,
        name_or_ticker: ticker,
        allocation_percentage: parsedAllocation,
        manual_expected_return: parsedReturn,
      };

      if (isEditing && existingAsset) {
        await assetService.updateAsset(portfolioId, existingAsset.asset_id, payload);
      } else {
        await assetService.createAsset(portfolioId, payload);
      }
      onSaved(); // Call the callback to signal success
    } catch (err) {
      console.error('Asset save failed:', err);
      setError(err.response?.data?.message || 'Failed to save asset. Please check the details.'); // Using setError from hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h3 className={styles.formTitle}>
        {isEditing ? 'Edit Asset' : 'Add New Asset'}
      </h3>
      {error && <p className={styles.errorMessage}>{error}</p>}

      {/* Asset Type Select */}
      <div className={styles.formGroup}>
        <label htmlFor="assetType" className={styles.label}>Asset Type*</label>
        <Select
          id="assetType"
          value={assetType}
          onChange={(e) => setAssetType(e.target.value)}
          required
          placeholder="-- Select Asset Type --"
        >
          {assetTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>

        {/* Custom Asset Type Input (Conditional) */}
        {assetType === 'Other' && (
          <Input
            type="text"
            placeholder="Enter custom asset type name (e.g., Cryptocurrency)"
            value={customAssetType}
            onChange={(e) => setCustomAssetType(e.target.value)}
            required={assetType === 'Other'}
            className={styles.customTypeInput}
          />
        )}
      </div>

      {/* Name/Ticker Input */}
      <div className={styles.formGroup}>
        <label htmlFor="ticker" className={styles.label}>Name/Ticker*</label>
        <Input
          id="ticker"
          type="text"
          placeholder="e.g., AAPL, VTI, My Rental Property"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          required
        />
      </div>

      {/* Allocation Range Slider & Number Input */}
      <div className={styles.formGroup}>
        <label htmlFor="allocationRange" className={styles.label}>Target Allocation (%)</label>
        <div className={styles.rangeGroup}>
            <input
              id="allocationRange"
              type="range"
              min="0" max="100" step="1"
              value={parseNumericValue(allocationPercentage)} // Use parsed value for slider
              onChange={handleValueChange(setAllocationPercentage)}
              className={styles.rangeInput}
            />
            {/* Number input synced with the slider */}
            <Input
              id="allocationNumber"
              type="number"
              min="0" max="100" step="1"
              value={allocationPercentage} // Bind directly to string state
              onChange={handleValueChange(setAllocationPercentage)}
              className={styles.rangeValueInput}
              aria-label="Target Allocation Percentage Number Input"
            />
            <span className={styles.rangeUnit}>%</span>
        </div>
      </div>

      {/* Expected Return Range Slider & Number Input */}
      <div className={styles.formGroup}>
        <label htmlFor="expectedReturnRange" className={styles.label}>Manual Expected Return (%)</label>
         <div className={styles.rangeGroup}>
            <input
              id="expectedReturnRange"
              type="range"
              min="-10" max="25" step="0.1" // Adjusted range
              value={parseNumericValue(expectedReturn)} // Use parsed value for slider
              onChange={handleValueChange(setExpectedReturn)}
              className={styles.rangeInput}
            />
            {/* Number input synced with the slider */}
             <Input
               id="expectedReturnNumber"
               type="number"
               min="-10" max="25" step="0.1"
               value={expectedReturn} // Bind directly to string state
               onChange={handleValueChange(setExpectedReturn)}
               className={styles.rangeValueInput}
               aria-label="Manual Expected Return Percentage Number Input"
             />
             <span className={styles.rangeUnit}>%</span>
        </div>
        <small className={styles.inputHint}>Optional. Leave at 0 to let the system estimate return (if possible).</small>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionsContainer}>
         {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          iconLeft={<PlusIcon style={{ width: '1em', height: '1em' }} />}
        >
          {isEditing ? 'Update Asset' : 'Add Asset'}
        </Button>
      </div>
    </form>
  );
} 