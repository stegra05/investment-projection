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
    { value: 'Cryptocurrency', label: 'Cryptocurrency' },
    { value: 'Options', label: 'Options' },
    { value: 'Other', label: 'Other (Custom)' },
];

// Validation function (can be expanded)
const validateField = (name, value) => {
  let error = '';
  const numValue = parseFloat(value);

  if (value === '') return error; // Don't validate empty string immediately

  switch (name) {
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
 * Handles input fields for asset type (including custom), name/ticker,
 * and expected return. Manages loading and error states. Calls appropriate
 * service functions (createAsset, updateAsset) on submit.
 *
 * @param {object} props - The component props.
 * @param {string|number} props.portfolioId - The ID of the portfolio this asset belongs to.
 * @param {object} [props.existingAsset=null] - If provided, the form will be pre-filled with this asset's data
 *                                             for editing. If null, the form is for creating a new asset.
 * @param {Function} props.onSaveAsset - Callback function executed successfully after creating or updating an asset.
 * @param {Function} [props.onCancel] - Optional callback function executed when the cancel button is clicked.
 * @returns {JSX.Element} The AssetForm component.
 */
export default function AssetForm({ portfolioId, existingAsset = null, onSaveAsset, onCancel }) {
  const { isEditing, error: submissionError, setError: setSubmissionError } = useFormState(existingAsset); // Renamed for clarity
  const [assetType, setAssetType] = useState('');
  const [customAssetType, setCustomAssetType] = useState('');
  const [ticker, setTicker] = useState('');
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
        setExpectedReturn(String(existingAsset.manual_expected_return ?? 0));
    } else {
        // Reset form for adding new asset
        setAssetType('');
        setCustomAssetType('');
        setTicker('');
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
      const parsedReturn = parseNumericValue(expectedReturn);

      // Payload construction remains the same
      const payload = {
        asset_type: finalAssetType,
        name_or_ticker: ticker,
        manual_expected_return: parsedReturn,
      };

      if (isEditing && existingAsset) {
        await assetService.updateAsset(portfolioId, existingAsset.asset_id, payload);
      } else {
        await assetService.createAsset(portfolioId, payload);
      }
      onSaveAsset(); // Changed onSaved() to onSaveAsset()
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

        {/* Expected Return Input */}
        <div className={styles.formGroup}>
          <label htmlFor="expectedReturn" className={styles.label}>
            Expected Annual Return (%)</label>
          <Tooltip text="Enter your estimated average annual return for this asset, used for projections.">
            <InformationCircleIcon className={styles.infoIcon} />
          </Tooltip>
          <div className={styles.sliderInputContainer}>
            <Input
              id="expectedReturn"
              type="number"
              value={expectedReturn}
              onChange={handleValueChange(setExpectedReturn, 'expectedReturn')}
              onBlur={() => handleBlur('expectedReturn', expectedReturn)} // Validate on blur
              step="0.1"
              min="-50" // Example range, adjust if needed
              max="100" // Example range, adjust if needed
              className={styles.numberInput} // Add class for potential specific styling
              error={!!fieldErrors.expectedReturn} // Indicate error on Input
            />
            <input
              type="range"
              value={expectedReturn} // Ensure range reflects the number input
              onChange={handleValueChange(setExpectedReturn, 'expectedReturn')} // Update on change
              min="-50" // Mirror number input range
              max="100" // Mirror number input range
              step="0.1"
              className={styles.sliderInput} // Add class for potential specific styling
            />
          </div>
          {fieldErrors.expectedReturn && <p className={styles.fieldErrorMessage}>{fieldErrors.expectedReturn}</p>}
        </div>

        {/* Action Buttons */}
        <div className={styles.buttonGroup}>
            <Button type="submit" variant="primary">
                {isEditing ? 'Save Changes' : 'Add Asset'}
            </Button>
            {onCancel && (
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
            )}
        </div>
      </form>
    </FormCommon>
  );
} 