import React from 'react';
import PropTypes from 'prop-types';

const TargetAllocationInput = ({ 
  portfolioAssets, 
  targetAllocationsDisplay, 
  allocationSum, 
  handleAllocationChange, 
}) => {
  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50">
      <h3 className="text-md font-semibold text-gray-700">Target Allocations</h3>
      {!portfolioAssets || portfolioAssets.length === 0 ? (
        <p className="text-sm text-gray-500">
          No assets available in the portfolio to reallocate.
        </p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {targetAllocationsDisplay.map(allocItem => (
            <div
              key={allocItem.assetId}
              className="grid grid-cols-3 gap-x-3 items-center"
            >
              <label
                htmlFor={`asset-${allocItem.assetId}-perc`}
                className="col-span-2 text-sm text-gray-600 truncate"
                title={allocItem.assetName}
              >
                {allocItem.assetName}
              </label>
              <div className="relative col-span-1">
                <input
                  type="number"
                  id={`asset-${allocItem.assetId}-perc`}
                  name={`alloc-${allocItem.assetId}`}
                  value={allocItem.newPercentage}
                  onChange={e =>
                    handleAllocationChange(allocItem.assetId, e.target.value)
                  }
                  placeholder="%"
                  min="0"
                  max="100"
                  step="0.01"
                  className="mt-1 block w-full pl-3 pr-7 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm text-right"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
        <p className="text-sm font-medium text-gray-800">Total:</p>
        <p
          className={`text-sm font-semibold ${allocationSum === 100 ? 'text-green-600' : 'text-red-600'}`}
        >
          {allocationSum.toFixed(2)}%
        </p>
      </div>
      {allocationSum !== 100 && (
        <p className="text-xs text-red-500">Total allocation must sum to 100%.</p>
      )}
    </div>
  );
};

TargetAllocationInput.propTypes = {
  portfolioAssets: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
  })),
  targetAllocationsDisplay: PropTypes.arrayOf(PropTypes.shape({
    assetId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    assetName: PropTypes.string.isRequired,
    newPercentage: PropTypes.string.isRequired, // Input values are strings
  })).isRequired,
  allocationSum: PropTypes.number.isRequired,
  handleAllocationChange: PropTypes.func.isRequired,
};

export default TargetAllocationInput; 