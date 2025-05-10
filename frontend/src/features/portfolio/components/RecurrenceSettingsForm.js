import React from 'react';
import PropTypes from 'prop-types';
import { useRecurrenceForm } from '../hooks/useRecurrenceForm'; // Import the hook

// Constants for Recurrence (copied from AddEditChangePanel.js)
const FREQUENCY_OPTIONS = [
  // { value: 'ONE_TIME', label: 'One-Time (No Recurrence)' }, // Exclude ONE_TIME as it's handled by the toggle
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const DAYS_OF_WEEK_OPTIONS = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' },
];

const MONTH_ORDINAL_OPTIONS = [
  { value: 'FIRST', label: 'First' },
  { value: 'SECOND', label: 'Second' },
  { value: 'THIRD', label: 'Third' },
  { value: 'FOURTH', label: 'Fourth' },
  { value: 'LAST', label: 'Last' },
];

const ORDINAL_DAY_TYPE_OPTIONS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
  { value: 'DAY', label: 'Day' },
  { value: 'WEEKDAY', label: 'Weekday' },
  { value: 'WEEKEND_DAY', label: 'Weekend Day' },
];

const MONTH_OF_YEAR_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const ENDS_ON_TYPE_OPTIONS = [
  { value: 'NEVER', label: 'Never' },
  { value: 'AFTER_OCCURRENCES', label: 'After a number of occurrences' },
  { value: 'ON_DATE', label: 'On a specific date' },
];

