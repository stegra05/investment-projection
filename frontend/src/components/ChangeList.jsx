import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import styles from './ChangeList.module.css'; // Import CSS Module

/**
 * Represents a single planned future change item in the ChangeList.
 *
 * Displays the change's details (type, date, amount, description) and provides
 * buttons for editing and deleting the change.
 *
 * @param {object} props - The component props.
 * @param {object} props.change - The planned change object to display.
 * @param {Function} props.onEdit - Callback function triggered when the edit button is clicked.
 * @param {Function} props.onDelete - Callback function triggered when the delete button is clicked.
 * @returns {JSX.Element} The ChangeListItem component.
 */
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
      // Use Intl.NumberFormat for better localization and currency handling later
      return parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <li className={styles.listItem}>
      <div className={styles.changeDetails}>
        <strong className={styles.changeType}>{change.change_type}</strong>
        <span className={styles.changeDate}>Date: {formatDate(change.change_date)}</span>
        <span className={styles.changeAmount}>Amount: {formatAmount(change.amount)}</span>
        {change.description && <p className={styles.changeDescription}>Description: {change.description}</p>}
      </div>
      <div className={styles.actions}>
        <button onClick={() => onEdit(change)} className={styles.actionButton} aria-label={`Edit change on ${formatDate(change.change_date)}`}>
          <PencilIcon className={`${styles.icon} ${styles.iconEdit}`} />
        </button>
        <button onClick={() => onDelete(change)} className={styles.actionButton} aria-label={`Delete change on ${formatDate(change.change_date)}`}>
          <TrashIcon className={`${styles.icon} ${styles.iconDelete}`} />
        </button>
      </div>
    </li>
  );
}

/**
 * Displays a list of planned future changes for a portfolio.
 *
 * Renders a ChangeListItem for each change in the provided array.
 * Shows a message if the list is empty.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} props.changes - An array of planned change objects to display.
 * @param {Function} props.onEdit - Callback function passed down to ChangeListItem for editing.
 * @param {Function} props.onDelete - Callback function passed down to ChangeListItem for deleting.
 * @returns {JSX.Element} The ChangeList component.
 */
export default function ChangeList({ changes, onEdit, onDelete }) {
  if (!changes || changes.length === 0) {
    return <p className={styles.noItemsText}>No planned changes have been added yet.</p>;
  }

  return (
    <ul className={styles.list}>
      {changes.map((change) => (
        <ChangeListItem key={change.change_id} change={change} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

// Removed inline styles object 