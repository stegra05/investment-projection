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
    finalData.is_recurring = false;
    finalData.frequency = 'ONE_TIME';
    finalData.interval = 1;
    finalData.days_of_week = [];
    finalData.day_of_month = null;
    finalData.month_ordinal = null;
    finalData.month_ordinal_day = null;
    finalData.month_of_year = null;
    finalData.ends_on_type = 'NEVER';
    finalData.ends_on_occurrences = null;
    finalData.ends_on_date = null;
  } else {
    finalData.interval = parseInt(finalData.interval, 10) || 1;
    if (finalData.interval < 1) {
      currentError = 'Interval must be at least 1.';
    }

    if (
      finalData.frequency === 'WEEKLY' &&
      (!finalData.days_of_week || finalData.days_of_week.length === 0)
    ) {
      currentError = 'Please select at least one day for weekly recurrence.';
    }
    
    finalData.day_of_month =
      finalData.frequency === 'MONTHLY' &&
      finalData.monthly_type === 'specific_day' &&
      finalData.day_of_month
        ? parseInt(finalData.day_of_month, 10)
        : null;

    finalData.month_of_year =
      finalData.frequency === 'YEARLY' && finalData.month_of_year
        ? parseInt(finalData.month_of_year, 10)
        : null;

    finalData.ends_on_occurrences =
      finalData.ends_on_type === 'AFTER_OCCURRENCES' && finalData.ends_on_occurrences
        ? parseInt(finalData.ends_on_occurrences, 10)
        : null;

    if (finalData.frequency !== 'WEEKLY') finalData.days_of_week = [];
    
    if (finalData.frequency === 'MONTHLY') {
      if (finalData.monthly_type === 'specific_day' && !finalData.day_of_month) {
        currentError = 'Please specify the day of the month for monthly recurrence.';
      } else if (
        finalData.monthly_type === 'specific_day' &&
        (parseInt(finalData.day_of_month, 10) < 1 || parseInt(finalData.day_of_month, 10) > 31)
      ) {
        currentError = 'Day of month must be between 1 and 31.';
      } else if (
        finalData.monthly_type === 'ordinal_day' &&
        (!finalData.month_ordinal || !finalData.month_ordinal_day)
      ) {
        currentError = 'Please specify ordinal and day type for monthly recurrence.';
      }
      if (finalData.monthly_type === 'specific_day') {
        finalData.month_ordinal = null;
        finalData.month_ordinal_day = null;
      } else {
        finalData.day_of_month = null;
      }
    }

    if (finalData.frequency === 'YEARLY') {
      if (!finalData.month_of_year) {
        currentError = 'Please specify the month for yearly recurrence.';
      } 
      if (finalData.monthly_type === 'specific_day' && !finalData.day_of_month) {
        currentError = 'Please specify the day of the month for yearly recurrence.';
      } else if (
        finalData.monthly_type === 'specific_day' &&
        (parseInt(finalData.day_of_month, 10) < 1 || parseInt(finalData.day_of_month, 10) > 31)
      ) {
        currentError = 'Day of month must be between 1 and 31 for yearly recurrence.';
      } else if (
        finalData.monthly_type === 'ordinal_day' &&
        (!finalData.month_ordinal || !finalData.month_ordinal_day)
      ) {
        currentError = 'Please specify ordinal and day type for yearly recurrence.';
      }
      if (finalData.monthly_type === 'specific_day') {
        finalData.month_ordinal = null;
        finalData.month_ordinal_day = null;
      } else {
        finalData.day_of_month = null;
      }
    }

    if (finalData.frequency !== 'YEARLY') finalData.month_of_year = null;
    if (finalData.frequency !== 'MONTHLY' && finalData.frequency !== 'YEARLY') {
      finalData.day_of_month = null;
      finalData.month_ordinal = null;
      finalData.month_ordinal_day = null;
    }

    if (finalData.ends_on_type === 'AFTER_OCCURRENCES') {
      if (!finalData.ends_on_occurrences || parseInt(finalData.ends_on_occurrences, 10) < 1) {
        currentError = 'Please specify a valid number of occurrences (at least 1).';
      } else {
        finalData.ends_on_date = null;
      }
    } else if (finalData.ends_on_type === 'ON_DATE') {
      if (!finalData.ends_on_date) {
        currentError = 'Please specify an end date.';
      } else {
        finalData.ends_on_occurrences = null;
      }
    } else { 
      finalData.ends_on_occurrences = null;
      finalData.ends_on_date = null;
    }
  }
  delete finalData.monthly_type;

  if (currentError) {
    return { error: currentError, data: null };
  }

  return { error: null, data: finalData };
}; 