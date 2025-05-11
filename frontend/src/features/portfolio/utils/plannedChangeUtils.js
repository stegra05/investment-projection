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
      const target_allocation_json = JSON.stringify(
        targetAllocationsDisplay.map(a => ({
          assetId: a.assetId,
          percentage: parseFloat(a.newPercentage) || 0,
        }))
      );
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
  if (data.monthly_type === 'specific_day' && !data.day_of_month) {
    currentError = 'Please specify the day of the month for monthly recurrence.';
  } else if (
    data.monthly_type === 'specific_day' &&
    (parseInt(data.day_of_month, 10) < 1 || parseInt(data.day_of_month, 10) > 31)
  ) {
    currentError = 'Day of month must be between 1 and 31.';
  } else if (
    data.monthly_type === 'ordinal_day' &&
    (!data.month_ordinal || !data.month_ordinal_day)
  ) {
    currentError = 'Please specify ordinal and day type for monthly recurrence.';
  }
  if (data.monthly_type === 'specific_day') {
    data.month_ordinal = null;
    data.month_ordinal_day = null;
  } else {
    data.day_of_month = null;
  }
  return currentError;
};

// Helper for yearly recurrence validation and setup
const _handleYearlyRecurrence = (data) => {
  let currentError = null;
  if (!data.month_of_year) {
    currentError = 'Please specify the month for yearly recurrence.';
    // Early return if month_of_year is missing, as other checks might depend on it implicitly or cause confusion
    return currentError; 
  }
  // The rest of the yearly logic (day_of_month, ordinal) is similar to monthly
  if (data.monthly_type === 'specific_day' && !data.day_of_month) {
    currentError = 'Please specify the day of the month for yearly recurrence.';
  } else if (
    data.monthly_type === 'specific_day' &&
    (parseInt(data.day_of_month, 10) < 1 || parseInt(data.day_of_month, 10) > 31)
  ) {
    currentError = 'Day of month must be between 1 and 31 for yearly recurrence.';
  } else if (
    data.monthly_type === 'ordinal_day' &&
    (!data.month_ordinal || !data.month_ordinal_day)
  ) {
    currentError = 'Please specify ordinal and day type for yearly recurrence.';
  }
  if (data.monthly_type === 'specific_day') {
    data.month_ordinal = null;
    data.month_ordinal_day = null;
  } else {
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

  // Initialize potentially unused fields to null before specific frequency logic
  data.day_of_month = null;
  data.month_ordinal = null;
  data.month_ordinal_day = null;
  data.month_of_year = null;
  data.days_of_week = (data.frequency === 'WEEKLY') ? data.days_of_week : [];

  if (data.frequency === 'MONTHLY') {
    // Ensure day_of_month is parsed for monthly specific_day before _handleMonthlyRecurrence
    if (data.monthly_type === 'specific_day' && data.day_of_month) {
      data.day_of_month = parseInt(data.day_of_month, 10);
    }    
    currentError = _handleMonthlyRecurrence(data);
    if (currentError) return currentError;
  } else if (data.frequency === 'YEARLY') {
    // Ensure month_of_year and day_of_month are parsed before _handleYearlyRecurrence
    if (data.month_of_year) {
      data.month_of_year = parseInt(data.month_of_year, 10);
    }
    if (data.monthly_type === 'specific_day' && data.day_of_month) {
      data.day_of_month = parseInt(data.day_of_month, 10);
    }
    currentError = _handleYearlyRecurrence(data);
    if (currentError) return currentError;
  }
  
  // Parse ends_on_occurrences before _handleEndsOnLogic
  if (data.ends_on_type === 'AFTER_OCCURRENCES' && data.ends_on_occurrences) {
    data.ends_on_occurrences = parseInt(data.ends_on_occurrences, 10);
  }

  currentError = _handleEndsOnLogic(data);
  if (currentError) return currentError;

  return null; // No errors
}; 