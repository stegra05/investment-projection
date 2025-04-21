import React, { useState, useEffect } from 'react';
import { runProjection } from '../services/projectionService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

// Import shared components
import Input from './Input';
import Button from './Button';

// Helper function to format currency
const formatCurrency = (value) => {
  // Basic currency formatting, adjust locale and options as needed
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Helper function to format date ticks (e.g., 'Jan 24')
const formatDateTick = (tickItem) => {
  try {
    return format(new Date(tickItem), 'MMM yy'); // Adjust format string as needed
  } catch (e) {
    return tickItem; // Fallback if date parsing fails
  }
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, data }) => {
  if (active && payload && payload.length) {
    const currentDate = new Date(label);
    const formattedDate = format(currentDate, 'MMM yyyy');
    const currentValue = payload[0].value;
    const formattedValue = formatCurrency(currentValue);

    // Find previous data point
    let previousValue = null;
    let valueChange = null;
    let changeFormatted = null;
    const currentIndex = data.findIndex(item => item.date === label);

    if (currentIndex > 0 && data[currentIndex - 1]) {
      previousValue = data[currentIndex - 1].value;
      valueChange = currentValue - previousValue;
      changeFormatted = formatCurrency(valueChange);
    }

    // Use theme variables for styling
    const textColorSecondary = 'var(--color-text-secondary)';
    const borderColor = 'var(--color-border)';
    const uiBackgroundColor = 'var(--color-ui-background)';
    const textColorPrimary = 'var(--color-text-primary)';
    const textColorPositive = 'var(--color-success-dark)'; // Assuming green for positive change
    const textColorNegative = 'var(--color-error-dark)'; // Assuming red for negative change

    return (
      <div style={{
        backgroundColor: uiBackgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        padding: 'var(--space-s)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Added subtle shadow
        fontSize: '0.875rem' // Consistent font size
      }}>
        <p style={{ color: textColorSecondary, marginBottom: 'var(--space-xs)', fontWeight: '500' }}>
          {formattedDate}
        </p>
        <p style={{ color: textColorPrimary, margin: 0, fontWeight: '600' }}>
          {`Value: ${formattedValue}`}
        </p>
        {valueChange !== null && (
          <p style={{
            color: valueChange >= 0 ? textColorPositive : textColorNegative,
            margin: 'var(--space-xxs) 0 0 0',
            fontSize: '0.75rem'
          }}>
            {`Change: ${valueChange >= 0 ? '+' : ''}${changeFormatted}`}
          </p>
        )}
      </div>
    );
  }

  return null;
};

/**
 * Component responsible for running portfolio projections and displaying the results in a line chart.
 *
 * Provides input fields for projection parameters (start date, end date, initial value).
 * Calls the `runProjection` service on button click and handles loading/error states.
 * Renders the projection data using `recharts` LineChart.
 *
 * @param {object} props - The component props.
 * @param {string|number} props.portfolioId - The ID of the portfolio for which to run the projection.
 * @param {number} [props.initialProjectionValue=0] - The initial total value passed from the parent page.
 * @param {Array<object>} [props.futureChanges=[]] - Array of planned future change objects (e.g., { date: 'YYYY-MM-DD', type: 'contribution', ... }).
 * @returns {JSX.Element} The ProjectionChart component.
 */
