import React from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './PortfolioSummary.module.css';

// Helper function to format currency (can be moved to a shared util if used elsewhere)
const formatCurrency = (value) => {
  // Parse value if it's a string decimal representation
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue || 0);
};

// Define consistent colors for chart slices using CSS variables
// Ensure these colors provide good contrast and accessibility
const CHART_COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-accent-green)',
  '#FFAB00', // Example: Using a warning color for the 4th slice
  '#0065FF', // Example: Using an info color for the 5th slice
  // Add more distinct colors if needed, potentially defining them in variables.css
];

// Custom Tooltip for the Pie Chart
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Access the payload data directly
    const value = data.value;
    const name = data.name;
    const percentage = data.percentage; // Assuming percentage is calculated and added

    // Use theme variables for styling
    const uiBackgroundColor = 'var(--color-ui-background)';
    const borderColor = 'var(--color-border)';
    const textColorPrimary = 'var(--color-text-primary)';
    const textColorSecondary = 'var(--color-text-secondary)';

    return (
      <div className={styles.customTooltip} style={{
          backgroundColor: uiBackgroundColor,
          borderColor: borderColor,
      }}>
        <p className={styles.tooltipLabel} style={{ color: textColorSecondary }}>{name}</p>
        <p className={styles.tooltipValue} style={{ color: textColorPrimary }}>
            {formatCurrency(value)} ({percentage ? percentage.toFixed(1) : '0.0'}%)
        </p>
      </div>
    );
  }
  return null;
};


const PortfolioSummary = ({ assets = [], totalValue }) => {
  // Log the received assets prop for debugging
  console.log('Assets received in PortfolioSummary:', assets);
  console.log('Total Value received in PortfolioSummary:', totalValue);

  // 1. Calculate Total Value - REMOVED - Now passed as prop
  // const totalValueDisplay = 0; // Placeholder - needs actual total value later

  // 2. Prepare Data for Allocation Chart (using allocation_percentage)
  const allocationData = assets
    .map(asset => ({
        ...asset,
        // Parse allocation_percentage to number for chart value
        // Default to 0 if null, undefined, or not a valid number string
        numericPercentage: asset.allocation_percentage ? parseFloat(asset.allocation_percentage) : 0
    }))
    // Filter out assets with zero or invalid percentage
    .filter(asset => asset.numericPercentage && !isNaN(asset.numericPercentage) && asset.numericPercentage > 0)
    .map(asset => ({
      name: asset.name || 'Unnamed Asset',
      // Use the numeric percentage as the value for the pie slice size
      value: asset.numericPercentage,
      // Optional: Keep original percentage string for tooltip formatting if needed
      percentageString: asset.allocation_percentage 
  }));

  // Handle case with no valid allocation data
  const hasData = allocationData.length > 0;

  return (
    <section className={styles.summaryContainer}>
      <div className={styles.totalValueSection}>
        <h3 className={styles.totalValueLabel}>Total Portfolio Value</h3>
        {/* Use the totalValue prop */}
        <p className={styles.totalValueAmount}>{formatCurrency(totalValue)}</p>
      </div>
      <div className={styles.chartSection}>
        <h3 className={styles.chartLabel}>Asset Allocation</h3>
        {hasData ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                // label={renderCustomizedLabel} // Optional: Add labels directly on slices
                outerRadius={80}
                innerRadius={40} // Makes it a Donut chart
                fill="#8884d8"
                dataKey="value"
                nameKey="name" // Used by Tooltip
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              {/* <Legend /> // Optional: Add a legend */}
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.noDataText}>No valid asset allocation data available.</p>
        )}
      </div>
    </section>
  );
};

PortfolioSummary.propTypes = {
  // Expect totalValue, could be string (from JSON Decimal) or number
  totalValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  assets: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    assetType: PropTypes.string,
    // Expecting percentage string now, value is null
    allocation_percentage: PropTypes.string,
    allocation_value: PropTypes.string, // Keep as string|null if needed elsewhere, but not used for chart
    manual_expected_return: PropTypes.string, // Also likely string
  })),
};

export default PortfolioSummary; 