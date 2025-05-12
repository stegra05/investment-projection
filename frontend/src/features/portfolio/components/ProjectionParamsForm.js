import React from 'react';
import PropTypes from 'prop-types';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';

function ProjectionParamsForm({
  startDate,
  setStartDate,
  endDate,
  projectionHorizonYears,
  setProjectionHorizonYears,
  initialValue,
  setInitialValue,
  isProjectionRunning,
}) {
  return (
    <div className="space-y-6"> {/* Increased spacing for visual separation of groups */}
      {/* Row 1: Start Date, End Date, Horizon Years */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          name="startDate"
          label="Start Date"
          id="start-date"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          disabled={isProjectionRunning}
        />
        <Input
          name="endDate"
          label="End Date"
          id="end-date"
          type="date"
          value={endDate}
          // onChange is removed as it's readOnly and derived
          disabled={isProjectionRunning}
          readOnly
        />
        <Input
          name="projectionHorizonYears"
          label="Projection Horizon (Years)"
          id="projection-horizon"
          type="number"
          placeholder="e.g., 10"
          value={projectionHorizonYears}
          onChange={e => {
            const val = e.target.value;
            if (val === '' || (parseInt(val, 10) > 0 && !val.includes('.'))) {
              setProjectionHorizonYears(val === '' ? '' : parseInt(val, 10));
            } else if (parseInt(val, 10) <= 0 && val !== '') {
              setProjectionHorizonYears(1); // Default to 1 if invalid non-empty value
            }
          }}
          min="1"
          disabled={isProjectionRunning}
        />
      </div>

      {/* Row 2: Quick Select Buttons & Initial Value Input */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        {/* Group for Quick Select Buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700 mr-2 md:hidden">Set Horizon:</span> {/* Label for small screens */}
          {[1, 2, 5, 10, 15, 20, 30].map(years => (
            <Button
              key={years}
              onClick={() => setProjectionHorizonYears(years)}
              disabled={isProjectionRunning}
              className={`py-1 px-3 border border-gray-300 rounded-md text-sm font-medium
                          text-gray-700 hover:bg-gray-100 hover:border-gray-400
                          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500
                          focus:border-primary-500
                          disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150
                          ${parseInt(projectionHorizonYears, 10) === years ? 'bg-primary-100 border-primary-300 text-primary-700' : 'bg-white'}`}
            >
              {years}Y
            </Button>
          ))}
        </div>

        {/* Group for Initial Value Input */}
        <div className="w-full md:w-auto md:max-w-xs">
          <Input
            name="initialValue"
            label="Initial Total Value ($)"
            id="initial-value"
            type="number"
            placeholder="e.g., 100000"
            value={initialValue}
            onChange={e => setInitialValue(e.target.value)}
            disabled={isProjectionRunning}
          />
        </div>
      </div>
    </div>
  );
}

ProjectionParamsForm.propTypes = {
  startDate: PropTypes.string.isRequired,
  setStartDate: PropTypes.func.isRequired,
  endDate: PropTypes.string.isRequired,
  projectionHorizonYears: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setProjectionHorizonYears: PropTypes.func.isRequired,
  initialValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setInitialValue: PropTypes.func.isRequired,
  isProjectionRunning: PropTypes.bool.isRequired,
};

export default ProjectionParamsForm; 