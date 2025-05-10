import React from 'react';
import Input from '../../../components/Input/Input'; // Assuming Input is a shared component
import { CHANGE_TYPES } from '../../../constants/portfolioConstants'; // Assuming this path is correct

const ChangeFilters = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
      <h2 className="text-md font-semibold text-gray-700 mb-3">Filters</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            id="type-filter"
            name="type"
            value={filters.type}
            onChange={onFilterChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 h-10 border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm bg-white"
          >
            {CHANGE_TYPES.map(typeOpt => (
              <option key={typeOpt.value} value={typeOpt.value}>
                {typeOpt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="start-date-filter"
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
            placeholder="Search description..."
          />
        </div>
      </div>
    </div>
  );
};

export default ChangeFilters; 