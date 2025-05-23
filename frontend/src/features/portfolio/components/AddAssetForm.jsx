import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select'; // Custom Select component.
import Button from '../../../components/Button/Button';
import AlertMessage from '../../../components/AlertMessage/AlertMessage'; // For success/error messages.
import portfolioService from '../../../api/portfolioService'; // API service for portfolio operations.
import { FaPercent, FaDollarSign } from 'react-icons/fa'; // Icons for allocation mode buttons.
import useTheme from '../../../hooks/useTheme'; // Hook for theme context (e.g., high-contrast).

/**
 * @component AddAssetForm
 * @description A form component used to add new assets to a specified portfolio.
 * It captures asset details such as type, name/ticker, allocation (either percentage or fixed value),
 * and an optional manual expected return. Includes client-side validation and handles
 * detailed backend validation errors by mapping them to specific fields.
 * Manages loading states for submission and displays success or error messages.
 *
 * @example
 * const assetTypes = [{value: 'Stock', label: 'Stock'}, {value: 'Bond', label: 'Bond'}];
 * <AddAssetForm
 *   portfolioId="123"
 *   refreshPortfolio={fetchPortfolioDetails}
 *   assetTypeOptions={assetTypes}
 * />
 *
 * @param {object} props - The component's props.
 * @param {string|number} props.portfolioId - The ID of the portfolio to which the asset will be added. Required.
 * @param {Function} props.refreshPortfolio - Callback function to refresh portfolio data after an asset is added. Required.
 * @param {Array<object>} props.assetTypeOptions - Array of options for the asset type select dropdown.
 *                                                Each option is an object with `value` and `label`. Required.
 *
 * @returns {JSX.Element} The rendered form for adding a new asset.
 */
