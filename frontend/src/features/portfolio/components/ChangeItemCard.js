import React from 'react';
import PropTypes from 'prop-types';
import {
  FaEdit,
  FaTrashAlt,
  FaCalendarAlt,
  FaMoneyBillWave,
} from 'react-icons/fa';
import { getChangeTypeIcon } from '../utils/iconUtils.js';

const ChangeItemCard = ({ change, onEdit, onDelete, onSelectChange, isSelected, portfolioCurrency, assetIdToNameMap }) => {
  if (!change) return null;

  // Basic date formatting, consider using a library like date-fns for more complex needs
  const formatDate = dateString => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return 'N/A'; // Basic check for YYYY-MM-DD
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      // Create date in local timezone. Month is 0-indexed for Date constructor.
      const dateObj = new Date(year, month - 1, day);
      if (isNaN(dateObj.getTime())) {
        // Check if date is valid
        return 'Invalid Date';
      }
      return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return 'Invalid Date'; // Fallback if date is invalid or parsing error
    }
  };

  const handleKeyDown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent default spacebar scroll
      if (onSelectChange && change && typeof change.id !== 'undefined') {
        onSelectChange(change.id);
      }
    }
  };

  const cardBaseStyle =
    'bg-white shadow-md rounded-lg p-4 mb-4 border hover:shadow-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';
  const selectedStyle = 'border-primary-500 ring-1 ring-primary-500 bg-primary-50';
  const unselectedStyle = 'border-gray-200 focus:ring-primary-300';

  return (
    <div
      className={`${cardBaseStyle} ${isSelected ? selectedStyle : unselectedStyle}`}
      onClick={() => {
        if (onSelectChange && change && typeof change.id !== 'undefined') onSelectChange(change.id);
      }}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected} // Indicate selected state for accessibility
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center min-w-0">
          {' '}
          {/* Added min-w-0 for better truncation */}
          {getChangeTypeIcon(change.changeType)}
          <h4
            className="text-md font-semibold text-gray-800 truncate"
            title={typeof change.description === 'string' ? change.description : undefined}
          >
            {change.description || 'No Description'}
          </h4>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          <button
            onClick={e => {
              e.stopPropagation();
              onEdit && onEdit(change);
            }}
            className="text-gray-500 hover:text-primary-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-300"
            aria-label="Edit Change"
            type="button"
          >
            <FaEdit />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              onDelete && onDelete(change.id);
            }}
            className="text-gray-500 hover:text-red-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300"
            aria-label="Delete Change"
            type="button"
          >
            <FaTrashAlt />
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <div className="flex items-center">
          <FaCalendarAlt className="mr-2 text-gray-400 flex-shrink-0" />
          <span>Date: {formatDate(change.changeDate)}</span>
        </div>
        {change.changeType !== 'REALLOCATION' && (
          <div className="flex items-center">
            <FaMoneyBillWave
              className={`mr-2 flex-shrink-0 ${change.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}
            />
            <span>
              Amount:{' '}
              {change.amount?.toLocaleString(undefined, { style: 'currency', currency: portfolioCurrency || 'USD' }) ||
                'N/A'}
            </span>
            {/* TODO: Use actual currency from portfolio settings. Consider passing portfolioCurrency as a prop or fetching from a global state/context. */}
          </div>
        )}
        {change.isRecurring && (
          <div className="flex items-center mt-1">
            <span
              className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full cursor-help"
              title={
                change.frequency
                  ? `This change repeats ${change.frequency}. More specific details (e.g., end date, exact day) can be displayed here when available.`
                  : 'This is a recurring change. Specific frequency details are not provided in the summary.'
              }
            >
              Recurring: {change.frequency || 'Enabled'}
            </span>
            {/* Future Consideration: For highly detailed recurrence patterns (e.g., custom intervals, end conditions), an expandable section or a details modal could be implemented. The current tooltip provides basic recurrence information. */}
          </div>
        )}
        {change.changeType === 'REALLOCATION' && change.targetAllocationJson && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1">Reallocation Targets:</p>
            <ul className="list-disc list-inside pl-1 text-xs text-gray-600">
              {Object.entries(
                typeof change.targetAllocationJson === 'string'
                  ? JSON.parse(change.targetAllocationJson)
                  : change.targetAllocationJson || {}
              ).map(([assetId, percentage]) => {
                const assetName = assetIdToNameMap && assetIdToNameMap[assetId] 
                  ? `${assetIdToNameMap[assetId]} (ID: ${assetId})` 
                  : `Asset ${assetId}`;
                return (
                  <li key={assetId}>
                    {assetName}: {Number(percentage).toFixed(2)}%
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

ChangeItemCard.propTypes = {
  change: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    changeType: PropTypes.string,
    description: PropTypes.string,
    changeDate: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isRecurring: PropTypes.bool,
    frequency: PropTypes.string,
    targetAllocationJson: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onSelectChange: PropTypes.func,
  isSelected: PropTypes.bool,
  portfolioCurrency: PropTypes.string,
  assetIdToNameMap: PropTypes.object,
};

ChangeItemCard.defaultProps = {
  portfolioCurrency: 'USD',
  assetIdToNameMap: {},
};

export default ChangeItemCard;
