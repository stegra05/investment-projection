import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import styles from './AssetList.module.css'; // Import CSS Module

/**
 * Represents a single asset item in the AssetList.
 *
 * Displays the asset's details (name, type, allocation, return) and provides
 * buttons for editing and deleting the asset. Also includes a slider for allocation.
 *
 * @param {object} props - The component props.
 * @param {object} props.asset - The asset object to display.
 * @param {number} props.currentAllocation - The current allocation percentage from the parent state.
 * @param {Function} props.onAllocationChange - Callback function triggered when the allocation slider changes.
 * @param {Function} props.onEdit - Callback function triggered when the edit button is clicked.
 * @param {Function} props.onDelete - Callback function triggered when the delete button is clicked.
 * @param {boolean} props.disabled - Whether the inputs/buttons should be disabled.
 * @returns {JSX.Element} The AssetListItem component.
 */
function AssetListItem({ asset, currentAllocation, onAllocationChange, onEdit, onDelete, disabled }) {
  // Format percentage and return nicely
  const formatPercent = (value) => value != null ? `${value.toFixed(2)}%` : '0.00%'; // Show 2 decimals

  const formatReturn = (value) => {
    // Check if value is null or undefined first
    if (value == null) {
      return 'N/A';
    }
    // Try to parse the value as a float
    const numValue = parseFloat(value);
    // Check if parsing was successful and it's a valid number
    if (!isNaN(numValue)) {
      return `${numValue.toFixed(1)}%`;
    }
    // If parsing failed or it's not a number, return 'N/A'
    return 'N/A';
  };

  // Format for display in the number input
  const formatNumberInput = (value) => (value != null ? Number(value).toFixed(2) : '0.00');

  // --- LOCAL STATE for the number input --- 
  const [localInputValue, setLocalInputValue] = useState(formatNumberInput(currentAllocation));

  // Effect to sync local state when the prop changes from parent
  useEffect(() => {
    setLocalInputValue(formatNumberInput(currentAllocation));
  }, [currentAllocation]);
  // --- END LOCAL STATE ---

  // Update parent state immediately when SLIDER changes
  const handleSliderChange = (event) => {
    const newValue = event.target.value;
    setLocalInputValue(formatNumberInput(newValue)); // Keep local input synced
    onAllocationChange(asset.id, newValue);
  };

  // Update local state only when INPUT changes
  const handleLocalInputChange = (event) => {
    setLocalInputValue(event.target.value);
  };

  // Update parent state when INPUT loses focus (onBlur)
  const handleInputBlur = (event) => {
     // Pass the current localInputValue to the parent
     // The parent's handleAllocationChange already handles parseFloat etc.
    onAllocationChange(asset.id, localInputValue);
    // Optional: Re-format local state in case of invalid input during typing?
    // setLocalInputValue(formatNumberInput(currentAllocation)); // This might cause flicker if parent update is slow
  };

  return (
    <li className={styles.listItem}>
      <div className={styles.assetInfo}>
        <div className={styles.assetDetails}>
            <strong className={styles.assetName}>{asset.name_or_ticker}</strong> {/* Use name_or_ticker */}
            <span className={styles.assetType}>({asset.asset_type})</span>
            <span className={styles.expectedReturn}>Exp. Return: {formatReturn(asset.manual_expected_return)}</span>
        </div>
        {/* Container for both slider and input */}
        <div className={styles.allocationControl}>
            {/* Label slider explicitly */}
            <label htmlFor={`alloc-slider-${asset.id}`} className={styles.allocationLabel}>
                 Allocation: {formatPercent(currentAllocation)}
            </label>
            <input
                type="range"
                id={`alloc-slider-${asset.id}`} // Unique ID for slider
                min="0"
                max="100"
                step="0.1" // Fine-grained control
                value={currentAllocation} // Controlled component
                onChange={handleSliderChange} // Use immediate handler for slider
                disabled={disabled}
                className={styles.allocationSlider}
            />
            <input
                type="number"
                id={`alloc-input-${asset.id}`} // Unique ID for input
                min="0"
                max="100"
                step="0.01" // Allow two decimal places
                value={localInputValue} // Bind to local state
                onChange={handleLocalInputChange} // Update local state on change
                onBlur={handleInputBlur} // Update parent state on blur
                disabled={disabled}
                className={styles.allocationInput} // Add specific class for styling
                aria-label={`Allocation percentage for ${asset.name_or_ticker}`}
            />
        </div>
      </div>
      <div className={styles.actions}>
        <button
            onClick={() => onEdit(asset)}
            className={styles.actionButton}
            aria-label={`Edit ${asset.name_or_ticker}`}
            disabled={disabled}
        >
          <PencilIcon className={`${styles.icon} ${styles.iconEdit}`} />
        </button>
        <button
            onClick={() => onDelete(asset)}
            className={styles.actionButton}
            aria-label={`Delete ${asset.name_or_ticker}`}
            disabled={disabled}
        >
          <TrashIcon className={`${styles.icon} ${styles.iconDelete}`} />
        </button>
      </div>
    </li>
  );
}

/**
 * Displays a list of assets belonging to a portfolio, including allocation sliders.
 *
 * Renders an AssetListItem for each asset in the provided array.
 * Shows a message if the list is empty.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} props.assets - An array of asset objects to display.
 * @param {object} props.allocations - A map of asset_id to current allocation percentage.
 * @param {Function} props.onAllocationChange - Callback function passed down to AssetListItem for allocation changes.
 * @param {Function} props.onEdit - Callback function passed down to AssetListItem for editing.
 * @param {Function} props.onDelete - Callback function passed down to AssetListItem for deleting.
 * @param {boolean} props.disabled - Whether the list items should be disabled.
 * @returns {JSX.Element} The AssetList component.
 */
export default function AssetList({ assets, allocations, onAllocationChange, onEdit, onDelete, disabled }) {
  if (!assets || assets.length === 0) {
    return <p className={styles.noItemsText}>No assets have been added to this portfolio yet.</p>;
  }

  return (
    <ul className={styles.list}>
      {assets.map((asset) => {
        // Add defensive check for key
        if (!asset || typeof asset.id === 'undefined') {
            console.error("Asset or id is missing in AssetList map:", asset);
            return null; // Don't render item if key is missing
        }
        return (
            <AssetListItem
                key={asset.id}
                asset={asset}
                currentAllocation={allocations[asset.id] ?? 0}
                onAllocationChange={onAllocationChange}
                onEdit={onEdit}
                onDelete={onDelete}
                disabled={disabled}
            />
        );
      })}
    </ul>
  );
}

// Basic styles (consider moving to CSS modules or styled-components later)
// const styles = { ... }; // Removed inline styles object
// ... existing code ... 