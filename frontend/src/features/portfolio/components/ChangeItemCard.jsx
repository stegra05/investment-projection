import React from 'react';
import PropTypes from 'prop-types';
import {
  FaEdit,         // Edit icon
  FaTrashAlt,     // Delete icon
  FaCalendarAlt,  // Calendar icon for date
  FaMoneyBillWave,// Money icon for amount
} from 'react-icons/fa'; // Font Awesome icons.
import { getChangeTypeIcon } from '../utils/iconUtils.jsx'; // Utility to get an icon based on change type.

/**
 * @component ChangeItemCard
 * @description Renders a card displaying details of a single planned financial change.
 * It shows the change type (with an icon), description, date, and amount (if applicable).
 * For reallocations, it displays target asset allocations.
 * Provides "Edit" and "Delete" action buttons and supports a "selected" state.
 * The card is clickable for selection and supports keyboard interaction for accessibility.
 *
 * @example
 * const change = { id: '1', changeType: 'Contribution', description: 'Monthly savings', changeDate: '2024-01-15', amount: 100, isRecurring: true, frequency: 'Monthly' };
 * const assetMap = {'asset_id_1': 'Apple Stock'};
 * <ChangeItemCard
 *   change={change}
 *   onEdit={() => handleEdit(change)}
 *   onDelete={() => handleDelete(change.id)}
 *   onSelectChange={() => handleSelect(change.id)}
 *   isSelected={selectedId === change.id}
 *   portfolioCurrency="EUR"
 *   assetIdToNameMap={assetMap}
 * />
 *
 * @param {object} props - The component's props.
 * @param {object} props.change - The planned change object containing details to display. Required.
 * @param {Function} [props.onEdit] - Callback function invoked when the edit button is clicked. Receives the change object.
 * @param {Function} [props.onDelete] - Callback function invoked when the delete button is clicked. Receives the change ID.
 * @param {Function} [props.onSelectChange] - Callback function invoked when the card is clicked or selected via keyboard. Receives the change ID.
 * @param {boolean} [props.isSelected=false] - If true, applies styling to indicate the card is selected.
 * @param {string} [props.portfolioCurrency='USD'] - The currency code (e.g., 'USD', 'EUR') for formatting the amount.
 * @param {object} [props.assetIdToNameMap={}] - An object mapping asset IDs to their display names, used for reallocation details.
 *
 * @returns {JSX.Element|null} The rendered card for the planned change, or null if no `change` data is provided.
 */
