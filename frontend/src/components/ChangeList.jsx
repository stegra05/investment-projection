import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

function ChangeListItem({ change, onEdit, onDelete }) {
  // Format date nicely (consider a date formatting library like date-fns later)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Ensure we handle the date string correctly, assuming it might be YYYY-MM-DD or include time
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return dateString; // Fallback to original string
    }
  };

  // Format amount (consider currency formatting later)
  const formatAmount = (amount) => {
      if (amount == null) return 'N/A';
      return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <li style={styles.listItem}>
      <div style={styles.changeDetails}>
        <strong style={styles.changeType}>{change.change_type}</strong>
        <span style={styles.changeDate}>Date: {formatDate(change.change_date)}</span>
        <span style={styles.changeAmount}>Amount: {formatAmount(change.amount)}</span>
        {change.description && <p style={styles.changeDescription}>Description: {change.description}</p>}
      </div>
      <div style={styles.actions}>
        <button onClick={() => onEdit(change)} style={styles.actionButton} aria-label={`Edit change on ${formatDate(change.change_date)}`}>
          <PencilIcon style={{ ...styles.icon, color: 'var(--color-text-secondary-light)' }} />
        </button>
        <button onClick={() => onDelete(change)} style={styles.actionButton} aria-label={`Delete change on ${formatDate(change.change_date)}`}>
          <TrashIcon style={{ ...styles.icon, color: 'var(--color-error-light)' }} />
        </button>
      </div>
    </li>
  );
}

export default function ChangeList({ changes, onEdit, onDelete }) {
  if (!changes || changes.length === 0) {
    return <p style={styles.noItemsText}>No planned changes have been added yet.</p>;
  }

  return (
    <ul style={styles.list}>
      {changes.map((change) => (
        <ChangeListItem key={change.change_id} change={change} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

// Shared styles - identical to AssetList for now, could be abstracted
const styles = {
    list: {
      listStyle: 'none',
      padding: 0,
      marginTop: 'var(--space-m)',
    },
    listItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start', // Align items to the top for potentially multi-line descriptions
      padding: 'var(--space-m)',
      border: '1px solid var(--color-border-light)',
      borderRadius: '4px',
      marginBottom: 'var(--space-s)',
      background: 'var(--color-ui-background-light)',
    },
    changeDetails: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xxs)',
      flexGrow: 1,
      marginRight: 'var(--space-m)', // Add margin to prevent text touching buttons
    },
    changeType: {
      fontWeight: 600,
      fontSize: '1rem',
      color: 'var(--color-text-primary-light)',
    },
    changeDate: {
      fontSize: '0.875rem',
      color: 'var(--color-text-secondary-light)',
    },
    changeAmount: {
      fontSize: '0.875rem',
      color: 'var(--color-text-secondary-light)',
      fontVariantNumeric: 'tabular-nums',
    },
    changeDescription: {
        fontSize: '0.875rem',
        color: 'var(--color-text-secondary-light)',
        margin: 'var(--space-xs) 0 0 0', // Add some top margin
        lineHeight: 1.4,
    },
    actions: {
      display: 'flex',
      gap: 'var(--space-s)',
      flexShrink: 0, // Prevent actions from shrinking
    },
    actionButton: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: 'var(--space-xxs)',
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