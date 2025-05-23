import React from 'react';
import PropTypes from 'prop-types';
import Input from '../../../components/Input/Input'; 
import Select from '../../../components/Select/Select'; // Custom Select component.
import { CHANGE_TYPES } from '../../../constants/portfolioConstants'; // Options for the 'type' filter.

/**
 * @component ChangeFilters
 * @description A component that provides UI elements for filtering a list of planned financial changes.
 * It allows users to filter by change type, a date range (start and end dates), and a textual search
 * on the change description. The component is controlled, receiving filter values and an onChange handler
 * from its parent.
 *
 * @example
 * const [filters, setFilters] = useState({ type: '', startDate: '', endDate: '', description: '' });
 * const handleFilterChange = (e) => {
 *   setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
 * };
 * <ChangeFilters filters={filters} onFilterChange={handleFilterChange} />
 *
 * @param {object} props - The component's props.
 * @param {object} props.filters - An object containing the current filter values.
 *                                 Expected shape: `{ type: string, startDate: string, endDate: string, description: string }`. Required.
 * @param {Function} props.onFilterChange - Callback function invoked when any filter input value changes.
 *                                          Receives the standard input change event `e`. Required.
 *
 * @returns {JSX.Element} The rendered filter input fields group.
 */
const ChangeFilters = ({ filters, onFilterChange }) => {
  // Transform `CHANGE_TYPES` constant into the format expected by the `Select` component
  // (an array of objects with `value` and `label` properties).
  const typeOptions = CHANGE_TYPES.map(ct => ({ value: ct.value, label: ct.label }));

  return (
    // Main container for the filter section with styling.
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
      {/* Section title. */}
      <h2 className="text-md font-semibold text-gray-700 mb-3">Filters</h2>
      {/* Grid layout for filter input fields, responsive to screen size. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Filter by Change Type: Uses a Select component. */}
        <Select
          label="Type"
          id="type-filter" // Unique ID for the select input.
          name="type" // Name attribute, used by onFilterChange to identify the changed filter.
          value={filters.type} // Controlled component: value from props.
          onChange={onFilterChange} // Callback for when the selection changes.
          options={typeOptions} // Options for the dropdown.
        />
        {/* Filter by Start Date: Uses an Input component of type "date". */}
        <div>
          <label
            htmlFor="start-date-filter" // Associates label with the input.
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date
          </label>
          <Input
            type="date"
            id="start-date-filter"
            name="startDate"
            value={filters.startDate}
            onChange={onFilterChange}
          />
        </div>
        {/* Filter by End Date: Uses an Input component of type "date". */}
        <div>
          <label
            htmlFor="end-date-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date
          </label>
          <Input
            type="date"
            id="end-date-filter"
            name="endDate"
            value={filters.endDate}
            onChange={onFilterChange}
          />
        </div>
        {/* Filter by Description: Uses an Input component of type "text". */}
        <div>
          <label
            htmlFor="description-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <Input
            type="text"
            id="description-filter"
            name="description"
            value={filters.description}
            onChange={onFilterChange}
            placeholder="Search description..." // User-friendly placeholder.
          />
        </div>
      </div>
    </div>
  );
};

// PropTypes for type-checking and component documentation.
ChangeFilters.propTypes = {
  /** 
   * An object representing the current state of all filters.
   * Each key corresponds to a filter (e.g., `type`, `startDate`).
   * Required.
   */
  filters: PropTypes.shape({
    /** Filter by the type of planned change (e.g., 'Contribution', 'Withdrawal'). Empty string for all types. */
    type: PropTypes.string,
    /** Filter for changes on or after this date (YYYY-MM-DD format). Empty string if not set. */
    startDate: PropTypes.string,
    /** Filter for changes on or before this date (YYYY-MM-DD format). Empty string if not set. */
    endDate: PropTypes.string,
    /** Text to search for within the change descriptions (case-insensitive partial match). Empty string if not set. */
    description: PropTypes.string,
  }).isRequired,
  /** 
   * Callback function that is triggered when the value of any filter input changes.
   * It receives the native event object from the input (`e`), allowing the parent
   * to update the filter state using `e.target.name` and `e.target.value`. Required.
   */
  onFilterChange: PropTypes.func.isRequired,
};

export default ChangeFilters;