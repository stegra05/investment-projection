import React from 'react';
import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa';

function AssetList({ assets, editingAsset, deletingAssetId, onEdit, onDelete }) {
  if (!assets || assets.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-6 min-h-[100px] flex items-center justify-center">
        <p className="text-gray-500 italic">No assets added yet. Add one below.</p>
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
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {assets.map(asset => {
            const allocation = parseFloat(asset.allocation_percentage);
            const displayAllocation = !isNaN(allocation)
              ? `${allocation.toFixed(2)}%`
              : 'N/A';
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
                    aria-label="Edit asset"
                    onClick={() => onEdit(asset)}
                    disabled={isDisabled}
                  >
                    <FaPencilAlt />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete asset"
                    onClick={() => onDelete(asset.id)}
                    disabled={isDisabled}
                  >
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
  );
}

export default AssetList; 