const ChangeItemCard = ({ change, onEdit, onDelete, onSelectChange, isSelected, portfolioCurrency, assetIdToNameMap }) => {
  // If no change data is provided, render nothing.
  if (!change) return null;

  /**
   * Formats a date string (YYYY-MM-DD) into a more readable local format (e.g., "Jan 1, 2024").
   * Includes basic validation for the input string format and resulting Date object.
   * @param {string} dateString - The date string in 'YYYY-MM-DD' format.
   * @returns {string} The formatted date string, or "N/A" / "Invalid Date" on error.
   */
  const formatDate = dateString => {
    // Basic check for YYYY-MM-DD format.
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return 'N/A';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      // Create date in local timezone. Month is 0-indexed for Date constructor.
      const dateObj = new Date(year, month - 1, day);
      // Check if the created Date object is valid.
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      // Format the date to a short, readable local string.
      return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return 'Invalid Date'; // Fallback for parsing errors.
    }
  };

  /**
   * Handles keydown events on the card for accessibility, allowing selection with Enter or Space.
   * @param {React.KeyboardEvent} event - The keyboard event.
   */
  const handleKeyDown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent default spacebar action (e.g., page scroll).
      // Trigger selection if handler and valid change ID are present.
      if (onSelectChange && change && typeof change.id !== 'undefined') {
        onSelectChange(change.id);
      }
    }
  };

  // Base styling for the card.
  const cardBaseStyle =
    'bg-white shadow-md rounded-lg p-4 mb-4 border hover:shadow-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';
  // Additional styling for a selected card.
  const selectedStyle = 'border-primary-500 ring-1 ring-primary-500 bg-primary-50';
  // Styling for an unselected card (includes focus style for accessibility).
  const unselectedStyle = 'border-gray-200 focus:ring-primary-300';

  return (
    // Main card container div. Clickable for selection, with keyboard support and ARIA attributes.
    <div
      className={`${cardBaseStyle} ${isSelected ? selectedStyle : unselectedStyle}`}
      onClick={() => {
        // Trigger selection on click if handler and valid ID exist.
        if (onSelectChange && change && typeof change.id !== 'undefined') onSelectChange(change.id);
      }}
      onKeyDown={handleKeyDown} // Handle keyboard events for selection.
      role="button" // ARIA: Indicates the div is interactive like a button.
      tabIndex={0}  // Makes the div focusable.
      aria-pressed={isSelected} // ARIA: Indicates if the "button" (card) is currently pressed/selected.
    >
      {/* Card Header: Change Type Icon, Description, and Action Buttons */}
      <div className="flex justify-between items-start mb-3">
        {/* Left side of header: Icon and Description */}
        <div className="flex items-center min-w-0"> {/* `min-w-0` helps with truncation in flex containers. */}
          {/* Display icon based on change type (e.g., contribution, withdrawal). */}
          {getChangeTypeIcon(change.changeType)}
          {/* Change Description (or a placeholder if no description). Truncated if too long. */}
          <h4
            className="text-md font-semibold text-gray-800 truncate"
            title={change.description || undefined} // Show full description on hover if truncated.
          >
            {change.description ? (
              change.description
            ) : (
              // Placeholder for missing description.
              <span className="italic text-gray-500">—</span>
            )}
          </h4>
        </div>
        {/* Right side of header: Edit and Delete buttons. `flex-shrink-0` prevents buttons from shrinking. */}
        <div className="flex space-x-2 flex-shrink-0">
          {/* Edit Button */}
          <button
            onClick={e => {
              e.stopPropagation(); // Prevent card's onClick from firing when button is clicked.
              onEdit && onEdit(change); // Call onEdit prop with the full change object.
            }}
            className="text-gray-500 hover:text-primary-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-300"
            aria-label="Edit Change" // Accessibility label.
            type="button" // Standard button type.
          >
            <FaEdit /> {/* Edit icon. */}
          </button>
          {/* Delete Button */}
          <button
            onClick={e => {
              e.stopPropagation(); // Prevent card's onClick.
              onDelete && onDelete(change.id); // Call onDelete prop with the change ID.
            }}
            className="text-gray-500 hover:text-red-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300"
            aria-label="Delete Change" // Accessibility label.
            type="button"
          >
            <FaTrashAlt /> {/* Delete icon. */}
          </button>
        </div>
      </div>

      {/* Card Body: Date, Amount, Recurrence, and Reallocation Details */}
      <div className="text-sm text-gray-600 space-y-2">
        {/* Date Display */}
        <div className="flex items-center">
          <FaCalendarAlt className="mr-2 text-gray-400 flex-shrink-0" /> {/* Calendar icon. */}
          <span>
            <span className="font-semibold text-gray-700 mr-1">Date:</span>
            {formatDate(change.changeDate)} {/* Formatted date. */}
          </span>
        </div>
        {/* Amount Display: Conditional based on change type (not for Reallocation). */}
        {change.changeType !== 'REALLOCATION' && (
          <div className="flex items-center">
            <FaMoneyBillWave // Money icon, color-coded for positive/negative amounts.
              className={`mr-2 flex-shrink-0 ${change.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}
            />
            <span>
              <span className="font-semibold text-gray-700 mr-1">Amount:</span>
              {/* Format amount as currency using portfolioCurrency or USD default. Show N/A if amount is invalid. */}
              {change.amount?.toLocaleString(undefined, { style: 'currency', currency: portfolioCurrency || 'USD' }) ||
                'N/A'}
            </span>
            {/* TODO: Consider a more robust way to handle portfolioCurrency, e.g., from context or a global store. */}
          </div>
        )}
        {/* Recurrence Display: Shows if the change is recurring. */}
        {change.isRecurring && (
          <div className="flex items-center mt-1">
            <span
              className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full cursor-help"
              // Tooltip provides basic recurrence info. More details might be in edit mode or a dedicated view.
              title={
                change.frequency
                  ? `Repeats: ${change.frequency}. Further details like end date or specific day of month may be available elsewhere or can be added in edit mode.`
                  : 'This is a recurring change. Specific frequency (e.g., monthly, annually) is not detailed here.'
              }
            >
              {change.frequency ? `Repeats: ${change.frequency}` : 'Recurring'}
            </span>
            {/* Note for future enhancement: Displaying full recurrence rules can be complex and might need more UI space. */}
          </div>
        )}
        {/* Reallocation Targets Display: Conditional for 'REALLOCATION' type. */}
        {change.changeType === 'REALLOCATION' && change.targetAllocationJson && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1">Reallocation Targets:</p>
            <ul className="list-disc list-inside pl-1 text-xs text-gray-600">
              {/* Parse targetAllocationJson (if string) and map over entries to display asset targets. */}
              {Object.entries(
                typeof change.targetAllocationJson === 'string'
                  ? JSON.parse(change.targetAllocationJson) // Parse if it's a JSON string.
                  : change.targetAllocationJson || {} // Use as is if already an object, or default to empty object.
              ).map(([assetId, percentage]) => {
                // Resolve asset ID to name using assetIdToNameMap, or show ID if name not found.
                const assetName = assetIdToNameMap && assetIdToNameMap[assetId] 
                  ? `${assetIdToNameMap[assetId]} (ID: ${assetId})` 
                  : `Asset ${assetId}`; // Fallback display if asset name is not in the map.
                return (
                  <li key={assetId}>
                    {assetName}: {Number(percentage).toFixed(2)}% {/* Format percentage. */}
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

// PropTypes for type-checking and component documentation.
ChangeItemCard.propTypes = {
  /** 
   * The planned change object containing all details to be displayed on the card. 
   * Required.
   */
  change: PropTypes.shape({
    /** Unique identifier for the planned change. */
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    /** Type of the change (e.g., 'Contribution', 'Withdrawal', 'Reallocation'). */
    changeType: PropTypes.string,
    /** Optional description of the planned change. */
    description: PropTypes.string,
    /** Date of the planned change, expected in 'YYYY-MM-DD' format. */
    changeDate: PropTypes.string,
    /** Amount of the change (for Contributions/Withdrawals). Can be positive or negative. */
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Boolean indicating if the change is recurring. */
    isRecurring: PropTypes.bool,
    /** Frequency of recurrence if `isRecurring` is true (e.g., 'Monthly', 'Annually'). */
    frequency: PropTypes.string,
    /** 
     * Target allocations for 'Reallocation' type changes. 
     * Can be a JSON string or an object mapping asset IDs to percentage values.
     */
    targetAllocationJson: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    // Add other properties of the 'change' object as they become relevant for display or logic.
  }).isRequired,
  /** Callback function triggered when the "Edit" button is clicked. Receives the full `change` object. */
  onEdit: PropTypes.func,
  /** Callback function triggered when the "Delete" button is clicked. Receives the `id` of the change. */
  onDelete: PropTypes.func,
  /** Callback function triggered when the card itself is clicked or selected via keyboard. Receives the `id` of the change. */
  onSelectChange: PropTypes.func,
  /** Boolean indicating whether the card is currently selected, used for applying selection styling. */
  isSelected: PropTypes.bool,
  /** The currency code (e.g., 'USD', 'EUR') to use for formatting the amount. Defaults to 'USD'. */
  portfolioCurrency: PropTypes.string,
  /** 
   * An object mapping asset IDs to their display names. 
   * Used to show asset names in reallocation targets. Defaults to an empty object.
   */
  assetIdToNameMap: PropTypes.object,
};

// Default prop values.
ChangeItemCard.defaultProps = {
  portfolioCurrency: 'USD', // Default currency if not specified.
  assetIdToNameMap: {},   // Default to empty map if not provided.
  // isSelected defaults to false (handled by undefined prop).
  // onEdit, onDelete, onSelectChange default to undefined (optional handlers).
};

export default ChangeItemCard;
