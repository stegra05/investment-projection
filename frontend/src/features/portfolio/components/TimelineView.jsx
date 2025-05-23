import React from 'react';
import PropTypes from 'prop-types';

/**
 * @component TimelineView
 * @description Renders a chronological timeline of planned financial changes, grouped by year.
 * Each change is displayed as a clickable item, allowing for selection.
 * The timeline sorts years in descending order (most recent first) and changes within
 * each year in ascending order (earliest first). Handles invalid dates gracefully.
 *
 * @example
 * const changes = [ { id: '1', changeDate: '2024-05-01', changeType: 'Contribution', description: 'Monthly save' } ];
 * <TimelineView
 *   plannedChanges={changes}
 *   selectedChangeId={'1'}
 *   onSelectChange={(id) => console.log('Selected:', id)}
 * />
 *
 * @param {object} props - The component's props.
 * @param {Array<object>} [props.plannedChanges=[]] - An array of planned change objects to display.
 * @param {string|number|null} props.selectedChangeId - The ID of the currently selected change, if any.
 * @param {Function} [props.onSelectChange] - Callback function invoked when a change item is clicked/selected. Receives the change ID.
 *
 * @returns {JSX.Element} The rendered timeline view or an empty state message.
 */
const TimelineView = ({ plannedChanges = [], selectedChangeId, onSelectChange }) => {
  /**
   * Safely parses a date string in "YYYY-MM-DD" format into a Date object.
   * @param {string} dateString - The date string to parse.
   * @returns {Date|null} A Date object if parsing is successful, otherwise null.
   */
  const parseDateString = dateString => {
    // Basic validation for "YYYY-MM-DD" format.
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    // Month is 0-indexed in JavaScript's Date constructor.
    const dateObj = new Date(year, month - 1, day);
    // Check if the created Date object is valid.
    return isNaN(dateObj.getTime()) ? null : dateObj;
  };

  // Group changes by year.
  // `changesByYear` will be an object like: { 2024: [change1, change2], 2023: [change3], "Unknown Dates": [change4] }
  const changesByYear = plannedChanges.reduce((acc, change) => {
    const dateObj = parseDateString(change.changeDate);
    if (!dateObj) {
      // Group changes with invalid or missing dates under "Unknown Dates".
      const unknownYearGroup = acc['Unknown Dates'] || [];
      unknownYearGroup.push(change);
      acc['Unknown Dates'] = unknownYearGroup;
      return acc;
    }
    const year = dateObj.getFullYear();
    if (!acc[year]) {
      acc[year] = []; // Initialize array for the year if it doesn't exist.
    }
    acc[year].push(change);
    // Sort changes within each year by date, earliest first.
    // Invalid dates within a year group are pushed towards the end.
    acc[year].sort((a, b) => {
      const dateA = parseDateString(a.changeDate);
      const dateB = parseDateString(b.changeDate);
      if (!dateA && !dateB) return 0; // Both invalid, keep order.
      if (!dateA) return 1;  // a is invalid, sort b before a.
      if (!dateB) return -1; // b is invalid, sort a before b.
      return dateA - dateB;  // Standard date comparison.
    });
    return acc;
  }, {});

  // Get sorted years: most recent year first.
  // "Unknown Dates" group, if it exists, is always placed at the end.
  const sortedYears = Object.keys(changesByYear)
    .filter(year => year !== 'Unknown Dates') // Exclude "Unknown Dates" for numeric sort.
    .sort((a, b) => Number(b) - Number(a)); // Sort years numerically in descending order.
  
  if (changesByYear['Unknown Dates']) {
    sortedYears.push('Unknown Dates'); // Append "Unknown Dates" group to the end.
  }

  // If no planned changes are provided, display an empty state message.
  if (!plannedChanges || plannedChanges.length === 0) {
    return <div className="p-4 text-sm text-gray-500 text-center">No planned changes to display in timeline.</div>;
  }

  return (
    // Main container for the timeline, with vertical spacing between year groups.
    <div className="space-y-6">
      {/* Map over sorted years to create sections for each year. */}
      {sortedYears.map(year => (
        <div key={year}>
          {/* Year Header: Sticky positioning for better context while scrolling. */}
          <h4 className="text-lg font-semibold text-gray-700 mb-2 sticky top-0 bg-gray-50 py-1 px-2 rounded-sm z-10">
            {year}
          </h4>
          {/* List of changes for the current year, with a visual timeline bar (left border). */}
          <ul className="space-y-3 ml-2 border-l border-gray-200 pl-4">
            {/* Map over changes within the current year group. */}
            {changesByYear[year].map(change => {
              const displayDateObj = parseDateString(change.changeDate); // Parse date for display.
              return (
                <li key={change.id}>
                  {/* Clickable button representing a single change item. */}
                  <button
                    type="button"
                    // Dynamic styling based on whether the item is selected.
                    className={`w-full text-left p-2 rounded-md border text-sm transition-colors duration-150 
                                focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500
                                ${
                                  change.id === selectedChangeId
                                    ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' // Selected style
                                    : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-100' // Default style
                                }`}
                    onClick={() => onSelectChange && onSelectChange(change.id)} // Trigger selection change.
                  >
                    {/* Display formatted date (Month Day) and change type. */}
                    <div className="font-medium text-gray-800">
                      {displayDateObj
                        ? displayDateObj.toLocaleDateString('en-US', { // Example US English format.
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Invalid Date'}{' '} 
                      - {change.changeType}
                    </div>
                    {/* Display description if available, truncated. */}
                    {change.description && (
                      <p className="text-xs text-gray-600 truncate">{change.description}</p>
                    )}
                    {/* Display basic recurrence information if the change is recurring. */}
                    {change.isRecurring && (
                      <p className="text-xs text-gray-500 italic">
                        Recurring: {change.frequency}
                        {/* Show interval if greater than 1. */}
                        {change.interval && Number(change.interval) > 1 ? ` (every ${change.interval})` : ''}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

// PropTypes for type-checking and component documentation.
TimelineView.propTypes = {
  /** 
   * An array of planned change objects to be displayed on the timeline.
   * Each object should contain at least `id`, `changeDate`, and `changeType`.
   * Other fields like `description`, `isRecurring`, `frequency`, and `interval` are optional for display.
   */
  plannedChanges: PropTypes.arrayOf(
    PropTypes.shape({
      /** Unique identifier for the planned change. */
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      /** Date of the change, expected in 'YYYY-MM-DD' format. */
      changeDate: PropTypes.string.isRequired,
      /** Type of the change (e.g., 'Contribution', 'Withdrawal'). */
      changeType: PropTypes.string.isRequired,
      /** Optional description of the change. */
      description: PropTypes.string,
      /** Boolean indicating if the change is recurring. */
      isRecurring: PropTypes.bool,
      /** Frequency of recurrence if `isRecurring` is true (e.g., 'Monthly'). */
      frequency: PropTypes.string,
      /** Interval of recurrence if `isRecurring` is true (e.g., repeats every 2 months if interval is 2). */
      interval: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Can be string from input before parsing
    })
  ),
  /** The ID of the currently selected change item. `null` or `undefined` if no item is selected. */
  selectedChangeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** 
   * Callback function triggered when a change item is clicked/selected from the timeline.
   * Receives the ID of the selected change as its argument.
   */
  onSelectChange: PropTypes.func,
};

export default TimelineView;
