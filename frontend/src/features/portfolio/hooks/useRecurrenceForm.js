import { useCallback } from 'react';

/**
 * @hook useRecurrenceForm
 * @description A custom React hook to manage the complex state and update logic for recurrence settings
 * typically found within a larger form (e.g., for planned financial changes).
 * It provides a centralized `handleRecurrenceChange` function that intelligently updates
 * the recurrence data structure based on user input from various fields, including resetting
 * dependent fields when primary settings like frequency or monthly type change.
 *
 * @param {object} recurrenceData - The current state object containing all recurrence-related field values
 *                                  (e.g., frequency, interval, days_of_week, ends_on_type, etc.).
 * @param {Function} setRecurrenceData - The state updater function (typically from `useState` in the parent component
 *                                     or a callback like `onRecurrenceDataChange` that ultimately updates parent state)
 *                                     which accepts the new, updated recurrence data object.
 *
 * @returns {object} An object containing:
 *  - `handleRecurrenceChange` (Function): A callback function to be used as the `onChange` handler for
 *                                         various input fields within the recurrence settings form. It takes
 *                                         the standard event object `e` as an argument.
 */
export const useRecurrenceForm = (recurrenceData, setRecurrenceData) => {
  /**
   * Handles changes from any input field within the recurrence settings form.
   * It updates the `recurrenceData` state based on the input's `name`, `value`, `type`, and `checked` properties.
   * Includes logic to reset dependent fields when a primary recurrence setting (like frequency) changes,
   * ensuring data consistency for the recurrence rules.
   * Wrapped in `useCallback` to memoize the function, optimizing performance if passed to child components.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} e - The event object from the input field.
   */
  const handleRecurrenceChange = useCallback(
    e => {
      const { name, value, type, checked } = e.target; // Destructure event target properties.
      let newRecurrenceData = { ...recurrenceData }; // Create a mutable copy of the current recurrence data.

      // Logic for when the 'frequency' select input changes.
      if (name === 'frequency') {
        newRecurrenceData.frequency = value;
        // When frequency changes, reset fields that are dependent on specific frequencies
        // to avoid inconsistent states. The 'ONE_TIME' frequency is typically handled by a separate
        // 'is_recurring' toggle in the parent form, so this logic assumes recurrence is active.
        newRecurrenceData.days_of_week = []; // Reset for weekly.
        newRecurrenceData.day_of_month = '';   // Reset for monthly (specific day).
        newRecurrenceData.monthly_type = 'specific_day'; // Default for monthly/yearly when frequency changes.
        newRecurrenceData.month_ordinal = '';      // Reset for monthly/yearly (ordinal day).
        newRecurrenceData.month_ordinal_day = '';  // Reset for monthly/yearly (ordinal day).
        // `month_of_year` is typically relevant only for 'YEARLY' and might be reset by parent
        // or could be conditionally reset here if needed.
      
      // Logic for 'days_of_week' checkboxes (used when frequency is 'WEEKLY').
      // Input names are expected to be like 'dow-0', 'dow-1', etc.
      } else if (name.startsWith('dow-')) {
        const dayValue = parseInt(value, 10); // The value of the checkbox (0 for Mon, 1 for Tue, etc.).
        const currentDays = newRecurrenceData.days_of_week || []; // Get current selected days, default to empty array.
        
        if (checked) { // If checkbox is checked, add day to array if not already present.
          if (!currentDays.includes(dayValue)) {
            newRecurrenceData.days_of_week = [...currentDays, dayValue].sort((a, b) => a - b); // Add and sort.
          }
        } else { // If checkbox is unchecked, remove day from array.
          newRecurrenceData.days_of_week = currentDays.filter(day => day !== dayValue);
        }
      
      // Logic for 'monthly_type' radio buttons (used when frequency is 'MONTHLY' or 'YEARLY').
      // This determines if the user selects a specific day of the month or an ordinal day (e.g., "first Monday").
      } else if (name === 'monthly_type') {
        newRecurrenceData.monthly_type = value;
        // If "specific_day" is chosen, clear fields related to "ordinal_day".
        if (value === 'specific_day') {
          newRecurrenceData.month_ordinal = '';
          newRecurrenceData.month_ordinal_day = '';
        } else if (value === 'ordinal_day') { 
          // If "ordinal_day" is chosen, clear the field for specific day of the month.
          newRecurrenceData.day_of_month = '';
        }
      
      // Generic handler for all other recurrence input fields.
      // This includes fields like 'interval', 'day_of_month', 'month_ordinal', 'ends_on_type', etc.
      } else {
        newRecurrenceData[name] = type === 'checkbox' ? checked : value;
      }
      
      // Call the parent's state updater function with the modified recurrence data.
      setRecurrenceData(newRecurrenceData);
    },
    [recurrenceData, setRecurrenceData] // Dependencies for useCallback.
  );

  // Return the handler function to be used by the consuming form component.
  return {
    handleRecurrenceChange,
    // Future: Could potentially return derived state or validation functions related to recurrence
    // if the hook were to become more complex (e.g., validating recurrence rules).
  };
};