// Component now receives recurrence specific data and a specific setter
const RecurrenceSettingsForm = ({ recurrenceData, onRecurrenceDataChange }) => {
  const { handleRecurrenceChange } = useRecurrenceForm(recurrenceData, onRecurrenceDataChange);

  return (
    <div className="p-4 border border-gray-200 rounded-md bg-gray-50 space-y-4">
      {/* Frequency Dropdown */}
      <div>
        <label
          htmlFor="frequency"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Frequency
        </label>
        <select
          id="frequency"
          name="frequency"
          value={recurrenceData.frequency} // Use recurrenceData
          onChange={handleRecurrenceChange} // Use hook's handler
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
        >
          {/* ONE_TIME is not an option here as is_recurring handles it */}
          {FREQUENCY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Interval Input (shown if frequency is not ONE_TIME, which is always true here) */}
      <div>
        <label
          htmlFor="interval"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Repeat every{' '}
          <input
            type="number"
            id="interval"
            name="interval"
            value={recurrenceData.interval} // Use recurrenceData
            onChange={handleRecurrenceChange} // Use hook's handler
            min="1"
            className="mx-1 w-16 text-center border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
          />{' '}
          {recurrenceData.frequency && recurrenceData.frequency !== 'ONE_TIME'
            ? recurrenceData.frequency.toLowerCase().replace(/ly$/, '').replace(/li$/, 's')
            : 'unit'}
          (s)
        </label>
      </div>

      {/* Weekly Specific: Days of Week Checkboxes */}
      {recurrenceData.frequency === 'WEEKLY' && (
        <div className="space-y-2">
          <p className="block text-sm font-medium text-gray-700">Repeat on</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {DAYS_OF_WEEK_OPTIONS.map(day => (
              <div key={day.value} className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={`dow-${day.value}`}
                    name={`dow-${day.value}`} // Name needs to be unique for handler
                    type="checkbox"
                    value={day.value}
                    checked={recurrenceData.days_of_week && recurrenceData.days_of_week.includes(day.value)}
                    onChange={handleRecurrenceChange} // Use hook's handler
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-2 text-sm">
                  <label
                    htmlFor={`dow-${day.value}`}
                    className="font-medium text-gray-700"
                  >
                    {day.label}
                  </label>
                </div>
              </div>
            ))}
          </div>
          {recurrenceData.days_of_week && recurrenceData.days_of_week.length === 0 && (
            <p className="text-xs text-red-500">Please select at least one day.</p>
          )}
        </div>
      )}

      {/* Yearly Specific: Month of Year */}
      {recurrenceData.frequency === 'YEARLY' && (
        <div>
          <label
            htmlFor="month_of_year"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            In
          </label>
          <select
            id="month_of_year"
            name="month_of_year"
            value={recurrenceData.month_of_year} // Use recurrenceData
            onChange={handleRecurrenceChange} // Use hook's handler
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
          >
            <option value="">Select Month</option>
            {MONTH_OF_YEAR_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Monthly (or Yearly day selection) Specific */}
      {(recurrenceData.frequency === 'MONTHLY' || recurrenceData.frequency === 'YEARLY') && (
        <div className="space-y-3 pt-2 border-t border-gray-100 mt-3">
          <p className="block text-sm font-medium text-gray-700 mb-1">On</p>
          <div className="space-y-2">
            {/* Radio to choose specific day or ordinal day */}
            <div className="flex items-center">
              <input
                type="radio"
                id="monthly_specific_day"
                name="monthly_type"
                value="specific_day"
                checked={recurrenceData.monthly_type === 'specific_day'} // Use recurrenceData
                onChange={handleRecurrenceChange} // Use hook's handler
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
              />
              <label
                htmlFor="monthly_specific_day"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Day of the month
              </label>
            </div>
            {recurrenceData.monthly_type === 'specific_day' && (
              <input
                type="number"
                id="day_of_month"
                name="day_of_month"
                value={recurrenceData.day_of_month} // Use recurrenceData
                onChange={handleRecurrenceChange} // Use hook's handler
                placeholder="e.g., 15"
                min="1"
                max="31"
                className="ml-6 mt-1 block w-1/2 pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
              />
            )}

            <div className="flex items-center mt-2">
              <input
                type="radio"
                id="monthly_ordinal_day"
                name="monthly_type"
                value="ordinal_day"
                checked={recurrenceData.monthly_type === 'ordinal_day'} // Use recurrenceData
                onChange={handleRecurrenceChange} // Use hook's handler
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
              />
              <label
                htmlFor="monthly_ordinal_day"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                The
              </label>
            </div>
            {recurrenceData.monthly_type === 'ordinal_day' && (
              <div className="ml-6 mt-1 grid grid-cols-2 gap-x-2">
                <select
                  id="month_ordinal"
                  name="month_ordinal"
                  value={recurrenceData.month_ordinal} // Use recurrenceData
                  onChange={handleRecurrenceChange} // Use hook's handler
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                >
                  <option value="">Select Ordinal</option>
                  {MONTH_ORDINAL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  id="month_ordinal_day"
                  name="month_ordinal_day"
                  value={recurrenceData.month_ordinal_day} // Use recurrenceData
                  onChange={handleRecurrenceChange} // Use hook's handler
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                >
                  <option value="">Select Day Type</option>
                  {ORDINAL_DAY_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ends On Section */}
      <div className="pt-3 border-t border-gray-100 mt-3">
        <label
          htmlFor="ends_on_type"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Ends
        </label>
        <select
          id="ends_on_type"
          name="ends_on_type"
          value={recurrenceData.ends_on_type} // Use recurrenceData
          onChange={handleRecurrenceChange} // Use hook's handler
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
        >
          {ENDS_ON_TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {recurrenceData.ends_on_type === 'AFTER_OCCURRENCES' && (
          <div className="mt-2">
            <label
              htmlFor="ends_on_occurrences"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              After
            </label>
            <input
              type="number"
              id="ends_on_occurrences"
              name="ends_on_occurrences"
              value={recurrenceData.ends_on_occurrences} // Use recurrenceData
              onChange={handleRecurrenceChange} // Use hook's handler
              min="1"
              placeholder="e.g., 12"
              className="mt-1 block w-1/2 pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
            />
            <span className="ml-1 text-sm text-gray-600">occurrences</span>
          </div>
        )}
        {recurrenceData.ends_on_type === 'ON_DATE' && (
          <div className="mt-2">
            <label
              htmlFor="ends_on_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              On Date
            </label>
            <input
              type="date"
              id="ends_on_date"
              name="ends_on_date"
              value={recurrenceData.ends_on_date} // Use recurrenceData
              onChange={handleRecurrenceChange} // Use hook's handler
              className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};

RecurrenceSettingsForm.propTypes = {
  recurrenceData: PropTypes.shape({
    frequency: PropTypes.string,
    interval: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    days_of_week: PropTypes.arrayOf(PropTypes.number),
    day_of_month: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    monthly_type: PropTypes.string,
    month_ordinal: PropTypes.string,
    month_ordinal_day: PropTypes.string,
    month_of_year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    ends_on_type: PropTypes.string,
    ends_on_occurrences: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    ends_on_date: PropTypes.string,
  }).isRequired,
  onRecurrenceDataChange: PropTypes.func.isRequired,
};

export default RecurrenceSettingsForm; 