function AddAssetForm({ portfolioId, refreshPortfolio, assetTypeOptions }) {
  // Hook to access the current theme (e.g., for high-contrast mode styling).
  const { theme } = useTheme();

  // State for individual form fields.
  const [assetType, setAssetType] = useState('');
  const [nameOrTicker, setNameOrTicker] = useState('');
  // State to manage whether allocation is by 'percentage' or 'value'.
  const [allocationMode, setAllocationMode] = useState('percentage'); 
  const [allocationPercentage, setAllocationPercentage] = useState('');
  const [allocationValue, setAllocationValue] = useState(''); 
  const [manualExpectedReturn, setManualExpectedReturn] = useState('');

  // State for managing form submission status.
  const [isAdding, setIsAdding] = useState(false); // True when API call is in progress.
  const [addError, setAddError] = useState(null); // General error message from API.
  // State for field-specific validation errors (from client-side or backend).
  const [fieldErrors, setFieldErrors] = useState({});
  // State for displaying a temporary success message after adding an asset.
  const [addSuccessMessage, setAddSuccessMessage] = useState(null);

  /**
   * Handles input changes for most form fields and updates the corresponding state.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} e - The change event.
   */
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
      // Should not happen if all inputs have a corresponding case.
      break;
    }
  };

  /**
   * Handles changes in the allocation mode (percentage vs. value).
   * Clears the input value and any field errors associated with the deselected mode.
   * @param {'percentage'|'value'} mode - The selected allocation mode.
   */
  const handleAllocationModeChange = (mode) => {
    setAllocationMode(mode);
    // When switching modes, clear the value and errors of the other mode's input.
    if (mode === 'percentage') {
      setAllocationValue(''); 
      // Clear potential errors for allocationValue from backend (key `allocation_value`) and frontend (key `allocationValue`).
      setFieldErrors(prev => ({ ...prev, allocationValue: undefined, allocation_value: undefined }));
    } else { // mode === 'value'
      setAllocationPercentage(''); 
      setFieldErrors(prev => ({ ...prev, allocationPercentage: undefined, allocation_percentage: undefined }));
    }
  };

  /**
   * Handles the form submission to add a new asset.
   * Performs client-side validation, constructs the asset data payload,
   * calls the `portfolioService` to add the asset, and manages UI state (loading, errors, success).
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubmit = async e => {
    e.preventDefault(); // Prevent default browser form submission.
    setAddError(null); // Clear previous general errors.
    setFieldErrors({}); // Clear previous field-specific errors.
    setAddSuccessMessage(null); // Clear previous success messages.

    // Basic check for portfolioId presence.
    if (!portfolioId) {
      setAddError('Portfolio ID is missing. Cannot add asset.');
      return;
    }

    // Construct the base asset data object.
    const assetData = {
      asset_type: assetType,
      name_or_ticker: nameOrTicker,
      // Conditionally add manual_expected_return if it has a value, converting to float.
      ...(manualExpectedReturn && { manual_expected_return: parseFloat(manualExpectedReturn) }),
    };

    // Add allocation data based on the selected mode.
    if (allocationMode === 'percentage') {
      assetData.allocation_percentage = parseFloat(allocationPercentage) || 0;
      assetData.allocation_value = null; // Ensure the other allocation type is null.
    } else { // allocationMode === 'value'
      assetData.allocation_value = parseFloat(allocationValue) || 0;
      assetData.allocation_percentage = null; // Ensure the other allocation type is null.
    }

    // Client-side validation.
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
    } else { // allocationMode === 'value'
      if (isNaN(assetData.allocation_value) || assetData.allocation_value < 0) {
        currentFieldErrors.allocationValue = 'Allocation value must be a non-negative number.';
      }
    }
    // Manual expected return, if provided, should be a number (though API might handle non-numeric if sent).
    // No explicit client-side validation for its numeric format here, assuming type="number" input helps.

    // If there are client-side validation errors, display them and prevent submission.
    if (Object.keys(currentFieldErrors).length > 0) {
      setFieldErrors(currentFieldErrors);
      return;
    }

    setIsAdding(true); // Set loading state.

    try {
      // API call to add the asset.
      await portfolioService.addAssetToPortfolio(portfolioId, assetData);
      
      // Reset form fields on successful submission.
      setAssetType('');
      setNameOrTicker('');
      setAllocationMode('percentage'); 
      setAllocationPercentage('');
      setAllocationValue(''); 
      setManualExpectedReturn('');
      
      // Call the refreshPortfolio callback prop to update the parent component's data.
      if (refreshPortfolio) {
        refreshPortfolio();
      } else {
        // This warning is useful during development if the prop isn't passed correctly.
        console.warn('AddAssetForm: refreshPortfolio function was not provided.');
      }
      
      // Display a temporary success message.
      setAddSuccessMessage('Asset added successfully!');
      setTimeout(() => {
        setAddSuccessMessage(null); // Clear success message after 3 seconds.
      }, 3000);

    } catch (error) {
      // Detailed error handling for API responses.
      const validationErrors = error.response?.data?.validation_error; // FastAPI Pydantic validation errors.
      const apiErrors = error.response?.data?.errors; // Other structured errors from backend.
      const detailMessage = error.response?.data?.detail; // Single string error from FastAPI.
      const generalMessage = // Fallback error message.
        error.response?.data?.message || // Custom message from backend response.
        detailMessage ||
        error.message || // General JS error message.
        'Failed to add asset. Please try again.';

      if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
        // Handle Pydantic validation errors by mapping them to UI field names.
        const newFieldErrors = {};
        validationErrors.forEach(err => {
          let fieldName = null;
          // Attempt to extract field name from error location array.
          if (err.loc && err.loc.length === 1 && typeof err.loc[0] === 'string') {
            fieldName = err.loc[0];
          } else if (err.loc && err.loc.length > 1 && typeof err.loc[1] === 'string') {
            // Pydantic errors often have ['body', 'field_name'] in `loc`.
            fieldName = err.loc[1];
          }

          if (fieldName) {
            // Map backend field names to frontend state field names if they differ.
            let uiFieldName = fieldName;
            if (fieldName === 'name_or_ticker') uiFieldName = 'nameOrTicker';
            else if (fieldName === 'asset_type') uiFieldName = 'assetType';
            else if (fieldName === 'allocation_percentage') uiFieldName = 'allocationPercentage';
            else if (fieldName === 'allocation_value') uiFieldName = 'allocationValue';
            else if (fieldName === 'manual_expected_return') uiFieldName = 'manualExpectedReturn';
            
            newFieldErrors[uiFieldName] = err.msg; // Store the error message for the UI field.
            newFieldErrors[fieldName] = err.msg; // Also store for the original backend field name if needed.
          }
        });
        setFieldErrors(newFieldErrors);
        setAddError(null); // Clear general error if specific field errors are set.
      } else if (apiErrors && typeof apiErrors === 'object' && Object.keys(apiErrors).length > 0) {
        // Handle other structured errors if backend provides them in an 'errors' object.
        setFieldErrors(apiErrors);
        setAddError(null);
      } else {
        // Set a general error message if no specific field errors are identified.
        setAddError(generalMessage);
        setFieldErrors({}); // Clear any previous field errors.
      }
    } finally {
      setIsAdding(false); // Reset loading state regardless of outcome.
    }
  };

  return (
    // Form container with top border and padding.
    <div className="border-t pt-6">
      {/* Form title, styled based on the current theme. */}
      <h3 className={`text-lg font-semibold mb-4 ${theme === 'high-contrast' ? 'text-gray-100' : 'text-gray-900'}`}>Add New Asset</h3>
      {/* The form element with submit handler and spacing for child elements. */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        {/* Alert messages for displaying general errors or success feedback. */}
        <AlertMessage type="error" message={addError} />
        <AlertMessage type="success" message={addSuccessMessage} />

        {/* Select input for Asset Type. */}
        <Select
          label="Asset Type"
          id="assetType"
          name="assetType" // Used in handleInputChange.
          value={assetType}
          onChange={handleInputChange}
          options={assetTypeOptions} // Options passed via props.
          required
          placeholder="Select asset type..."
          // Display field-specific error for asset type.
          error={fieldErrors.asset_type || fieldErrors.assetType}
        />
        
        {/* Text input for Asset Name or Ticker. */}
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

        {/* Fieldset for choosing Allocation Type (Percentage or Value). */}
        <fieldset className="mb-4">
          <legend className={`block text-sm font-medium mb-1 ${theme === 'high-contrast' ? 'text-gray-200' : 'text-gray-700'}`}>Allocation Type</legend>
          {/* Button group for toggling allocation mode. */}
          <div className="inline-flex rounded-md shadow-sm pt-1" role="group">
            {/* Percentage Allocation Button */}
            <button
              type="button" // Important to prevent form submission.
              onClick={() => handleAllocationModeChange('percentage')}
              // Dynamic classes for active/inactive state and theme.
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
            {/* Value Allocation Button */}
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
          {/* Helper text for allocation type selection. */}
          <p className={`mt-2 text-xs ${theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-500'}`}>Specify allocation as a percentage of the total portfolio or as a fixed monetary value. Only one can be active.</p>
        </fieldset>

        {/* Conditionally render Allocation Percentage input field. */}
        {allocationMode === 'percentage' && (
          <Input
            label="Allocation Percentage (%)"
            id="allocationPercentage"
            name="allocationPercentage"
            type="number"
            value={allocationPercentage}
            onChange={handleInputChange}
            required={allocationMode === 'percentage'} // Required only if this mode is active.
            placeholder="e.g., 25"
            min="0"
            max="100"
            step="0.01"
            disabled={allocationMode !== 'percentage'} // Disabled if not in percentage mode.
            error={fieldErrors.allocation_percentage || fieldErrors.allocationPercentage}
          />
        )}

        {/* Conditionally render Allocation Value input field. */}
        {allocationMode === 'value' && (
          <Input
            label="Allocation Value ($)"
            id="allocationValue"
            name="allocationValue"
            type="number"
            value={allocationValue}
            onChange={handleInputChange}
            required={allocationMode === 'value'} // Required only if this mode is active.
            placeholder="e.g., 5000"
            min="0"
            step="0.01"
            disabled={allocationMode !== 'value'} // Disabled if not in value mode.
            error={fieldErrors.allocation_value || fieldErrors.allocationValue}
          />
        )}

        {/* Input field for Manual Expected Return (optional). */}
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
        
        {/* Submit button container. */}
        <div className="pt-2">
          <Button type="submit" variant="primary" disabled={isAdding}>
            {/* Conditional text and spinner for loading state. */}
            {isAdding ? 'Adding...' : 'Add Asset'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// PropTypes for type-checking and component documentation.
AddAssetForm.propTypes = {
  /** The ID of the portfolio to which the new asset will be added. Required. */
  portfolioId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** 
   * Callback function to be invoked after an asset is successfully added,
   * typically used to refresh the portfolio's data in the parent component. Required.
   */
  refreshPortfolio: PropTypes.func.isRequired,
  /** 
   * Array of options for the asset type select dropdown. Each option should be an object
   * with `value` (string) and `label` (string) properties. Required.
   */
  assetTypeOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default AddAssetForm;