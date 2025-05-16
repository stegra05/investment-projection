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
  projectionHorizonError,
  setProjectionHorizonError,
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
            const inputValue = e.target.value;
            setProjectionHorizonYears(inputValue);

            if (inputValue === '') {
              setProjectionHorizonError('Horizon (years) is required.');
              return;
            }

            const num = Number(inputValue);

            if (!Number.isInteger(num)) {
              setProjectionHorizonError('Horizon must be a whole number (e.g., 10).');
            } else if (num < 1) {
              setProjectionHorizonError('Horizon must be at least 1 year.');
            } else if (num > 100) {
              setProjectionHorizonError('Horizon cannot exceed 100 years.');
            }
            else {
              setProjectionHorizonError('');
            }
          }}
          min="1"
          disabled={isProjectionRunning}
        />
        {projectionHorizonError && (
          <p className="mt-1 text-xs text-red-600">{projectionHorizonError}</p>
        )}
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
              variant="outline-select"
              size="small"
              isActive={parseInt(projectionHorizonYears, 10) === years}
            >
              {years}Y
            </Button>
          ))}
        </div>

        {/* Group for Initial Value Input */}
        <div className="w-full md:w-auto md:max-w-xs">
          <Input
            name="initialValue"
            label="Initial Value ($)"
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
  projectionHorizonError: PropTypes.string,
  setProjectionHorizonError: PropTypes.func.isRequired,
  initialValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setInitialValue: PropTypes.func.isRequired,
  isProjectionRunning: PropTypes.bool.isRequired,
};

export default ProjectionParamsForm; 