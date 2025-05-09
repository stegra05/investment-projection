import React from 'react';
import PropTypes from 'prop-types';

const TimelineView = ({ plannedChanges = [], selectedChangeId, onSelectChange }) => {
  // Group changes by year
  const changesByYear = plannedChanges.reduce((acc, change) => {
    const year = new Date(change.change_date).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(change);
    // Sort changes within each year by date, earliest first
    acc[year].sort((a, b) => new Date(a.change_date) - new Date(b.change_date));
    return acc;
  }, {});

  // Get sorted years, most recent first
  const sortedYears = Object.keys(changesByYear).sort((a, b) => b - a);

  if (!plannedChanges || plannedChanges.length === 0) {
    return <div className="text-sm text-gray-500">No planned changes to display in timeline.</div>;
  }

  return (
    <div className="space-y-6">
      {sortedYears.map(year => (
        <div key={year}>
          <h4 className="text-lg font-semibold text-gray-700 mb-2 sticky top-0 bg-gray-50 py-1 px-2 rounded-sm z-10">{year}</h4>
          <ul className="space-y-3 ml-2 border-l border-gray-200 pl-4">
            {changesByYear[year].map(change => (
              <li 
                key={change.id} 
                className={`p-2 rounded-md border text-sm cursor-pointer hover:bg-gray-100 transition-colors duration-150
                            ${change.id === selectedChangeId ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 bg-white'}`}
                onClick={() => onSelectChange && onSelectChange(change.id)}
              >
                <div className="font-medium text-gray-800">{new Date(change.change_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {change.change_type}</div>
                {change.description && <p className="text-xs text-gray-600 truncate">{change.description}</p>}
                {/* Basic recurrence info if present */}
                {change.is_recurring && (
                  <p className="text-xs text-gray-500 italic">
                    Recurring: {change.frequency}{change.interval > 1 ? ` (every ${change.interval})` : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

TimelineView.propTypes = {
  plannedChanges: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    change_date: PropTypes.string.isRequired,
    change_type: PropTypes.string.isRequired,
    description: PropTypes.string,
    is_recurring: PropTypes.bool,
    frequency: PropTypes.string,
    interval: PropTypes.number,
    // Add other relevant change properties here if needed for display
  })),
  selectedChangeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectChange: PropTypes.func,
};

export default TimelineView; 