export default function ProjectionChart({ portfolioId, initialProjectionValue = 0, futureChanges = [] }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Input state for projection parameters
  const defaultStart = new Date().toISOString().slice(0, 10);
  const defaultEnd = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // State for the initial value input in *this* component
  const [initialValue, setInitialValue] = useState('');
  // Track if the user has manually changed the initial value input
  const [isInitialValueManuallySet, setIsInitialValueManuallySet] = useState(false);

  // Effect to set initial value from prop, but only if user hasn't edited it
  useEffect(() => {
    // Check if prop is valid and user hasn't touched the input
    const propValue = parseFloat(initialProjectionValue);
    if (!isInitialValueManuallySet && !isNaN(propValue) && propValue > 0) {
      setInitialValue(propValue.toFixed(2)); // Set state with formatting
    }
    // If prop becomes 0 or invalid after being set, and user hasn't edited, clear it
    else if (!isInitialValueManuallySet && (isNaN(propValue) || propValue <= 0)) {
        setInitialValue('');
    }
  }, [initialProjectionValue, isInitialValueManuallySet]);

  // Handle manual changes to the initial value input
  const handleInitialValueChange = (e) => {
    setInitialValue(e.target.value);
    setIsInitialValueManuallySet(true); // Mark as manually set
  };

  const handleRunProjection = async () => {
    setError('');
    setLoading(true);
    try {
      const params = {
        portfolioId,
        start_date: startDate,
        end_date: endDate,
        initial_total_value: initialValue,
      };
      const result = await runProjection(params);
      const projData = Array.isArray(result)
        ? result
        : result.projection_results || [];
      setData(projData);
    } catch (err) {
      console.error('Projection calculation failed:', err);
      const server = err.response?.data;
      const errorMsg = server
        ? server.error
          ? `${server.message}: ${server.error}`
          : server.message
        : 'Projection calculation failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- Style Variables ---
  // Retrieve CSS variables (consider a hook or context for better management)
  // For simplicity, we assume they are available globally or passed down
  // These might need dynamic fetching in a real app (e.g., getComputedStyle)
  const textColorSecondary = 'var(--color-text-secondary)';
  const borderColor = 'var(--color-border)';
  const uiBackgroundColor = 'var(--color-ui-background)';
  const accentColor = 'var(--color-primary)';
  const textColorPrimary = 'var(--color-text-primary)';

  return (
    <div style={{ marginTop: 'var(--space-m)' }}>
      {/* Chart Area or Placeholder */}
      <div style={{
        width: '100%',
        height: 350,
        display: 'flex',
        flexDirection: 'column', // Stack content vertically for error state
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: loading || error ? 'var(--color-app-background)' : 'transparent', // Use app background for loading/error
        border: loading || error ? `1px dashed ${borderColor}` : 'none', // Show border only for loading/error/initial
        borderRadius: '6px',
        marginBottom: 'var(--space-l)',
        color: textColorSecondary,
        textAlign: 'center', // Center text
        padding: 'var(--space-m)' // Add padding for content inside
      }}>
        {loading ? (
          <p>Loading chart...</p>
        ) : error ? (
          <>
            <p style={{ color: 'var(--color-error-dark)', marginBottom: 'var(--space-s)' }}>
              Error: {error}
            </p>
            <Button onClick={handleRunProjection} variant="secondary" size="small">
              Retry Projection
            </Button>
          </>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={borderColor}
              />
              <XAxis
                dataKey="date"
                stroke={textColorSecondary}
                tickFormatter={formatDateTick}
                fontSize="0.75rem"
                dy={5}
                minTickGap={40}
              />
              <YAxis
                stroke={textColorSecondary}
                tickFormatter={formatCurrency}
                fontSize="0.75rem"
                dx={-5}
                minTickGap={20}
              />
              <Tooltip
                content={<CustomTooltip data={data} />}
                cursor={{ stroke: accentColor, strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={accentColor}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 1, fill: accentColor }}
                activeDot={{ r: 5 }}
              />
              {futureChanges.map((change, index) => (
                <ReferenceLine
                  key={`ref-${index}-${change.date}`}
                  x={change.date}
                  stroke="var(--color-secondary)"
                  strokeDasharray="3 3"
                >
                  <ReferenceLine.Label
                    value={`${change.type === 'contribution' ? '+' : '-'}`}
                    position="insideTopRight"
                    fill="var(--color-secondary)"
                    fontSize="0.75rem"
                    dy={-10}
                  />
                </ReferenceLine>
              ))}
              {/* TODO: Add additional <Line> components here for other data series (e.g., contributions) if data is available */}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          // Initial placeholder state
          <p>Configure and run projection to view results.</p>
        )}
      </div>

      {/* Control Panel */}
      <div style={{
        border: `1px solid ${borderColor}`,
        borderRadius: '8px', // Slightly larger radius for panel
        padding: 'var(--space-l)', // More padding for the panel
        backgroundColor: uiBackgroundColor,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)' // Subtle shadow for panel
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--space-m)', fontSize: '1.25rem', color: textColorPrimary, borderBottom: `1px solid ${borderColor}`, paddingBottom: 'var(--space-s)' }}>
          Configure Projection
        </h3>

        {/* Input Row */}
        <div style={{ display: 'flex', gap: 'var(--space-m)', flexWrap: 'wrap', marginBottom: 'var(--space-m)' }}>
          <div style={{ flex: '1 1 150px' }}>
            <Input
              label="Start Date"
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <Input
              label="End Date"
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <Input
              label="Initial Total Value"
              id="initialValue"
              type="number"
              step="0.01"
              placeholder="e.g., 10000"
              value={initialValue}
              onChange={handleInitialValueChange}
            />
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleRunProjection}
          disabled={loading}
          variant="primary"
        >
          {loading ? 'Running...' : 'Run Projection'}
        </Button>
      </div>
    </div>
  );
} 