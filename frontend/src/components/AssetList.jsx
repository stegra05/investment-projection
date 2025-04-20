import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import styles from './AssetList.module.css'; // Import CSS Module

/**
 * Represents a single asset item in the AssetList.
 *
 * Displays the asset's details (name, type, allocation, return) and provides
 * buttons for editing and deleting the asset.
 *
 * @param {object} props - The component props.
 * @param {object} props.asset - The asset object to display.
 * @param {Function} props.onEdit - Callback function triggered when the edit button is clicked.
 * @param {Function} props.onDelete - Callback function triggered when the delete button is clicked.
 * @returns {JSX.Element} The AssetListItem component.
 */
function AssetListItem({ asset, onEdit, onDelete }) {
  // Format percentage and return nicely
  const formatPercent = (value) => value != null ? `${value}%` : 'N/A';

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

  return (
    <li className={styles.listItem}>
      <div className={styles.assetDetails}>
        <strong className={styles.assetName}>{asset.name_or_ticker}</strong>
        <span className={styles.assetType}>({asset.asset_type})</span>
        <span className={styles.allocation}>Allocation: {formatPercent(asset.allocation_percentage)}</span>
        <span className={styles.expectedReturn}>Expected Return: {formatReturn(asset.manual_expected_return)}</span>
        {/* Consider adding calculated return display here too? */}
      </div>
      <div className={styles.actions}>
        <button onClick={() => onEdit(asset)} className={styles.actionButton} aria-label={`Edit ${asset.name_or_ticker}`}>
          {/* Apply icon styles via className */}
          <PencilIcon className={`${styles.icon} ${styles.iconEdit}`} />
        </button>
        <button onClick={() => onDelete(asset)} className={styles.actionButton} aria-label={`Delete ${asset.name_or_ticker}`}>
           {/* Apply icon styles via className */}
          <TrashIcon className={`${styles.icon} ${styles.iconDelete}`} />
        </button>
      </div>
    </li>
  );
}

/**
 * Displays a list of assets belonging to a portfolio.
 *
 * Renders an AssetListItem for each asset in the provided array.
 * Shows a message if the list is empty.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} props.assets - An array of asset objects to display.
 * @param {Function} props.onEdit - Callback function passed down to AssetListItem for editing.
 * @param {Function} props.onDelete - Callback function passed down to AssetListItem for deleting.
 * @returns {JSX.Element} The AssetList component.
 */
export default function AssetList({ assets, onEdit, onDelete }) {
  if (!assets || assets.length === 0) {
    return <p className={styles.noItemsText}>No assets have been added to this portfolio yet.</p>;
  }

  return (
    <ul className={styles.list}>
      {assets.map((asset) => (
        <AssetListItem key={asset.asset_id} asset={asset} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

// Basic styles (consider moving to CSS modules or styled-components later)
// const styles = { ... }; // Removed inline styles object
// ... existing code ... 