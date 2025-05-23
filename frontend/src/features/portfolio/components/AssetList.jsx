import React from 'react';
import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa'; // Icons for edit and delete actions.
import {
  EMPTY_ASSETS_LIST,
  TABLE_HEADER_NAME_TICKER,
  TABLE_HEADER_TYPE,
  TABLE_HEADER_ALLOCATION,
  TABLE_HEADER_ACTIONS,
  TEXT_NA, // Constant for "Not Applicable" text.
  ARIA_LABEL_EDIT_ASSET,
  ARIA_LABEL_DELETE_ASSET,
} from '../../../constants/textConstants'; // UI text constants.
import Spinner from '../../../components/Spinner/Spinner'; // Spinner for loading states.
import PropTypes from 'prop-types';

/**
 * @component AssetList
 * @description Displays a list of assets within a portfolio in a tabular format.
 * Each row represents an asset and includes its name, type, allocation percentage,
 * and action buttons for editing or deleting the asset.
 * Handles empty states and indicates when an asset is being deleted.
 *
 * @example
 * const assets = [{id: 1, name: 'Apple Inc.', asset_type: 'Stock', allocation_percentage: 50}];
 * <AssetList
 *   assets={assets}
 *   editingAsset={null}
 *   deletingAssetId={null}
 *   onEdit={(asset) => console.log('Edit:', asset)}
 *   onDelete={(assetId) => console.log('Delete:', assetId)}
 * />
 *
 * @param {object} props - The component's props.
 * @param {Array<object>} props.assets - An array of asset objects to display.
 *                                       Each asset object should have `id`, `name`, `asset_type`, and `allocation_percentage`.
 * @param {object|null} props.editingAsset - The asset object currently being edited (if any). Used to disable other actions.
 * @param {string|number|null} props.deletingAssetId - The ID of the asset currently being deleted (if any).
 *                                                      Used to show a spinner on the delete button and disable actions.
 * @param {Function} props.onEdit - Callback function invoked when the edit button for an asset is clicked.
 *                                  Receives the asset object as an argument. Required.
 * @param {Function} props.onDelete - Callback function invoked when the delete button for an asset is clicked.
 *                                    Receives the asset ID as an argument. Required.
 *
 * @returns {JSX.Element} The rendered list of assets or an empty state message.
 */
function AssetList({ assets, editingAsset, deletingAssetId, onEdit, onDelete }) {
  // If there are no assets or the assets array is not provided, display an empty state message.
  if (!assets || assets.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-6 min-h-[100px] flex items-center justify-center">
        <p className="text-gray-500 italic">{EMPTY_ASSETS_LIST}</p>
      </div>
    );
  }

  return (
    // Container for the table, allowing horizontal scrolling on smaller screens if needed.
    <div className="overflow-x-auto border border-gray-200 rounded-md">
      <table className="min-w-full divide-y divide-gray-200">
        {/* Table Header */}
        <thead className="bg-gray-50">
          <tr>
            {/* Header cell for Asset Name/Ticker. */}
            <th
              scope="col" // Accessibility: defines cell as a header for its column.
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {TABLE_HEADER_NAME_TICKER}
            </th>
            {/* Header cell for Asset Type. */}
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {TABLE_HEADER_TYPE}
            </th>
            {/* Header cell for Allocation Percentage. */}
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {TABLE_HEADER_ALLOCATION}
            </th>
            {/* Header cell for Actions (Edit/Delete). */}
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {TABLE_HEADER_ACTIONS}
            </th>
          </tr>
        </thead>
        {/* Table Body: Renders a row for each asset. */}
        <tbody className="bg-white divide-y divide-gray-200">
          {assets.map(asset => {
            // Parse allocation_percentage to a float for formatting.
            const allocation = parseFloat(asset.allocation_percentage);
            // Format allocation as a percentage string, or display "N/A" if not a valid number.
            const displayAllocation = !isNaN(allocation)
              ? `${allocation.toFixed(2)}%` // Format to 2 decimal places.
              : TEXT_NA; // Use "N/A" constant if allocation is not a number.
            
            // Check if the current asset row is the one being deleted.
            const isDeletingThisRow = deletingAssetId === asset.id;
            // Determine if action buttons for this row should be disabled.
            // Disabled if this row is being deleted OR if any other asset is currently being edited.
            const isDisabled = isDeletingThisRow || !!editingAsset;

            return (
              <tr key={asset.id}>
                {/* Asset Name Cell */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {asset.name}
                </td>
                {/* Asset Type Cell */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {asset.asset_type}
                </td>
                {/* Allocation Percentage Cell */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {displayAllocation}
                </td>
                {/* Actions Cell (Edit/Delete Buttons) */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {/* Edit Button */}
                  <button
                    className="text-indigo-600 hover:text-indigo-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={ARIA_LABEL_EDIT_ASSET} // Accessibility label.
                    onClick={() => onEdit(asset)} // Calls onEdit prop with the asset object.
                    disabled={isDisabled} // Disable if conditions met.
                  >
                    <FaPencilAlt /> {/* Edit icon. */}
                  </button>
                  {/* Delete Button */}
                  <button
                    className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={ARIA_LABEL_DELETE_ASSET} // Accessibility label.
                    onClick={() => onDelete(asset.id)} // Calls onDelete prop with asset ID.
                    disabled={isDisabled} // Disable if conditions met.
                  >
                    {/* Show spinner if this specific asset is being deleted, otherwise show trash icon. */}
                    {isDeletingThisRow ? (
                      <Spinner size="h-4 w-4" color="text-red-600" />
                    ) : (
                      <FaTrashAlt /> // Delete icon.
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// PropTypes for type-checking and component documentation.
AssetList.propTypes = {
  /** 
   * An array of asset objects to be displayed in the list.
   * Each asset object must have `id`, `name`, `asset_type`, and `allocation_percentage`.
   */
  assets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      asset_type: PropTypes.string.isRequired,
      allocation_percentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      // Add other expected asset properties here if they become relevant for display or logic.
    })
  ),
  /** 
   * The asset object that is currently being edited. If an asset is being edited,
   * action buttons on other rows might be disabled. `null` if no asset is being edited.
   */
  editingAsset: PropTypes.object, // Consider defining a more specific shape if the structure is known and consistent.
  /** 
   * The ID of the asset that is currently in the process of being deleted. 
   * This is used to show a loading spinner on the specific asset's delete button. `null` if no asset is being deleted.
   */
  deletingAssetId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** 
   * Callback function triggered when the "Edit" button for an asset is clicked.
   * Receives the full asset object as its argument. Required.
   */
  onEdit: PropTypes.func.isRequired,
  /** 
   * Callback function triggered when the "Delete" button for an asset is clicked.
   * Receives the ID of the asset to be deleted as its argument. Required.
   */
  onDelete: PropTypes.func.isRequired,
};

export default AssetList;