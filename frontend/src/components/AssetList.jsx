import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

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
    <li style={styles.listItem}>
      <div style={styles.assetDetails}>
        <strong style={styles.assetName}>{asset.name_or_ticker}</strong>
        <span style={styles.assetType}>({asset.asset_type})</span>
        <span style={styles.allocation}>Allocation: {formatPercent(asset.allocation_percentage)}</span>
        <span style={styles.expectedReturn}>Expected Return: {formatReturn(asset.manual_expected_return)}</span>
        {/* Consider adding calculated return display here too? */}
      </div>
      <div style={styles.actions}>
        <button onClick={() => onEdit(asset)} style={styles.actionButton} aria-label={`Edit ${asset.name_or_ticker}`}>
          <PencilIcon style={{ ...styles.icon, color: 'var(--color-text-secondary-light)' }} />
        </button>
        <button onClick={() => onDelete(asset)} style={styles.actionButton} aria-label={`Delete ${asset.name_or_ticker}`}>
          <TrashIcon style={{ ...styles.icon, color: 'var(--color-error-light)' }} />
        </button>
      </div>
    </li>
  );
}

export default function AssetList({ assets, onEdit, onDelete }) {
  if (!assets || assets.length === 0) {
    return <p style={styles.noItemsText}>No assets have been added to this portfolio yet.</p>;
  }

  return (
    <ul style={styles.list}>
      {assets.map((asset) => (
        <AssetListItem key={asset.asset_id} asset={asset} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

// Basic styles (consider moving to CSS modules or styled-components later)
const styles = {
  list: {
    listStyle: 'none',
    padding: 0,
    marginTop: 'var(--space-m)',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-m)',
    border: '1px solid var(--color-border-light)',
    borderRadius: '4px',
    marginBottom: 'var(--space-s)',
    background: 'var(--color-ui-background-light)',
  },
  assetDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xxs)',
  },
  assetName: {
    fontWeight: 600, // Semi-bold
    fontSize: '1rem',
    color: 'var(--color-text-primary-light)',
  },
  assetType: {
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary-light)',
  },
  allocation: {
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary-light)',
    fontVariantNumeric: 'tabular-nums',
  },
  expectedReturn: {
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary-light)',
    fontVariantNumeric: 'tabular-nums',
  },
  actions: {
    display: 'flex',
    gap: 'var(--space-s)',
  },
  actionButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 'var(--space-xxs)', // Small padding for click area
  },
  icon: {
    width: '1rem',
    height: '1rem',
  },
  noItemsText: {
      padding: 'var(--space-m)',
      textAlign: 'center',
      color: 'var(--color-text-secondary-light)',
      border: '1px dashed var(--color-border-light)',
      borderRadius: '4px',
      marginTop: 'var(--space-m)',
  }
}; 