import React, { useState, useEffect } from 'react';
import assetService from '../services/assetService';
import { PlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import styles from './AssetForm.module.css'; // Import CSS Module
import { useFormState } from '../hooks/useFormState'; // <-- Add this
// Import new components
import Button from './Button';
import Input from './Input';
import Select from './Select';
import { FormCommon } from './FormCommon'; // Reuse common form styles
import Tooltip from './Tooltip'; // <-- Add Tooltip import

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

// Validation function (can be expanded)
const validateField = (name, value) => {
  let error = '';
  const numValue = parseFloat(value);

  if (value === '') return error; // Don't validate empty string immediately

  switch (name) {
    case 'allocationPercentage':
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        error = 'Allocation must be between 0% and 100%.';
      }
      break;
    case 'expectedReturn':
      // Example range, adjust if needed
      if (isNaN(numValue) || numValue < -50 || numValue > 100) { // Example wider range for validation
        error = 'Return must be a reasonable percentage (e.g., -50% to 100%).';
      }
      break;
    // Add other field validations here if needed
    default:
      break;
  }
  return error;
};

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
  const { isEditing, error: submissionError, setError: setSubmissionError } = useFormState(existingAsset); // Renamed for clarity
  const [assetType, setAssetType] = useState('');
  const [customAssetType, setCustomAssetType] = useState('');
  const [ticker, setTicker] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState('0');
  const [expectedReturn, setExpectedReturn] = useState('0');
  const [fieldErrors, setFieldErrors] = useState({}); // State for individual field errors

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
    setSubmissionError(''); // Clear submission error on init or change
    setFieldErrors({}); // Clear field errors on init or change
  }, [existingAsset, isEditing, setSubmissionError]); // Removed setError dependency, using setSubmissionError

  // Helper to handle updates from either slider or number input
  const handleValueChange = (setter, fieldName) => (e) => {
    const value = e.target.value;
    setter(value);
    // Validate on change, but only if the field is not empty
    if (value !== '') {
        const error = validateField(fieldName, value);
        setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    } else {
         // Clear error if field becomes empty
         setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  // Validate on blur to catch cases where user leaves field empty or invalid
   const handleBlur = (fieldName, value) => {
    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
   }

  // Helper to parse value for submission, handling potential empty strings
  const parseNumericValue = (value, defaultValue = 0) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSubmissionError(''); // Clear previous submission errors
    setFieldErrors({}); // Clear field errors before attempting submission

    // --- Pre-submission Validation ---
    let hasValidationErrors = false;
    const currentFieldErrors = {};

    // Basic required field checks
    const finalAssetType = assetType === 'Other' ? customAssetType : assetType;
    if (!finalAssetType) {
        currentFieldErrors.assetType = 'Asset Type is required.';
        hasValidationErrors = true;
    }
    if (assetType === 'Other' && !customAssetType) {
        currentFieldErrors.customAssetType = 'Custom asset type name is required.';
        hasValidationErrors = true;
    }
    if (!ticker) {
        currentFieldErrors.ticker = 'Name/Ticker is required.';
        hasValidationErrors = true;
    }

     // Validate numeric fields before parsing
     const allocError = validateField('allocationPercentage', allocationPercentage);
     if (allocError) {
         currentFieldErrors.allocationPercentage = allocError;
         hasValidationErrors = true;
     }
     const returnError = validateField('expectedReturn', expectedReturn);
     if (returnError) {
         currentFieldErrors.expectedReturn = returnError;
         hasValidationErrors = true;
     }

    // If any validation errors, update state and stop submission
    if (hasValidationErrors) {
        setFieldErrors(currentFieldErrors);
        setSubmissionError('Please fix the errors in the form.'); // Generic submission error
        return;
    }
    // --- End Validation ---


    try {
      // Use helper to parse values, assuming they are now valid due to pre-submission checks
      const parsedAllocation = parseNumericValue(allocationPercentage);
      const parsedReturn = parseNumericValue(expectedReturn);

      // Payload construction remains the same
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
      setSubmissionError(err.response?.data?.message || 'Failed to save asset. Please check the details.'); // Use setSubmissionError
    }
  };

  return (
    <FormCommon>
      <form onSubmit={handleSubmit}>
        <h3 className={styles.formTitle}>
          {isEditing ? 'Edit Asset' : 'Add New Asset'}
        </h3>
        {/* Display submission error */}
        {submissionError && <p className={styles.errorMessage}>{submissionError}</p>}

        {/* Asset Type Select */}
        <div className={styles.formGroup}>
          <label htmlFor="assetType" className={styles.label}>Asset Type*</label>
          <Select
            id="assetType"
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            required
            placeholder="-- Select Asset Type --"
            error={!!fieldErrors.assetType} // Indicate error on Select
          >
            {assetTypeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          {fieldErrors.assetType && <p className={styles.fieldErrorMessage}>{fieldErrors.assetType}</p>}

          {/* Custom Asset Type Input (Conditional) */}
          {assetType === 'Other' && (
            <>
             <Input
               type="text"
               placeholder="Enter custom asset type name (e.g., Cryptocurrency)"
               value={customAssetType}
               onChange={(e) => setCustomAssetType(e.target.value)}
               required={assetType === 'Other'}
               className={styles.customTypeInput}
               error={!!fieldErrors.customAssetType} // Indicate error on Input
             />
             {fieldErrors.customAssetType && <p className={styles.fieldErrorMessage}>{fieldErrors.customAssetType}</p>}
            </>
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
            error={!!fieldErrors.ticker} // Indicate error on Input
          />
           {fieldErrors.ticker && <p className={styles.fieldErrorMessage}>{fieldErrors.ticker}</p>}
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
                onChange={handleValueChange(setAllocationPercentage, 'allocationPercentage')}
                className={styles.rangeInput}
                aria-invalid={!!fieldErrors.allocationPercentage} // Accessibility
              />
              {/* Number input synced with the slider */}
              <Input
                id="allocationNumber"
                type="number"
                min="0" max="100" step="1"
                value={allocationPercentage} // Bind directly to string state
                onChange={handleValueChange(setAllocationPercentage, 'allocationPercentage')}
                onBlur={() => handleBlur('allocationPercentage', allocationPercentage)} // Validate on blur
                className={styles.rangeValueInput}
                error={!!fieldErrors.allocationPercentage} // Pass error state
                aria-label="Target Allocation Percentage Number Input"
                aria-invalid={!!fieldErrors.allocationPercentage} // Accessibility
                aria-describedby="allocation-error" // Accessibility
              />
              <span className={styles.rangeUnit}>%</span>
          </div>
           {fieldErrors.allocationPercentage && <p id="allocation-error" className={styles.fieldErrorMessage}>{fieldErrors.allocationPercentage}</p>}
        </div>

        {/* Expected Return Range Slider & Number Input with Tooltip */}
        <div className={styles.formGroup}>
          <div className={styles.labelWithTooltip}>
            <label htmlFor="expectedReturnRange" className={styles.label}>Manual Expected Return (%)</label>
             <Tooltip text="Optional. Enter your own expected annual return. Leave at 0 to let the system estimate (if applicable for the asset type).">
                <InformationCircleIcon className={styles.tooltipIcon} />
             </Tooltip>
          </div>
           <div className={styles.rangeGroup}>
              <input
                id="expectedReturnRange"
                type="range"
                min="-10" max="25" step="0.1" // Adjusted range
                value={parseNumericValue(expectedReturn)} // Use parsed value for slider
                onChange={handleValueChange(setExpectedReturn, 'expectedReturn')}
                className={styles.rangeInput}
                aria-invalid={!!fieldErrors.expectedReturn} // Accessibility
              />
              {/* Number input synced with the slider */}
               <Input
                 id="expectedReturnNumber"
                 type="number"
                 min="-10" max="25" step="0.1"
                 value={expectedReturn} // Bind directly to string state
                 onChange={handleValueChange(setExpectedReturn, 'expectedReturn')}
                 onBlur={() => handleBlur('expectedReturn', expectedReturn)} // Validate on blur
                 className={styles.rangeValueInput}
                 error={!!fieldErrors.expectedReturn} // Pass error state
                 aria-label="Manual Expected Return Percentage Number Input"
                 aria-invalid={!!fieldErrors.expectedReturn} // Accessibility
                 aria-describedby="return-error" // Accessibility
               />
               <span className={styles.rangeUnit}>%</span>
          </div>
          {fieldErrors.expectedReturn && <p id="return-error" className={styles.fieldErrorMessage}>{fieldErrors.expectedReturn}</p>}
          <small className={styles.inputHint}>Used only if provided.</small> { /* Adjusted hint */ }
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
    </FormCommon>
  );
} 