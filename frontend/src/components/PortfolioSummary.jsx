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
    const value = data.value; // This is now the numeric allocation_value
    const name = data.name;
    const percentage = data.percentage; // This is the calculated percentage

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
            {/* Display formatted value and the calculated percentage */}
            {formatCurrency(value)} ({percentage !== undefined ? percentage.toFixed(1) : 'N/A'}%)
        </p>
      </div>
    );
  }
  return null;
};


const PortfolioSummary = ({ assets = [], totalValue }) => {
  // Log the received assets prop for debugging
  // console.log('[PortfolioSummary] Received assets:', JSON.stringify(assets, null, 2));
  // console.log('[PortfolioSummary] Received totalValue:', totalValue);

  // 1. Use the passed totalValue prop (from manual input), ensuring it's a number
  const numericTotalValue = typeof totalValue === 'string' ? parseFloat(totalValue) : totalValue;
  const safeTotalValue = isNaN(numericTotalValue) || numericTotalValue < 0 ? 0 : numericTotalValue; // Ensure positive number
  // console.log('[PortfolioSummary] Safe Total Value for calculation:', safeTotalValue);

  // 2. Prepare Data for Allocation Chart (using totalValue and allocation_percentage)
  const allocationData = assets
    .map(asset => {
      // Get percentage
      const percentageString = asset.allocation_percentage;
      const numericPercentage = percentageString ? parseFloat(percentageString) : 0;
      const validPercentage = isNaN(numericPercentage) || numericPercentage < 0 ? 0 : numericPercentage;

      // Calculate the asset's value based on the total value and its percentage
      const calculatedValue = safeTotalValue * (validPercentage / 100);

      // console.log(`[PortfolioSummary] Asset: ${asset.name}, Percentage: ${validPercentage}%, Calculated Value: ${calculatedValue}`);

      return {
        name: asset.name || 'Unnamed Asset',
        value: calculatedValue, // Use the calculated value for slice size
        percentage: validPercentage, // Store the original valid percentage
      };
    })
    // Filter out assets with zero or invalid calculated value
    .filter(asset => asset.value > 0);

  // console.log('[PortfolioSummary] allocationData after initial map & filter:', JSON.stringify(allocationData, null, 2));

  // Recalculate total value based *only* on assets included in the chart
  // This ensures percentages in the tooltip make sense if some assets are filtered out
  const chartTotalValue = allocationData.reduce((sum, asset) => sum + asset.value, 0);
  // console.log('[PortfolioSummary] chartTotalValue (sum of filtered assets):', chartTotalValue);

  // Adjust percentages based on the chart's total value (for tooltip accuracy)
  const finalAllocationData = allocationData.map(asset => ({
    ...asset,
    percentage: chartTotalValue > 0 ? (asset.value / chartTotalValue) * 100 : 0,
  }));

  // console.log('[PortfolioSummary] finalAllocationData for chart:', JSON.stringify(finalAllocationData, null, 2));

  // Handle case with no valid allocation data
  const hasData = finalAllocationData.length > 0;
  // console.log('[PortfolioSummary] hasData:', hasData);

  return (
    <section className={styles.summaryContainer}>
      <div className={styles.totalValueSection}>
        <h3 className={styles.totalValueLabel}>Total Portfolio Value</h3>
        {/* Use the safeTotalValue */}
        <p className={styles.totalValueAmount}>{formatCurrency(safeTotalValue)}</p>
      </div>
      <div className={styles.chartSection}>
        <h3 className={styles.chartLabel}>Asset Allocation</h3>
        {hasData ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={finalAllocationData} // Use the final data with adjusted percentages
                cx="50%"
                cy="50%"
                labelLine={false}
                // label={renderCustomizedLabel} // Optional: Add labels directly on slices
                outerRadius={80}
                innerRadius={40} // Makes it a Donut chart
                fill="#8884d8"
                dataKey="value" // Slices are sized by the actual numeric value
                nameKey="name" // Used by Tooltip
              >
                {finalAllocationData.map((entry, index) => (
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
  totalValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, // Make totalValue required
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