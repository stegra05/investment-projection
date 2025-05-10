import { useCallback } from 'react';

export const useRecurrenceForm = (recurrenceData, setRecurrenceData) => {
  const handleRecurrenceChange = useCallback(
    e => {
      const { name, value, type, checked } = e.target;
      let newRecurrenceData = { ...recurrenceData };

      if (name === 'frequency') {
        newRecurrenceData.frequency = value;
        // Reset dependent fields when frequency changes (excluding ONE_TIME logic as that's handled by parent toggle)
        newRecurrenceData.days_of_week = [];
        newRecurrenceData.day_of_month = '';
        newRecurrenceData.monthly_type = 'specific_day'; // Default for monthly/yearly
        newRecurrenceData.month_ordinal = '';
        newRecurrenceData.month_ordinal_day = '';
        // month_of_year is reset by parent if frequency is not YEARLY
      } else if (name.startsWith('dow-')) {
        const dayValue = parseInt(value, 10);
        const currentDays = newRecurrenceData.days_of_week || [];
        if (checked) {
          if (!currentDays.includes(dayValue)) {
            newRecurrenceData.days_of_week = [...currentDays, dayValue].sort((a, b) => a - b);
          }
        } else {
          newRecurrenceData.days_of_week = currentDays.filter(day => day !== dayValue);
        }
      } else if (name === 'monthly_type') {
        newRecurrenceData.monthly_type = value;
        if (value === 'specific_day') {
          newRecurrenceData.month_ordinal = '';
          newRecurrenceData.month_ordinal_day = '';
        } else if (value === 'ordinal_day') {
          newRecurrenceData.day_of_month = '';
        }
      } else {
        // Generic handler for other recurrence fields like interval, day_of_month, etc.
        newRecurrenceData[name] = type === 'checkbox' ? checked : value;
      }
      setRecurrenceData(newRecurrenceData);
    },
    [recurrenceData, setRecurrenceData]
  );

  return {
    handleRecurrenceChange,
    // We can return specific derived states or validated values later if needed
  };
}; 