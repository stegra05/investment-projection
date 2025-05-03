import React from 'react';
import PropTypes from 'prop-types';

// Helper function to format currency
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Helper function to format percentage
const formatPercentage = (value) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return `${value.toFixed(2)}%`;
};

const MetricDisplay = ({ label, value, className = '' }) => (
  <div className={`text-sm ${className}`}>
    <span className="block text-gray-500">{label}</span>
    <span className="block font-medium text-gray-800">{value}</span>
  </div>
);

MetricDisplay.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
};

const ProjectionSummaryMetrics = ({ data }) => {
  if (!data || data.length < 2) {
    // Need at least two points (start and end) for meaningful comparison
    return null; 
  }

  const startPoint = data[0];
  const endPoint = data[data.length - 1];

  const startValue = startPoint?.value;
  const endValue = endPoint?.value;

  let totalGrowth = null;
  let totalGrowthPercent = null;

  if (startValue !== null && startValue !== undefined && endValue !== null && endValue !== undefined) {
    totalGrowth = endValue - startValue;
    if (startValue !== 0) {
      totalGrowthPercent = ((endValue / startValue) - 1) * 100;
    } else if (endValue > 0) {
      totalGrowthPercent = Infinity;
    } // else if endValue is also 0, percent growth is 0 (handled by null default)
  }
  
  // Determine if growth is positive, negative or neutral for styling
  let growthColor = 'text-gray-800'; // Default neutral
  if (totalGrowth > 0) {
    growthColor = 'text-green-600';
  } else if (totalGrowth < 0) {
    growthColor = 'text-red-600';
  }

  return (
    <div className="mt-4 p-3 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricDisplay 
        label="Start Value" 
        value={formatCurrency(startValue)} 
      />
      <MetricDisplay 
        label="End Value" 
        value={formatCurrency(endValue)} 
      />
      <MetricDisplay 
        label="Total Growth" 
        value={formatCurrency(totalGrowth)} 
        className={growthColor}
      />
      <MetricDisplay 
        label="Growth (%) " 
        value={formatPercentage(totalGrowthPercent)} 
        className={growthColor}
      />
      {/* Optionally add Start/End Date display if needed */}
      {/* <MetricDisplay label="Start Date" value={new Date(startPoint.date).toLocaleDateString()} /> */}
      {/* <MetricDisplay label="End Date" value={new Date(endPoint.date).toLocaleDateString()} /> */}
    </div>
  );
};

ProjectionSummaryMetrics.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
};

export default ProjectionSummaryMetrics; 