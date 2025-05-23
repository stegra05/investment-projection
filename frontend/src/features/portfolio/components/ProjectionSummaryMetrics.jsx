import React from 'react';
import PropTypes from 'prop-types';

/**
 * Helper function to format a numerical value as currency.
 * Defaults to USD, but could be made more flexible if needed.
 * @param {number|null|undefined} value - The numerical value to format.
 * @returns {string} The formatted currency string (e.g., "$1,234.56") or '-' if value is null/undefined.
 */
const formatCurrency = value => {
  if (value === null || value === undefined) return '-'; // Return a dash for undefined or null values.
  // Formats the number as USD currency.
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

/**
 * Helper function to format a numerical value as a percentage string.
 * @param {number|null|undefined} value - The numerical value to format (e.g., 25.5 for 25.5%).
 * @returns {string} The formatted percentage string (e.g., "25.50%") or '-' if value is null, undefined, or not finite.
 */
const formatPercentage = value => {
  // Check for null, undefined, or non-finite numbers (like Infinity, NaN).
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  // Formats the number to two decimal places and appends '%'.
  return `${value.toFixed(2)}%`;
};

/**
 * @component MetricDisplay
 * @description A simple presentational component to display a label and its corresponding value.
 * Used internally by `ProjectionSummaryMetrics` for consistent styling of each metric.
 *
 * @param {object} props - The component's props.
 * @param {string} props.label - The label for the metric (e.g., "Start Value").
 * @param {string} props.value - The formatted value of the metric to display.
 * @param {string} [props.className=''] - Optional additional CSS classes for the value element, e.g., for text color.
 * @returns {JSX.Element} A div containing the label and value.
 */
const MetricDisplay = ({ label, value, className = '' }) => (
  <div className={`text-sm ${className}`}> {/* Apply additional classes to the main div for the metric value */}
    <span className="block text-gray-500">{label}</span> {/* Metric label */}
    <span className={`block font-medium ${className || 'text-gray-800'}`}>{value}</span> {/* Metric value with optional class */}
  </div>
);

// PropTypes for the MetricDisplay sub-component.
MetricDisplay.propTypes = {
  /** The descriptive label for the metric being displayed. */
  label: PropTypes.string.isRequired,
  /** The pre-formatted string value of the metric. */
  value: PropTypes.string.isRequired,
  /** Optional CSS classes to apply to the metric value, useful for color-coding (e.g., green for positive growth). */
  className: PropTypes.string,
};

/**
 * @component ProjectionSummaryMetrics
 * @description Displays key summary metrics derived from portfolio projection data.
 * These metrics include starting value, ending value, total growth in currency,
 * and total growth as a percentage. It requires at least two data points (start and end)
 * to calculate meaningful metrics. Uses helper functions for formatting values.
 *
 * @example
 * const projectionData = [ { date: '2024-01-01', value: 1000 }, { date: '2025-01-01', value: 1200 } ];
 * <ProjectionSummaryMetrics data={projectionData} />
 *
 * @param {object} props - The component's props.
 * @param {Array<object>} [props.data] - An array of projection data points. Each object should have
 *                                       `date` (string) and `value` (number). If undefined, null,
 *                                       or has fewer than 2 items, the component renders null.
 *
 * @returns {JSX.Element|null} The rendered summary metrics or null if data is insufficient.
 */
const ProjectionSummaryMetrics = ({ data }) => {
  // If data is not provided or has fewer than two points, meaningful comparison is not possible.
  if (!data || data.length < 2) {
    return null; // Or return a placeholder indicating insufficient data.
  }

  // Extract the first and last data points for comparison.
  const startPoint = data[0];
  const endPoint = data[data.length - 1];

  // Get the values from the start and end points.
  const startValue = startPoint?.value; // Optional chaining in case point itself is null/undefined (though unlikely with above check).
  const endValue = endPoint?.value;

  // Initialize metrics to null. They will be calculated if start and end values are valid.
  let totalGrowth = null;
  let totalGrowthPercent = null;

  // Calculate total growth and percentage growth if start and end values are valid numbers.
  if (
    startValue !== null && startValue !== undefined && Number.isFinite(startValue) &&
    endValue !== null && endValue !== undefined && Number.isFinite(endValue)
  ) {
    totalGrowth = endValue - startValue; // Calculate absolute growth.
    if (startValue !== 0) {
      // Calculate percentage growth relative to the start value.
      totalGrowthPercent = (totalGrowth / startValue) * 100;
    } else if (endValue > 0) {
      // If start value is 0 and end value is positive, growth is effectively infinite.
      totalGrowthPercent = Infinity; 
    } // If startValue is 0 and endValue is also 0 (or negative), totalGrowthPercent remains null (or could be set to 0 or NaN as appropriate).
  }

  // Determine the text color for growth metrics based on whether growth is positive, negative, or neutral.
  let growthColor = 'text-gray-800'; // Default color for neutral or N/A growth.
  if (totalGrowth !== null && totalGrowth > 0) {
    growthColor = 'text-green-600'; // Green for positive growth.
  } else if (totalGrowth !== null && totalGrowth < 0) {
    growthColor = 'text-red-600'; // Red for negative growth.
  }

  return (
    // Main container for the metrics, styled with a top border, padding, and grid layout.
    <div className="mt-4 p-3 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Display Start Value */}
      <MetricDisplay label="Start Value" value={formatCurrency(startValue)} />
      {/* Display End Value */}
      <MetricDisplay label="End Value" value={formatCurrency(endValue)} />
      {/* Display Total Growth (currency), with color indicating positive/negative. */}
      <MetricDisplay
        label="Total Growth"
        value={formatCurrency(totalGrowth)}
        className={growthColor}
      />
      {/* Display Growth Percentage, with color indicating positive/negative. */}
      <MetricDisplay
        label="Growth (%)" // Removed trailing space for consistency
        value={formatPercentage(totalGrowthPercent)}
        className={growthColor}
      />
      {/* Optional: Placeholder comments for displaying start and end dates if needed in the future. */}
      {/* <MetricDisplay label="Start Date" value={startPoint?.date ? new Date(startPoint.date).toLocaleDateString() : '-'} /> */}
      {/* <MetricDisplay label="End Date" value={endPoint?.date ? new Date(endPoint.date).toLocaleDateString() : '-'} /> */}
    </div>
  );
};

// PropTypes for type-checking and component documentation for ProjectionSummaryMetrics.
ProjectionSummaryMetrics.propTypes = {
  /**
   * An array of data points from the projection. Each object should contain:
   * - `date` (string): The date of the data point (e.g., 'YYYY-MM-DD').
   * - `value` (number): The projected portfolio value at that date.
   * The component requires at least two data points (start and end) to calculate and display metrics.
   * If not provided or insufficient, it renders `null`.
   */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      /** The date for the data point, expected in a format parsable by `new Date()`. */
      date: PropTypes.string.isRequired,
      /** The numerical value of the portfolio at this date. */
      value: PropTypes.number.isRequired,
    })
  ),
  // Note: No defaultProps for `data` as the component handles its absence by rendering null.
};

export default ProjectionSummaryMetrics;
