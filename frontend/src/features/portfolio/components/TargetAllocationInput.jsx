import React from 'react';
import PropTypes from 'prop-types';
import Input from '../../../components/Input/Input'; // Reusable Input component.

/**
 * @component TargetAllocationInput
 * @description A component for defining target allocation percentages for various assets within a portfolio.
 * It dynamically generates input fields for each asset based on the `targetAllocationsDisplay` prop.
 * It also displays the current sum of allocations and an error message if the sum does not equal 100%.
 * This component is typically used within a form for setting up "Reallocation" planned changes.
 *
 * @example
 * const displayAllocs = [{ assetId: '1', assetName: 'Stock A', newPercentage: '50.00' }];
 * const sum = 50.00;
 * const handleChange = (assetId, newValue) => { /.../ };
 * <TargetAllocationInput
 *   portfolioAssets={[{id: '1', name: 'Stock A'}]} // Optional, primarily for empty state check here
 *   targetAllocationsDisplay={displayAllocs}
 *   allocationSum={sum}
 *   handleAllocationChange={handleChange}
 * />
 *
 * @param {object} props - The component's props.
 * @param {Array<object>} [props.portfolioAssets] - Array of asset objects currently in the portfolio.
 *                                                  Used here mainly to check if any assets exist for the empty state.
 *                                                  The `targetAllocationsDisplay` prop is the primary source for rendering inputs.
 * @param {Array<object>} props.targetAllocationsDisplay - Array of objects representing assets and their target allocations.
 *                                                        Each object should have `assetId`, `assetName`, and `newPercentage` (string). Required.
 * @param {number} props.allocationSum - The current sum of all `newPercentage` values, calculated by the parent. Required.
 * @param {Function} props.handleAllocationChange - Callback function invoked when an allocation percentage input changes.
 *                                                  Receives `assetId` and the new `value` (string) as arguments. Required.
 *
 * @returns {JSX.Element} The rendered target allocation input section.
 */
const TargetAllocationInput = ({ 
  portfolioAssets, // Used to determine if there are any assets to reallocate.
  targetAllocationsDisplay, // Data used to render each allocation input row.
  allocationSum, // Current sum of all target allocations.
  handleAllocationChange, // Callback for when an allocation input changes.
}) => {
  return (
    // Main container with padding, border, and background styling.
    <div className="space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50">
      {/* Section title. */}
      <h3 className="text-md font-semibold text-gray-700">Target Allocations</h3>
      
      {/* Conditional rendering: Display message if no assets are available, otherwise display input fields. */}
      {!portfolioAssets || portfolioAssets.length === 0 ? (
        <p className="text-sm text-gray-500">
          No assets available in the portfolio to reallocate. Add assets to the portfolio first.
        </p>
      ) : (
        // Container for the list of asset allocation inputs, with max height and vertical scroll.
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {/* Map over `targetAllocationsDisplay` to create an input row for each asset. */}
          {targetAllocationsDisplay.map(allocItem => (
            // Grid layout for each row: asset name label and percentage input.
            <div
              key={allocItem.assetId} // Unique key for each asset row.
              className="grid grid-cols-3 gap-x-3 items-center"
            >
              {/* Label for the asset, showing its name. Truncated if too long, full name on hover. */}
              <label
                htmlFor={`asset-${allocItem.assetId}-perc`} // Associates label with the input field.
                className="col-span-2 text-sm text-gray-600 truncate"
                title={allocItem.assetName} // Show full asset name on hover.
              >
                {allocItem.assetName}
              </label>
              {/* Relative container for the input field and the '%' symbol. */}
              <div className="relative col-span-1">
                <Input
                  type="number"
                  id={`asset-${allocItem.assetId}-perc`} // Unique ID for the input.
                  name={`alloc-${allocItem.assetId}`} // Name attribute for the input.
                  value={allocItem.newPercentage} // Controlled input value.
                  // Calls parent's handler with assetId and new value on change.
                  onChange={e =>
                    handleAllocationChange(allocItem.assetId, e.target.value)
                  }
                  placeholder="%" // Placeholder text.
                  min="0"   // Minimum allowed value.
                  max="100" // Maximum allowed value.
                  step="0.01" // Step for number input, allowing decimals.
                  className="pr-7 text-right -mb-4" // Styling: right padding for '%', negative margin for alignment.
                />
                {/* '%' symbol positioned absolutely within the input's relative container. */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer section displaying the total allocation sum and validation message. */}
      <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
        <p className="text-sm font-medium text-gray-800">Total:</p>
        {/* Display the sum, colored green if 100%, red otherwise. */}
        <p
          className={`text-sm font-semibold ${
            // Check for floating point inaccuracies by comparing against a small epsilon range around 100.
            Math.abs(allocationSum - 100) < 0.001 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {allocationSum.toFixed(2)}% {/* Format sum to 2 decimal places. */}
        </p>
      </div>
      {/* Validation message shown if the total allocation sum is not 100%. */}
      {Math.abs(allocationSum - 100) >= 0.001 && ( // Use epsilon for floating point comparison.
        <p className="text-xs text-red-500">Total allocation must sum to 100%.</p>
      )}
    </div>
  );
};

// PropTypes for type-checking and component documentation.
TargetAllocationInput.propTypes = {
  /** 
   * Array of asset objects in the current portfolio. 
   * Primarily used to determine if the list should be empty or if inputs can be rendered.
   * Each object should have at least `id` and `name`.
   */
  portfolioAssets: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
  })),
  /** 
   * Array of objects representing the data for each allocation input field.
   * Each object should have `assetId`, `assetName` (for display), and `newPercentage` (current input value as a string).
   * Required.
   */
  targetAllocationsDisplay: PropTypes.arrayOf(PropTypes.shape({
    assetId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    assetName: PropTypes.string.isRequired,
    newPercentage: PropTypes.string.isRequired, // Input values are typically strings.
  })).isRequired,
  /** 
   * The current sum of all target allocation percentages, calculated by the parent component.
   * Used for display and validation. Required.
   */
  allocationSum: PropTypes.number.isRequired,
  /** 
   * Callback function invoked when the value of any allocation percentage input changes.
   * It receives two arguments: `assetId` (of the changed asset) and `newValue` (the new percentage string).
   * Required.
   */
  handleAllocationChange: PropTypes.func.isRequired,
};

export default TargetAllocationInput;