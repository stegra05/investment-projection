import React from 'react';
import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa';
import {
  EMPTY_ASSETS_LIST,
  TABLE_HEADER_NAME_TICKER,
  TABLE_HEADER_TYPE,
  TABLE_HEADER_ALLOCATION,
  TABLE_HEADER_ACTIONS,
  TEXT_NA,
  ARIA_LABEL_EDIT_ASSET,
  ARIA_LABEL_DELETE_ASSET,
} from '../../../constants/textConstants';
import Spinner from '../../../components/Spinner/Spinner';
import PropTypes from 'prop-types';

function AssetList({ assets, editingAsset, deletingAssetId, onEdit, onDelete }) {
  if (!assets || assets.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-6 min-h-[100px] flex items-center justify-center">
        <p className="text-gray-500 italic">{EMPTY_ASSETS_LIST}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {TABLE_HEADER_NAME_TICKER}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {TABLE_HEADER_TYPE}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {TABLE_HEADER_ALLOCATION}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {TABLE_HEADER_ACTIONS}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {assets.map(asset => {
            const allocation = parseFloat(asset.allocation_percentage);
            const displayAllocation = !isNaN(allocation)
              ? `${allocation.toFixed(2)}%`
              : TEXT_NA;
            const isDeletingThisRow = deletingAssetId === asset.id;
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    className="text-indigo-600 hover:text-indigo-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={ARIA_LABEL_EDIT_ASSET}
                    onClick={() => onEdit(asset)}
                    disabled={isDisabled}
                  >
                    <FaPencilAlt />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={ARIA_LABEL_DELETE_ASSET}
                    onClick={() => onDelete(asset.id)}
                    disabled={isDisabled}
                  >
                    {isDeletingThisRow ? (
                      <Spinner size="h-4 w-4" color="text-red-600" />
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
  );
}

AssetList.propTypes = {
  assets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      asset_type: PropTypes.string.isRequired,
      allocation_percentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  editingAsset: PropTypes.object, // Could be more specific if shape is known
  deletingAssetId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default AssetList; 