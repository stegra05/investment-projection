import React from 'react';
import PropTypes from 'prop-types';

const TimelineView = ({ plannedChanges = [], selectedChangeId, onSelectChange }) => {
  // Helper to parse date string "YYYY-MM-DD" safely
  const parseDateString = dateString => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  };

  // Group changes by year
  const changesByYear = plannedChanges.reduce((acc, change) => {
    const dateObj = parseDateString(change.change_date);
    if (!dateObj) {
      // Handle invalid or missing dates gracefully
      const unknownYear = acc['Unknown Dates'] || [];
      unknownYear.push(change);
      acc['Unknown Dates'] = unknownYear;
      return acc;
    }
    const year = dateObj.getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(change);
    // Sort changes within each year by date, earliest first
    acc[year].sort((a, b) => {
      const dateA = parseDateString(a.change_date);
      const dateB = parseDateString(b.change_date);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1; // Put items with invalid dates last
      if (!dateB) return -1;
      return dateA - dateB;
    });
    return acc;
  }, {});

  // Get sorted years, most recent first, handling "Unknown Dates"
  const sortedYears = Object.keys(changesByYear)
    .filter(year => year !== 'Unknown Dates')
    .sort((a, b) => b - a);
  if (changesByYear['Unknown Dates']) {
    sortedYears.push('Unknown Dates'); // Add Unknown Dates group at the end
  }

  if (!plannedChanges || plannedChanges.length === 0) {
    return <div className="text-sm text-gray-500">No planned changes to display in timeline.</div>;
  }

  return (
    <div className="space-y-6">
      {sortedYears.map(year => (
        <div key={year}>
          <h4 className="text-lg font-semibold text-gray-700 mb-2 sticky top-0 bg-gray-50 py-1 px-2 rounded-sm z-10">
            {year}
          </h4>
          <ul className="space-y-3 ml-2 border-l border-gray-200 pl-4">
            {changesByYear[year].map(change => {
              const displayDateObj = parseDateString(change.change_date);
              return (
                <li key={change.id}>
                  <button
                    type="button"
                    className={`w-full text-left p-2 rounded-md border text-sm transition-colors duration-150 
                                focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500
                                ${
                                  change.id === selectedChangeId
                                    ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500'
                                    : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-100'
                                }`}
                    onClick={() => onSelectChange && onSelectChange(change.id)}
                  >
                    <div className="font-medium text-gray-800">
                      {displayDateObj
                        ? displayDateObj.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Invalid Date'}{' '}
                      - {change.change_type}
                    </div>
                    {change.description && (
                      <p className="text-xs text-gray-600 truncate">{change.description}</p>
                    )}
                    {/* Basic recurrence info if present */}
                    {change.is_recurring && (
                      <p className="text-xs text-gray-500 italic">
                        Recurring: {change.frequency}
                        {change.interval > 1 ? ` (every ${change.interval})` : ''}
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

TimelineView.propTypes = {
  plannedChanges: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      change_date: PropTypes.string.isRequired,
      change_type: PropTypes.string.isRequired,
      description: PropTypes.string,
      is_recurring: PropTypes.bool,
      frequency: PropTypes.string,
      interval: PropTypes.number,
      // Add other relevant change properties here if needed for display
    })
  ),
  selectedChangeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectChange: PropTypes.func,
};

export default TimelineView;
