import React, { useState } from 'react';
import { usePortfolio } from '../state/PortfolioContext';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import portfolioService from '../../../api/portfolioService'; // Import the service
import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa'; // Import icons
import EditAssetModal from '../components/EditAssetModal'; // Import the modal
import ConfirmationModal from '../../../components/Modal/ConfirmationModal'; // Import the confirmation modal

// Define options based on AssetType enum - SENDING THE VALUE NOW
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

function AssetsView() {
  const { portfolio, refreshPortfolio, portfolioId } = usePortfolio();

  // Task 7: Implement Form State
  const [assetType, setAssetType] = useState('');
  const [nameOrTicker, setNameOrTicker] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState('');
  const [manualExpectedReturn, setManualExpectedReturn] = useState('');

  // Loading state (Task 9)
  const [isAdding, setIsAdding] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState(null); // State for delete loading indicator on the row
  const [editingAsset, setEditingAsset] = useState(null); // State for asset being edited

  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [assetToDeleteId, setAssetToDeleteId] = useState(null); // State to hold the ID of the asset targeted for deletion

  // Refined Error States (Task 11)
  const [addError, setAddError] = useState(null); // For general errors
  const [fieldErrors, setFieldErrors] = useState({}); // For field-specific validation errors
  const [addSuccessMessage, setAddSuccessMessage] = useState(null); // For success messages

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

  // Form Submission Logic (Task 8 & 9)
  const handleSubmit = async e => {
    e.preventDefault();
    setAddError(null); // Clear general error
    setFieldErrors({}); // Clear field errors

    if (!portfolioId) {
      setAddError('Portfolio ID is missing.');
      return;
    }

    // Construct assetData (asset_type will now be 'Stock', 'Bond', etc.)
    const assetData = {
      asset_type: assetType,
      name_or_ticker: nameOrTicker,
      allocation_percentage: parseFloat(allocationPercentage) || 0,
      ...(manualExpectedReturn && { manual_expected_return: parseFloat(manualExpectedReturn) }),
    };

    // Frontend validation (can be improved, e.g., using a library)
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
      // Log assetData just before sending
      // console.log('Sending asset data:', assetData); // Keep commented out for debugging if needed

      // Use portfolioId directly for the API call
      await portfolioService.addAssetToPortfolio(portfolioId, assetData);

      // Task 10: Clear form and refresh portfolio data
      setAssetType('');
      setNameOrTicker('');
      setAllocationPercentage('');
      setManualExpectedReturn('');
      if (refreshPortfolio) {
        refreshPortfolio();
      } else {
        console.warn('refreshPortfolio function not available from context.'); // Keep this warn
      }
      setAddSuccessMessage('Asset added successfully!');
      setTimeout(() => {
        setAddSuccessMessage(null);
      }, 3000); // Clear message after 3 seconds
    } catch (error) {
      // Keep error handling, but remove direct console.error if desired
      // console.error('Failed to add asset:', error);
      // if (error.response) {
      //   console.error('Backend Error Response:', error.response);
      // }

      const validationErrors = error.response?.data?.validation_error;
      const apiErrors = error.response?.data?.errors; // Keep checking for this just in case
      const detailMessage = error.response?.data?.detail;
      const generalMessage =
        error.response?.data?.message ||
        detailMessage ||
        error.message ||
        'Failed to add asset. Please try again.';

      if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
        // Log the raw validation errors from backend
        // console.log('Raw validation errors from backend:', JSON.stringify(validationErrors));

        const newFieldErrors = {};
        validationErrors.forEach(err => {
          let fieldName = null;
          // Adjust loc parsing: check loc[0] if length is 1, else loc[1]
          if (err.loc && err.loc.length === 1 && typeof err.loc[0] === 'string') {
            fieldName = err.loc[0];
          } else if (err.loc && err.loc.length > 1 && typeof err.loc[1] === 'string') {
            fieldName = err.loc[1];
          }

          if (fieldName) {
            // Explicitly map known backend fields to UI display keys
            // Add more mappings if backend uses different names
            let uiFieldName = fieldName; // Default to backend name
            if (fieldName === 'name_or_ticker') uiFieldName = 'nameOrTicker';
            else if (fieldName === 'asset_type') uiFieldName = 'assetType';
            else if (fieldName === 'allocation_percentage') uiFieldName = 'allocationPercentage';
            else if (fieldName === 'manual_expected_return') uiFieldName = 'manualExpectedReturn';

            newFieldErrors[uiFieldName] = err.msg; // Use UI field name for state
            // Also store under backend name for direct display if needed
            newFieldErrors[fieldName] = err.msg;
          }
        });
        // console.log('Processed field errors for UI:', newFieldErrors);
        setFieldErrors(newFieldErrors);
        setAddError(null);
      } else if (apiErrors && typeof apiErrors === 'object' && Object.keys(apiErrors).length > 0) {
        setFieldErrors(apiErrors);
        setAddError(null);
      } else {
        setAddError(generalMessage);
        setFieldErrors({}); // Clear field errors if we only have a general one
      }
    } finally {
      setIsAdding(false);
    }
  };

  // --- Handle Asset Deletion Flow ---

  // Step 1: Request deletion and open confirmation modal
  const handleDeleteRequest = assetId => {
    setAssetToDeleteId(assetId); // Store the ID of the asset to delete
    setIsConfirmModalOpen(true); // Open the confirmation modal
    setAddError(null); // Clear previous errors when initiating delete
  };

  // Step 2: User confirms deletion in the modal
  const handleConfirmDelete = async () => {
    if (!assetToDeleteId) return; // Should not happen, but safeguard

    setAddError(null); // Clear previous errors
    setDeletingAssetId(assetToDeleteId); // Set loading indicator specifically for the row being deleted
    setIsConfirmModalOpen(false); // Close the modal immediately

    try {
      await portfolioService.deleteAssetFromPortfolio(portfolioId, assetToDeleteId);
      // Refresh portfolio data to reflect deletion
      if (refreshPortfolio) {
        refreshPortfolio();
      } else {
        console.warn('refreshPortfolio function not available from context.');
      }
      setAddSuccessMessage('Asset deleted successfully!');
    } catch (error) {
      // console.error(`Failed to delete asset ${assetToDeleteId}:`, error);
      const detailMessage = error.response?.data?.detail;
      const generalApiMessage = error.response?.data?.message;
      const fallbackMessage = 'Failed to delete asset. Please try again.';
      setAddError(detailMessage || generalApiMessage || error.message || fallbackMessage);
    } finally {
      setDeletingAssetId(null); // Clear row loading indicator
      setAssetToDeleteId(null); // Clear the stored asset ID
    }
  };

  // Step 3: User cancels deletion in the modal
  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false); // Close the modal
    setAssetToDeleteId(null); // Clear the stored asset ID
  };

  // --- Handle Asset Editing ---
  const handleOpenEditModal = assetToEdit => {
    setEditingAsset(assetToEdit);
    setAddError(null); // Clear any previous errors when opening modal
    setFieldErrors({});
  };

  const handleCloseEditModal = () => {
    setEditingAsset(null);
  };

  const handleSaveEdit = () => {
    // Refresh portfolio data after successful save
    if (refreshPortfolio) {
      refreshPortfolio();
    } else {
      console.warn('refreshPortfolio function not available from context.');
    }
    handleCloseEditModal(); // Close the modal
    setAddSuccessMessage('Asset updated successfully!');
  };

  if (!portfolio) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading portfolio data or portfolio not selected...
      </div>
    );
  }

  return (
    // Main container with some padding
    <div className="p-1 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Assets for {portfolio.name}</h2>

        {/* Existing Assets Section (Task 4 Implementation) */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Existing Assets</h3>

          {portfolio.assets && portfolio.assets.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name / Ticker
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Allocation
                    </th>
                    {/* Add Actions column */}
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {portfolio.assets.map(asset => {
                    const allocation = parseFloat(asset.allocation_percentage);
                    const displayAllocation = !isNaN(allocation)
                      ? `${allocation.toFixed(2)}%`
                      : 'N/A';
                    // Use deletingAssetId for the row-specific loading spinner
                    const isDeletingThisRow = deletingAssetId === asset.id;
                    // Disable buttons if this row is being deleted OR if the edit modal is open
                    const isDisabled = isDeletingThisRow || !!editingAsset;

                    return (
                      <tr key={asset.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {asset.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {asset.asset_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {displayAllocation}
                        </td>
                        {/* Add cell for action buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {/* Edit Button */}
                          <button
                            className="text-indigo-600 hover:text-indigo-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Edit asset"
                            onClick={() => handleOpenEditModal(asset)}
                            disabled={isDisabled} // Updated disabled logic
                          >
                            <FaPencilAlt />
                          </button>
                          {/* Delete Button - Updated onClick */}
                          <button
                            className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Delete asset"
                            onClick={() => handleDeleteRequest(asset.id)} // Use handleDeleteRequest
                            disabled={isDisabled} // Updated disabled logic
                          >
                            {/* Show spinner only if this specific row is being deleted */}
                            {isDeletingThisRow ? (
                              <svg
                                className="animate-spin h-4 w-4 text-red-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            ) : (
                              <FaTrashAlt />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // Styled Empty State (from Task 12)
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-6 min-h-[100px] flex items-center justify-center">
              <p className="text-gray-500 italic">No assets added yet. Add one below.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add New Asset Section - visually separated */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Add New Asset</h3>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          {' '}
          {/* Limit form width */}
          {/* --- Asset Type --- */}
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
              // Remove bottom margin from component itself as form uses space-y
              className="mb-0"
            />
            {/* Error message styling */}
            {(fieldErrors.asset_type || fieldErrors.assetType) && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.asset_type || fieldErrors.assetType}
              </p>
            )}
          </div>
          {/* --- Name / Ticker --- */}
          <div>
            <Input
              label="Name / Ticker"
              id="nameOrTicker"
              name="nameOrTicker"
              value={nameOrTicker}
              onChange={handleInputChange}
              required
              placeholder="e.g., Apple Inc. or AAPL"
              className="mb-0" // Remove bottom margin
            />
            {(fieldErrors.name_or_ticker || fieldErrors.nameOrTicker) && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.name_or_ticker || fieldErrors.nameOrTicker}
              </p>
            )}
          </div>
          {/* --- Allocation Percentage --- */}
          <div>
            <Input
              label="Allocation Percentage (%)" // Added (%) for clarity
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
              className="mb-0" // Remove bottom margin
            />
            {(fieldErrors.allocation_percentage || fieldErrors.allocationPercentage) && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.allocation_percentage || fieldErrors.allocationPercentage}
              </p>
            )}
          </div>
          {/* --- Manual Expected Return --- */}
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
              className="mb-0" // Remove bottom margin
            />
            {fieldErrors.manual_expected_return && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.manual_expected_return}</p>
            )}
          </div>
          {/* General error message - slightly more padding */}
          {addError && (
            <div className="text-red-600 text-sm p-3 my-2 bg-red-100 border border-red-400 rounded">
              {addError}
            </div>
          )}
          {/* Success Message Display */}
          {addSuccessMessage && (
            <div className="text-green-600 text-sm p-3 my-2 bg-green-100 border border-green-400 rounded">
              {addSuccessMessage}
            </div>
          )}
          {/* Submit Button - give it some top margin */}
          <div className="pt-2">
            <Button type="submit" variant="primary" disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Add Asset'}
            </Button>
          </div>
        </form>
      </div>

      {/* Render the Edit Asset Modal */}
      <EditAssetModal
        isOpen={editingAsset !== null}
        onClose={handleCloseEditModal}
        asset={editingAsset}
        onSave={handleSaveEdit}
      />

      {/* Render the Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        confirmText="Delete Asset"
        // Show loading state on confirm button only when the specific asset ID matches
        isConfirming={deletingAssetId !== null && deletingAssetId === assetToDeleteId}
      >
        Are you sure you want to delete this asset? This action cannot be undone.
      </ConfirmationModal>
    </div>
  );
}

export default AssetsView;
