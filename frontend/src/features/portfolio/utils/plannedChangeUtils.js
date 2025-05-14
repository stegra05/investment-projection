/**
 * Prepares and validates the final planned change data object based on form input.
 * This function transforms the raw form data into a structure suitable for API submission,
 * performing several key operations:
 * 1. Handles change type specifics:
 *    - For 'Reallocation': Validates sum, stringifies target allocations, nullifies amount.
 *    - For 'Contribution'/'Withdrawal': Validates and parses amount, nullifies target allocations.
 * 2. Processes recurrence settings:
 *    - If not recurring or 'ONE_TIME': Resets all recurrence fields to defaults.
 *    - If recurring: Parses and validates interval, frequency-specific fields (days_of_week, day_of_month, etc.),
 *      and end conditions (ends_on_type, ends_on_occurrences, ends_on_date).
 * 3. Cleans up temporary fields (e.g., monthly_type, targetAllocations).
 * Returns an object with either an 'error' string if validation fails, or the prepared 'data' object.
 */
export const prepareFinalPlannedChangeData = (formData, allocationSum, targetAllocationsDisplay) => {
  let finalData = { ...formData };
  let currentError = null;

  if (finalData.changeType === 'Reallocation') {
    if (allocationSum !== 100) {
      currentError = 'Total allocation must be 100%.';
    } else {
      // Transform the array of allocations into the required dictionary format
      const allocationDict = targetAllocationsDisplay.reduce((acc, a) => {
        const percentageStr = (parseFloat(a.newPercentage) || 0).toFixed(2);
        // Ensure assetId is a string key
        acc[String(a.assetId)] = percentageStr; 
        return acc;
      }, {});
      
      const target_allocation_json = JSON.stringify(allocationDict);
      finalData = { ...finalData, target_allocation_json, amount: null };
    }
  } else {
    finalData.target_allocation_json = null;
    const amountValue = parseFloat(finalData.changeAmount);
    if (finalData.changeType === 'Contribution' || finalData.changeType === 'Withdrawal') {
      if (isNaN(amountValue) || finalData.changeAmount === '') {
        currentError = 'Amount must be a valid number for contributions or withdrawals.';
      }
      finalData.amount = finalData.changeAmount === '' ? null : amountValue;
    } else {
      finalData.amount =
        finalData.changeAmount === '' ? null : isNaN(amountValue) ? null : amountValue;
    }
  }
  delete finalData.targetAllocations;

  if (currentError) {
    return { error: currentError, data: null };
  }

  if (!finalData.is_recurring || finalData.frequency === 'ONE_TIME') {
    _initializeNonRecurringChange(finalData);
  } else {
    currentError = _processRecurringChange(finalData);
  }

  // Delete monthly_type after processing recurrence as it's used within _processRecurringChange
  delete finalData.monthly_type;

  if (currentError) {
    return { error: currentError, data: null };
  }

  return { error: null, data: finalData };
};

// Helper function to reset fields for a non-recurring or one-time change
const _initializeNonRecurringChange = (data) => {
  data.is_recurring = false;
  data.frequency = 'ONE_TIME';
  data.interval = 1;
  data.days_of_week = [];
  data.day_of_month = null;
  data.month_ordinal = null;
  data.month_ordinal_day = null;
  data.month_of_year = null;
  data.ends_on_type = 'NEVER';
  data.ends_on_occurrences = null;
  data.ends_on_date = null;
};

// Helper for monthly recurrence validation and setup
const _handleMonthlyRecurrence = (data) => {
  let currentError = null;
  const dayOfMonthValue = parseInt(data.day_of_month, 10); // Parse first

  if (data.monthly_type === 'specific_day') {
    if (isNaN(dayOfMonthValue)) { // Check if parsing failed (empty string becomes NaN)
      currentError = 'Please specify the day of the month for monthly recurrence.';
    } else if (dayOfMonthValue < 1 || dayOfMonthValue > 31) { // Check range
      currentError = 'Day of month must be between 1 and 31.';
    }
  } else if (data.monthly_type === 'ordinal_day') {
    if (!data.month_ordinal || !data.month_ordinal_day) {
      currentError = 'Please specify ordinal and day type for monthly recurrence.';
    }
  }
  // Reset the *other* type's fields
  if (data.monthly_type === 'specific_day') {
    data.month_ordinal = null;
    data.month_ordinal_day = null;
  } else { // ordinal_day
    data.day_of_month = null; // Nullify specific day
  }
  return currentError;
};

