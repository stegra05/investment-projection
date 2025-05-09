import React from 'react';
import PropTypes from 'prop-types';
import { FaEdit, FaTrashAlt, FaCalendarAlt, FaMoneyBillWave, FaRandom, FaInfoCircle } from 'react-icons/fa'; // Example icons

// TODO: Potentially move to a utils file or constants
const getChangeTypeIcon = (changeType) => {
  switch (changeType) {
  case 'CONTRIBUTION':
    return <FaMoneyBillWave className="text-green-500 mr-2" />;
  case 'WITHDRAWAL':
    return <FaMoneyBillWave className="text-red-500 mr-2" />;
  case 'REALLOCATION':
    return <FaRandom className="text-blue-500 mr-2" />;
  default:
    return <FaInfoCircle className="text-gray-500 mr-2" />;
  }
};

const ChangeItemCard = ({ change, onEdit, onDelete, onSelect }) => {
  if (!change) return null;

  // Basic date formatting, consider using a library like date-fns for more complex needs
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', 
      });
    } catch (e) {
      return dateString; // Fallback if date is invalid
    }
  };
  
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (onSelect && change && typeof change.id !== 'undefined') {
        onSelect(change.id);
      }
    }
  };

  const cardBaseStyle = 'bg-white shadow-md rounded-lg p-4 mb-4 border border-gray-200 hover:shadow-lg transition-shadow duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-300';
  // TODO: Add selected style, e.g., `border-primary-500` if selected

  return (
    <div 
      className={`${cardBaseStyle}`}
      onClick={() => { if (onSelect && change && typeof change.id !== 'undefined') onSelect(change.id); }} // Ensure onSelect is callable and change.id is present
      onKeyDown={handleKeyDown} // Added onKeyDown handler
      role="button" // Added role
      tabIndex={0} // Added tabIndex
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center min-w-0"> {/* Added min-w-0 for better truncation */}
          {getChangeTypeIcon(change.change_type)}
          <h4 className="text-md font-semibold text-gray-800 truncate" title={change.description}>{change.description || 'No Description'}</h4>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(change); }} 
            className="text-gray-500 hover:text-primary-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-300"
            aria-label="Edit Change"
            type="button"
          >
            <FaEdit />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(change.id); }} 
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
          <span>Date: {formatDate(change.change_date)}</span>
        </div>
        {change.change_type !== 'REALLOCATION' && (
          <div className="flex items-center">
            <FaMoneyBillWave className={`mr-2 flex-shrink-0 ${change.amount >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <span>Amount: {change.amount?.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) || 'N/A'}</span>
            {/* TODO: Use actual currency from portfolio settings if available */}
          </div>
        )}
        {change.is_recurring && (
          <div className="flex items-center mt-1">
            <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Recurring: {change.frequency}</span>
            {/* TODO: Add more detailed recurrence info, perhaps in a tooltip or expandable section */}
          </div>
        )}
        {change.change_type === 'REALLOCATION' && change.target_allocation_json && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1">Reallocation Targets:</p>
            <ul className="list-disc list-inside pl-1 text-xs text-gray-600">
              {Object.entries(typeof change.target_allocation_json === 'string' ? JSON.parse(change.target_allocation_json) : change.target_allocation_json).map(([assetName, percentage]) => (
                <li key={assetName}>{assetName}: {Number(percentage) * 100}%</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Added PropTypes
ChangeItemCard.propTypes = {
  change: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    change_type: PropTypes.string,
    description: PropTypes.string,
    change_date: PropTypes.string,
    amount: PropTypes.number,
    is_recurring: PropTypes.bool,
    frequency: PropTypes.string,
    target_allocation_json: PropTypes.oneOfType([PropTypes.string, PropTypes.object]), // Can be string (JSON) or parsed object
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onSelect: PropTypes.func,
};

export default ChangeItemCard; 