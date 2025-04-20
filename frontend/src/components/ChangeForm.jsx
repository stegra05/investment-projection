import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Use apiClient instead
import changeService from '../services/changeService'; // <-- Add this
import { PlusIcon } from '@heroicons/react/24/outline';
import styles from './ChangeForm.module.css'; // Import CSS Module
import { useFormState } from '../hooks/useFormState'; // <-- Add this

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'; // Handled by apiClient

// Enum for ChangeType might be better defined elsewhere and imported
const changeTypeOptions = [
    'Contribution',
    'Withdrawal',
    'Rebalance', // Example, adjust based on actual needs
    // Add other common types
];

/**
 * A form component for creating or editing a planned future change within a portfolio.
 *
 * Handles input fields for change type, date, amount, and description.
 * Manages loading and error states. Calls appropriate service functions via apiClient
 * on submit.
 *
 * @param {object} props - The component props.
 * @param {string|number} props.portfolioId - The ID of the portfolio this change belongs to.
 * @param {object} [props.existingChange=null] - If provided, the form will be pre-filled with this change's data
 *                                              for editing. If null, the form is for creating a new change.
 * @param {Function} props.onSaved - Callback function executed successfully after creating or updating a change.
 * @param {Function} [props.onCancel] - Optional callback function executed when the cancel button is clicked.
 * @returns {JSX.Element} The ChangeForm component.
 */
export default function ChangeForm({ portfolioId, existingChange = null, onSaved, onCancel }) {
  const { isEditing, error, setError } = useFormState(existingChange); // <-- Use hook
  const [changeType, setChangeType] = useState('');
  const [changeDate, setChangeDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isEditing && existingChange) {
      setChangeType(existingChange.change_type || '');
      // Ensure date is in yyyy-mm-dd format for input type="date"
      setChangeDate(existingChange.change_date ? new Date(existingChange.change_date).toISOString().split('T')[0] : '');
      setAmount(existingChange.amount != null ? String(existingChange.amount) : ''); // Handle null/undefined amount, ensure string
      setDescription(existingChange.description || '');
    } else {
        // Reset form for adding new
        setChangeType('');
        setChangeDate('');
        setAmount('');
        setDescription('');
    }
    setError(''); // Clear error when form initializes or existingChange changes (using hook)
  }, [existingChange, isEditing, setError]); // <-- Add setError dependency

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors (using hook)

    // Validate required fields
    if (!changeType || !changeDate || amount === '') { // Ensure amount is not an empty string
        setError('Change Type, Date, and Amount are required fields.');
        return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
        setError('Amount must be a valid number.');
        return;
    }

    try {
      const payload = {
        change_type: changeType,
        change_date: changeDate,
        amount: parsedAmount, // Send parsed number
        description, // Use shorthand
      };

      if (isEditing && existingChange) {
        await changeService.updateChange(portfolioId, existingChange.change_id, payload); // <-- Use service
        // await axios.put(`${API_URL}/portfolios/${portfolioId}/changes/${existingChange.change_id}`, payload, config);
      } else {
        await changeService.createChange(portfolioId, payload); // <-- Use service
        // await axios.post(`${API_URL}/portfolios/${portfolioId}/changes`, payload, config);
      }
      onSaved(); // Signal success
    } catch (err) {
      console.error('Change save failed:', err);
      setError(err.response?.data?.message || 'Failed to save change. Please check the details.'); // Using hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h3 className={styles.formTitle}>
        {isEditing ? 'Edit Planned Change' : 'Add New Planned Change'}
      </h3>
      {error && <p className={styles.errorMessage}>{error}</p>}

      {/* Change Type Input (Using Select) */}
      <div className={styles.formGroup}>
        <label htmlFor="changeType" className={styles.label}>Change Type*</label>
        {/* Consider using a <select> for predefined types */}
        <input
          id="changeType"
          type="text" 
          list="changeTypeOptions"
          placeholder="e.g., Contribution, Withdrawal" // Updated placeholder
          value={changeType}
          onChange={(e) => setChangeType(e.target.value)}
          required
          className={styles.inputField}
        />
         <datalist id="changeTypeOptions">
            {changeTypeOptions.map(option => <option key={option} value={option} />)}
        </datalist>
      </div>

      {/* Date and Amount Inputs (Grid Layout) */}
      <div className={styles.gridContainer}>
        <div className={styles.formGroup}>
            <label htmlFor="changeDate" className={styles.label}>Date*</label>
            <input
              id="changeDate"
              type="date"
              value={changeDate}
              onChange={(e) => setChangeDate(e.target.value)}
              required
              className={styles.inputField}
            />
        </div>
        <div className={styles.formGroup}>
            <label htmlFor="amount" className={styles.label}>Amount*</label>
            <input
              id="amount"
              type="number" // Use number type for better input handling
              step="0.01" // Allow decimals
              placeholder="e.g., 5000 or -1000" // Updated placeholder
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className={`${styles.inputField} ${styles.inputFieldNumeric}`}
            />
        </div>
      </div>

      {/* Description Input */}
      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>Description (Optional)</label>
        <textarea
          id="description"
          placeholder="e.g., Annual IRA contribution, House down payment" // Keep placeholder
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={styles.textareaField}
        />
      </div>

      {/* Action Buttons */}
      <div className={styles.actionsContainer}>
        {onCancel && (
          <button type="button" onClick={onCancel} className={`${styles.button} ${styles.buttonSecondary}`}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          <PlusIcon className={styles.buttonIcon} />
          {isEditing ? 'Update Change' : 'Add Change'}
        </button>
      </div>
    </form>
  );
} 