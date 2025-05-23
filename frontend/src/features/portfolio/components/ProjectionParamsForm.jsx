import React from 'react';
import PropTypes from 'prop-types';
import Input from '../../../components/Input/Input'; // Reusable Input component.
import Button from '../../../components/Button/Button'; // Reusable Button component.

/**
 * @component ProjectionParamsForm
 * @description A form component for inputting parameters for portfolio projections.
 * It includes fields for start date, end date (read-only, typically derived by the parent),
 * projection horizon in years (with validation and quick-select buttons), and initial portfolio value.
 * This component is fully controlled, relying on props for current values and setter functions.
 * All fields are disabled when `isProjectionRunning` is true.
 *
 * @example
 * const [params, setParams] = useState({ startDate: '2024-01-01', endDate: '2034-01-01', horizon: 10, initialValue: 10000 });
 * const [horizonError, setHorizonError] = useState('');
 * // ... logic to derive endDate based on startDate and horizon
 * <ProjectionParamsForm
 *   startDate={params.startDate}
 *   setStartDate={(val) => setParams(p => ({...p, startDate: val}))}
 *   endDate={params.endDate} // Read-only, derived in parent
 *   projectionHorizonYears={params.horizon}
 *   setProjectionHorizonYears={(val) => setParams(p => ({...p, horizon: val}))}
 *   projectionHorizonError={horizonError}
 *   setProjectionHorizonError={setHorizonError}
 *   initialValue={params.initialValue}
 *   setInitialValue={(val) => setParams(p => ({...p, initialValue: val}))}
 *   isProjectionRunning={false}
 * />
 *
 * @param {object} props - The component's props.
 * @param {string} props.startDate - Current start date for the projection (YYYY-MM-DD). Required.
 * @param {Function} props.setStartDate - Callback to update the start date. Required.
 * @param {string} props.endDate - Current end date for the projection (YYYY-MM-DD), typically read-only and derived. Required.
 * @param {string|number} props.projectionHorizonYears - Current projection horizon in years. Required.
 * @param {Function} props.setProjectionHorizonYears - Callback to update the projection horizon. Required.
 * @param {string|null} props.projectionHorizonError - Error message for the projection horizon input, if any.
 * @param {Function} props.setProjectionHorizonError - Callback to set/clear the projection horizon error message. Required.
 * @param {string|number} props.initialValue - Current initial value for the portfolio projection. Required.
 * @param {Function} props.setInitialValue - Callback to update the initial value. Required.
 * @param {boolean} props.isProjectionRunning - If true, all form inputs are disabled. Required.
 *
 * @returns {JSX.Element} The rendered form for projection parameters.
 */
function ProjectionParamsForm({
  startDate,
  setStartDate,
  endDate, // Typically derived in parent based on startDate and projectionHorizonYears
  projectionHorizonYears,
  setProjectionHorizonYears,
  projectionHorizonError,
  setProjectionHorizonError,
  initialValue,
  setInitialValue,
  isProjectionRunning, // Disables inputs when a projection is active.
}) {
  return (
    // Main container with vertical spacing for groups of inputs.
    <div className="space-y-6">
      {/* Row 1: Contains Start Date, End Date, and Projection Horizon (Years) inputs. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Start Date Input */}
        <Input
          name="startDate"
          label="Start Date"
          id="start-date"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          disabled={isProjectionRunning}
        />
        {/* End Date Input (Read-Only) */}
        <Input
          name="endDate"
          label="End Date"
          id="end-date"
          type="date"
          value={endDate}
          // onChange is omitted as this field is intended to be read-only and derived by the parent component.
          disabled={isProjectionRunning}
          readOnly // Makes the input field not editable by the user.
        />
        {/* Projection Horizon (Years) Input with inline validation. */}
        <div> {/* Wrapper to keep error message with input */}
          <Input
            name="projectionHorizonYears"
            label="Projection Horizon (Years)"
            id="projection-horizon"
            type="number" // Allows numeric input, but value is stored as string by HTML input.
            placeholder="e.g., 10"
            value={projectionHorizonYears}
            onChange={e => {
              const inputValue = e.target.value;
              setProjectionHorizonYears(inputValue); // Update state with raw input value.

              // Inline validation logic for projection horizon.
              if (inputValue === '') {
                setProjectionHorizonError('Horizon (years) is required.');
                return; // Exit early if empty.
              }
              const num = Number(inputValue); // Convert to number for validation.
              if (!Number.isInteger(num)) {
                setProjectionHorizonError('Horizon must be a whole number (e.g., 10).');
              } else if (num < 1) {
                setProjectionHorizonError('Horizon must be at least 1 year.');
              } else if (num > 100) { // Example upper limit.
                setProjectionHorizonError('Horizon cannot exceed 100 years.');
              }
              else {
                setProjectionHorizonError(''); // Clear error if valid.
              }
            }}
            min="1" // HTML5 min attribute.
            disabled={isProjectionRunning}
          />
          {/* Display validation error message for projection horizon if it exists. */}
          {projectionHorizonError && (
            <p className="mt-1 text-xs text-red-600">{projectionHorizonError}</p>
          )}
        </div>
      </div>

      {/* Row 2: Contains Quick Select Buttons for horizon and Initial Value input. */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        {/* Group for Quick Select Buttons for Projection Horizon. */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Label for quick select buttons, visible on smaller screens. */}
          <span className="text-sm font-medium text-gray-700 mr-2 md:hidden">Set Horizon:</span>
          {/* Map over predefined year values to create quick select buttons. */}
          {[1, 2, 5, 10, 15, 20, 30].map(years => (
            <Button
              key={years}
              onClick={() => setProjectionHorizonYears(years)} // Sets horizon to the button's year value.
              disabled={isProjectionRunning}
              variant="outline-select" // Specific visual variant for selectable buttons.
              size="small" // Smaller button size.
              // Button is active if its year value matches the current projectionHorizonYears.
              isActive={parseInt(projectionHorizonYears, 10) === years}
            >
              {years}Y {/* Display text like "5Y", "10Y". */}
            </Button>
          ))}
        </div>

        {/* Group for Initial Value Input. */}
        <div className="w-full md:w-auto md:max-w-xs"> {/* Styling for width control. */}
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

// PropTypes for type-checking and component documentation.
ProjectionParamsForm.propTypes = {
  /** Current start date for the projection, in 'YYYY-MM-DD' format. Required. */
  startDate: PropTypes.string.isRequired,
  /** Callback function to update the start date state. Receives the new date string. Required. */
  setStartDate: PropTypes.func.isRequired,
  /** Current end date for the projection, in 'YYYY-MM-DD' format. Typically derived and read-only. Required. */
  endDate: PropTypes.string.isRequired,
  /** Current projection horizon in years. Can be a string (from input) or number. Required. */
  projectionHorizonYears: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Callback function to update the projection horizon state. Receives the new horizon value. Required. */
  setProjectionHorizonYears: PropTypes.func.isRequired,
  /** Error message string related to projection horizon validation. `null` or empty if no error. */
  projectionHorizonError: PropTypes.string,
  /** Callback function to set or clear the projection horizon error message. Required. */
  setProjectionHorizonError: PropTypes.func.isRequired,
  /** Current initial value for the portfolio projection. Can be a string (from input) or number. Required. */
  initialValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Callback function to update the initial value state. Receives the new value. Required. */
  setInitialValue: PropTypes.func.isRequired,
  /** Boolean indicating if a projection calculation is currently running. Disables form inputs if true. Required. */
  isProjectionRunning: PropTypes.bool.isRequired,
};

export default ProjectionParamsForm;