// Helper for yearly recurrence validation and setup
const _handleYearlyRecurrence = (data) => {
  let currentError = null;

  if (!data.month_of_year) {
    // This error is now checked and returned in _processRecurringChange after attempting to parse month_of_year
    // However, it's good to have an early exit if it's absolutely required for other logic here.
    // For now, let's assume month_of_year has been parsed or handled by the caller if critical for subsequent logic.
    // The primary error for missing month_of_year is handled in _processRecurringChange.
  }

  // Similar to monthly, parse day_of_month first for 'specific_day' type
  const dayOfMonthValue = parseInt(data.day_of_month, 10);

  if (data.monthly_type === 'specific_day') {
    if (!data.month_of_year) { // Check here since it's specific to this block
      currentError = 'Please specify the month for yearly recurrence.';
    } else if (isNaN(dayOfMonthValue)) {
      currentError = 'Please specify the day of the month for yearly recurrence.';
    } else if (dayOfMonthValue < 1 || dayOfMonthValue > 31) {
      currentError = 'Day of month must be between 1 and 31 for yearly recurrence.';
    }
  } else if (data.monthly_type === 'ordinal_day') {
    if (!data.month_of_year) { // Check here as well
      currentError = 'Please specify the month for yearly recurrence.';
    } else if (!data.month_ordinal || !data.month_ordinal_day) {
      currentError = 'Please specify ordinal and day type for yearly recurrence.';
    }
  }

  // Reset the *other* type's fields, similar to _handleMonthlyRecurrence
  if (data.monthly_type === 'specific_day') {
    data.month_ordinal = null;
    data.month_ordinal_day = null;
  } else { // ordinal_day
    data.day_of_month = null;
  }
  return currentError;
};

// Helper for ends_on logic validation and setup
const _handleEndsOnLogic = (data) => {
  let currentError = null;
  if (data.ends_on_type === 'AFTER_OCCURRENCES') {
    if (!data.ends_on_occurrences || parseInt(data.ends_on_occurrences, 10) < 1) {
      currentError = 'Please specify a valid number of occurrences (at least 1).';
    } else {
      data.ends_on_date = null;
    }
  } else if (data.ends_on_type === 'ON_DATE') {
    if (!data.ends_on_date) {
      currentError = 'Please specify an end date.';
    } else {
      data.ends_on_occurrences = null;
    }
  } else { // NEVER
    data.ends_on_occurrences = null;
    data.ends_on_date = null;
  }
  return currentError;
};

// Helper function to process and validate settings for recurring changes
// Returns an error string if validation fails, otherwise null.
const _processRecurringChange = (data) => {
  let currentError = null;
  data.interval = parseInt(data.interval, 10) || 1;
  if (data.interval < 1) {
    return 'Interval must be at least 1.';
  }

  if (data.frequency === 'WEEKLY' && (!data.days_of_week || data.days_of_week.length === 0)) {
    return 'Please select at least one day for weekly recurrence.';
  }

  // Initialize potentially unused fields to null/empty before specific frequency logic
  data.days_of_week = (data.frequency === 'WEEKLY') ? (data.days_of_week || []) : [];
  if (data.frequency !== 'MONTHLY' && data.frequency !== 'YEARLY') {
    data.day_of_month = null;
    data.month_ordinal = null;
    data.month_ordinal_day = null;
    data.monthly_type = null; // Reset monthly_type if not monthly/yearly
  }
  if (data.frequency !== 'YEARLY') {
    data.month_of_year = null;
  }


  if (data.frequency === 'MONTHLY') {
    // No longer need to parse day_of_month here, _handleMonthlyRecurrence does it
    currentError = _handleMonthlyRecurrence(data);
    if (currentError) return currentError;
    // Store the potentially parsed integer back if valid and specific_day
    if (data.monthly_type === 'specific_day' && !isNaN(parseInt(data.day_of_month, 10))) {
      data.day_of_month = parseInt(data.day_of_month, 10);
    } else if (data.monthly_type !== 'specific_day') {
      data.day_of_month = null; // Ensure it's null if not specific_day
    } // If specific_day but invalid, day_of_month remains the original string or null (error already returned)

  } else if (data.frequency === 'YEARLY') {
    if (data.month_of_year) {
      data.month_of_year = parseInt(data.month_of_year, 10);
    }
    // No longer need to parse day_of_month here, _handleYearlyRecurrence does it internally now
    // (Assuming _handleYearlyRecurrence is updated similarly)
    currentError = _handleYearlyRecurrence(data); // We should update this function too for consistency
    if (currentError) return currentError;
    // Store the potentially parsed integer back if valid and specific_day
    if (data.monthly_type === 'specific_day' && !isNaN(parseInt(data.day_of_month, 10))) {
      data.day_of_month = parseInt(data.day_of_month, 10);
    } else if (data.monthly_type !== 'specific_day') {
      data.day_of_month = null; // Ensure it's null if not specific_day
    }
    if (!data.month_of_year) { // Add check for missing month_of_year after parsing attempt
      return 'Please specify the month for yearly recurrence.';
    }
  }

  // Parse ends_on_occurrences before _handleEndsOnLogic
  if (data.ends_on_type === 'AFTER_OCCURRENCES' && data.ends_on_occurrences) {
    const occurrences = parseInt(data.ends_on_occurrences, 10);
    if (!isNaN(occurrences)) {
      data.ends_on_occurrences = occurrences;
    } // Let _handleEndsOnLogic catch the error if parsing fails or value < 1
  }

  currentError = _handleEndsOnLogic(data);
  if (currentError) return currentError;

  // Clean up monthly_type ONLY if it's not relevant (frequency isn't MONTHLY or YEARLY)
  if (data.frequency !== 'MONTHLY' && data.frequency !== 'YEARLY') {
    delete data.monthly_type;
  }


  return null; // No errors
}; 