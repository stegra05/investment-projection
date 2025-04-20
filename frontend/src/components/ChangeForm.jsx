import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Use apiClient instead
import changeService from '../services/changeService'; // <-- Add this
import { PlusIcon } from '@heroicons/react/24/outline';
import styles from './ChangeForm.module.css'; // Import CSS Module
import { useFormState } from '../hooks/useFormState'; // <-- Add this
import Button from './Button';
import Input from './Input';
import Select from './Select';
import { FormCommon } from './FormCommon';
import Textarea from './Textarea';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'; // Handled by apiClient

// Enum for ChangeType might be better defined elsewhere and imported
const changeTypeOptions = [
    { value: 'Contribution', label: 'Contribution' },
    { value: 'Withdrawal', label: 'Withdrawal' },
    { value: 'Rebalance', label: 'Rebalance' }, // Example, adjust based on actual needs
    // Consider adding 'Dividend Reinvestment' or other types?
];

// Validation function for ChangeForm fields
const validateChangeField = (name, value, changeType) => {
  let error = '';

  switch (name) {
    case 'amount':
      // Amount validation only applies if not Rebalance and value is not empty
      if (changeType !== 'Rebalance' && value !== '') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          error = 'Amount must be a valid number.';
        } else if (changeType === 'Withdrawal' && numValue > 0) {
           // Simple check: withdrawals are typically negative or zero
           // error = 'Withdrawals usually have a negative or zero amount.';
           // Decided against enforcing negative for withdrawal, backend might handle sign logic.
        } else if (changeType === 'Contribution' && numValue < 0) {
           // Simple check: contributions are typically positive or zero
           // error = 'Contributions usually have a positive or zero amount.';
           // Decided against enforcing positive for contribution.
        }
        // Add other range checks if needed
      }
      break;
    case 'changeDate':
      // Basic date presence check (more complex validation possible)
      if (!value) {
         // error = 'Date is required.'; // Handled by required attribute + pre-submit check
      }
      break;
    case 'changeType':
       // Basic check
       if (!value) {
         // error = 'Change Type is required.'; // Handled by required attribute + pre-submit check
       }
       break;
    // Add other field validations here if needed
    default:
      break;
  }
  return error;
};

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
  const { isEditing, error: submissionError, setError: setSubmissionError } = useFormState(existingChange);
  const [changeType, setChangeType] = useState('');
  const [changeDate, setChangeDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const isAmountRequired = changeType && changeType !== 'Rebalance';
  const isAmountDisabled = changeType === 'Rebalance';

  useEffect(() => {
    let initialAmount = '';
    let initialType = '';
    if (isEditing && existingChange) {
      initialType = existingChange.change_type || '';
      setChangeType(initialType);
      setChangeDate(existingChange.change_date ? new Date(existingChange.change_date).toISOString().split('T')[0] : '');
      // Amount is only relevant if not a rebalance type during edit
      initialAmount = (existingChange.amount != null && initialType !== 'Rebalance') ? String(existingChange.amount) : '';
      setAmount(initialAmount);
      setDescription(existingChange.description || '');
    } else {
      // Reset form for adding new
      setChangeType('');
      setChangeDate('');
      setAmount('');
      setDescription('');
    }

    // Clear errors on init/change
    setSubmissionError('');
    setFieldErrors({});
    // If type is Rebalance on load, clear amount state
    if (initialType === 'Rebalance') {
        setAmount('');
    }

  }, [existingChange, isEditing, setSubmissionError]);

  // Handle change type separately to clear amount if Rebalance is selected
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setChangeType(newType);
    // Clear amount and its error if type becomes Rebalance
    if (newType === 'Rebalance') {
        setAmount('');
        setFieldErrors(prev => ({ ...prev, amount: '' }));
    }
    // Clear type error
    setFieldErrors(prev => ({ ...prev, changeType: '' }));
  };

  // Handle generic value changes and validation
  const handleValueChange = (setter, fieldName) => (e) => {
    const value = e.target.value;
    setter(value);
    // Validate on change if not empty
    if (value !== '') {
        const error = validateChangeField(fieldName, value, changeType); // Pass changeType for context
        setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    } else {
        // Clear error if field becomes empty
        setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  // Validate on blur
  const handleBlur = (fieldName, value) => {
    const error = validateChangeField(fieldName, value, changeType);
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError('');
    setFieldErrors({}); // Clear field errors

     // --- Pre-submission Validation ---
     let hasValidationErrors = false;
     const currentFieldErrors = {};

     if (!changeType) {
         currentFieldErrors.changeType = 'Change Type is required.';
         hasValidationErrors = true;
     }
     if (!changeDate) {
         currentFieldErrors.changeDate = 'Date is required.';
         hasValidationErrors = true;
     }

     // Validate amount based on type
     const amountError = validateChangeField('amount', amount, changeType);
     if (amountError) {
        currentFieldErrors.amount = amountError;
        hasValidationErrors = true;
     } else if (isAmountRequired && amount === '') {
        // Explicit check if required amount is empty
        currentFieldErrors.amount = 'Amount is required for this change type.';
        hasValidationErrors = true;
     } else if (!isAmountRequired && amount !== '') {
         // Error if amount is provided when not required (Rebalance)
         currentFieldErrors.amount = 'Amount should not be provided for Rebalance.';
         hasValidationErrors = true;
     }

     // If any validation errors, update state and stop submission
     if (hasValidationErrors) {
         setFieldErrors(currentFieldErrors);
         setSubmissionError('Please fix the errors in the form.'); // Generic submission error
         return;
     }
     // --- End Validation ---

    try {
      // Construct the payload based on validated inputs
       let parsedAmount = null;
       if (isAmountRequired) {
         parsedAmount = parseFloat(amount);
         // We already validated isNaN earlier, but could double check
         if (isNaN(parsedAmount)) {
             // This case should ideally not be reached due to pre-validation
             setFieldErrors(prev => ({ ...prev, amount: 'Invalid number format.'}));
             setSubmissionError('Please fix the errors in the form.');
             return;
         }
       }

      const payload = {
        change_type: changeType,
        change_date: changeDate,
        // Conditionally include amount ONLY if it's required AND has been parsed
        ...(isAmountRequired && parsedAmount !== null && { amount: parsedAmount }),
        description, // Send description even if empty
      };

      // Call the onSaved prop (which connects to the useChangeManagement hook)
      await onSaved(payload); // The hook should handle success/error states ideally

      // If onSaved doesn't throw on error, we might not reach the catch block.
      // Assuming the hook sets the submissionError state if needed.

    } catch (err) {
      // This catch block might be redundant if useChangeManagement handles errors
      console.error('Change save failed in form submit catch:', err);
      setSubmissionError(err.message || 'An unexpected error occurred while saving.');
      // We could also try parsing backend validation errors here if they are structured
    }
  };

  return (
    <FormCommon>
      <form onSubmit={handleSubmit}>
        <h3 className={styles.formTitle}>
          {isEditing ? 'Edit Planned Change' : 'Add New Planned Change'}
        </h3>
        {submissionError && <p className={styles.errorMessage}>{submissionError}</p>}

        {/* Change Type Input (Using Select) */}
        <div className={styles.formGroup}>
          <label htmlFor="changeType" className={styles.label}>Change Type*</label>
          <Select
            id="changeType"
            name="changeType"
            value={changeType}
            onChange={handleTypeChange}
            required
            error={!!fieldErrors.changeType}
            placeholder="-- Select Change Type --"
          >
            {changeTypeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          {fieldErrors.changeType && <p className={styles.fieldErrorMessage}>{fieldErrors.changeType}</p>}
        </div>

        {/* Date and Amount Inputs (Grid Layout) */}
        <div className={styles.gridContainer}>
          <div className={styles.formGroup}>
              <label htmlFor="changeDate" className={styles.label}>Date*</label>
              <Input
                id="changeDate"
                name="changeDate"
                type="date"
                value={changeDate}
                onChange={handleValueChange(setChangeDate, 'changeDate')}
                onBlur={() => handleBlur('changeDate', changeDate)}
                required
                error={!!fieldErrors.changeDate}
                className={styles.inputField}
                aria-invalid={!!fieldErrors.changeDate}
                aria-describedby="date-error"
              />
              {fieldErrors.changeDate && <p id="date-error" className={styles.fieldErrorMessage}>{fieldErrors.changeDate}</p>}
          </div>
          <div className={styles.formGroup}>
              <label htmlFor="amount" className={styles.label}>Amount{isAmountRequired ? '*' : ' (N/A for Rebalance)'}</label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder={isAmountDisabled ? '-' : (changeType === 'Withdrawal' ? '-1000' : '5000')}
                value={amount}
                onChange={handleValueChange(setAmount, 'amount')}
                onBlur={() => handleBlur('amount', amount)}
                required={isAmountRequired}
                disabled={isAmountDisabled}
                error={!!fieldErrors.amount}
                className={`${styles.inputField} ${styles.inputFieldNumeric}`}
                aria-invalid={!!fieldErrors.amount}
                aria-describedby="amount-error"
              />
             {fieldErrors.amount && <p id="amount-error" className={styles.fieldErrorMessage}>{fieldErrors.amount}</p>}
          </div>
        </div>

        {/* Description Input */}
        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>Description (Optional)</label>
          <Textarea
            id="description"
            name="description"
            placeholder="e.g., Annual IRA contribution, House down payment"
            value={description}
            onChange={handleValueChange(setDescription, 'description')}
            rows={4}
            className={styles.textareaField}
          />
        </div>

        {/* Action Buttons */}
        <div className={styles.actionsContainer}>
          {onCancel && (
             <Button type="button" variant="secondary" onClick={onCancel}>
               Cancel
             </Button>
          )}
          <Button
            type="submit"
            variant="primary"
          >
            {isEditing ? 'Update Change' : 'Add Change'}
          </Button>
        </div>
      </form>
    </FormCommon>
  );
} 