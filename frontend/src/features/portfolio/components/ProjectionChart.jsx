import React from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,        // The main chart component.
  Line,             // Component to render lines.
  XAxis,            // X-axis component.
  YAxis,            // Y-axis component.
  CartesianGrid,    // Component for rendering grid lines.
  Tooltip,          // Component for displaying tooltips on hover.
  Legend,           // Component for displaying the chart legend.
  ResponsiveContainer, // Component to make the chart responsive to its parent container size.
} from 'recharts'; // Import necessary components from the Recharts library.

/**
 * @component ProjectionChart
 * @description Renders a line chart to visualize portfolio projection data over time.
 * It uses the Recharts library for charting capabilities. The chart displays portfolio
 * value against dates and includes features like a grid, formatted axes, a tooltip for
 * detailed information on hover, and a legend. It also handles an empty state if no
 * projection data is provided.
 *
 * @example
 * const projectionData = [
 *   { date: '2024-01-01', value: 10000 },
 *   { date: '2024-02-01', value: 10200 },
 *   // ... more data points
 * ];
 * <ProjectionChart data={projectionData} />
 *
 * @param {object} props - The component's props.
 * @param {Array<object>} [props.data] - An array of data points for the chart.
 *                                       Each object should have a `date` (string) and `value` (number).
 *                                       If undefined, null, or empty, an empty state message is displayed.
 *
 * @returns {JSX.Element} The rendered line chart or an empty state message.
 */
const ProjectionChart = ({ data }) => {
  // If no data is provided or the data array is empty, render a placeholder message.
  if (!data || !data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No projection data available to display.</p>
      </div>
    );
  }

  // Transform the input `data` for Recharts:
  // - Ensure `value` is explicitly a number.
  // - `date` is expected to be a string that can be parsed by `new Date()`.
  const chartData = data.map(item => ({
    date: item.date, // Assumes date is a string like 'YYYY-MM-DD'.
    value: Number(item.value), // Convert value to a number just in case it's a string.
  }));

  return (
    // Container div to control the chart's dimensions.
    // `w-full h-full` makes it take the full width and height of its parent.
    // A fixed height (e.g., `h-96`) might be preferred depending on layout.
    <div className="w-full h-full min-h-[300px]"> {/* Added min-h for better default rendering */}
      {/* ResponsiveContainer makes the chart adapt to the size of its parent container. */}
      <ResponsiveContainer>
        <LineChart
          data={chartData} // The processed data for the chart.
          // Margins around the chart plotting area.
          margin={{
            top: 5,    // Space above the chart.
            right: 30, // Space to the right (for labels, etc.).
            left: 20,  // Space to the left (for Y-axis labels).
            bottom: 5, // Space below the chart.
          }}
        >
          {/* CartesianGrid adds a grid to the chart background for better readability. */}
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" /> {/* Light gray dashed grid lines */}
          
          {/* XAxis configuration. */}
          <XAxis 
            dataKey="date" // Key from `chartData` to use for X-axis values.
            // Formats the tick labels on the X-axis (dates).
            tickFormatter={date => new Date(date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} 
            dy={5} // Offset Y position of ticks slightly for better spacing
            tick={{ fontSize: 12, fill: '#6b7280' }} // Style X-axis ticks
          />
          
          {/* YAxis configuration. */}
          <YAxis 
            // Formats the tick labels on the Y-axis (currency values).
            tickFormatter={value => `$${value.toLocaleString()}`} 
            width={80} // Adjust width to accommodate longer formatted numbers
            tick={{ fontSize: 12, fill: '#6b7280' }} // Style Y-axis ticks
          />
          
          {/* Tooltip configuration: Appears when hovering over chart points. */}
          <Tooltip
            // Formats the value displayed in the tooltip.
            formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
            // Formats the label (date) displayed at the top of the tooltip.
            labelFormatter={date => new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
            itemStyle={{ color: '#2563eb' }}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
          />
          
          {/* Legend configuration: Displays the name of each line in the chart. */}
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          {/* Line configuration for the "Portfolio Value". */}
          <Line
            type="monotone" // Type of line (e.g., 'linear', 'monotone' for smooth curves).
            dataKey="value" // Key from `chartData` to use for line values.
            stroke="#2563eb" // Color of the line (a shade of blue).
            strokeWidth={2}  // Thickness of the line.
            dot={false}      // Hides data points on the line for a cleaner look.
            name="Portfolio Value" // Name displayed in the Legend and Tooltip.
            activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} // Style of the active dot on hover
          />
          {/* Additional <Line /> components can be added here for comparing multiple series. */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// PropTypes for type-checking and component documentation.
ProjectionChart.propTypes = {
  /**
   * An array of data points to be plotted on the chart.
   * Each object in the array should represent a point in time and include a `date` (string, e.g., 'YYYY-MM-DD')
   * and a `value` (number) representing the portfolio value at that date.
   * If the array is empty or not provided, a message indicating "No projection data available" is displayed.
   */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      /** The date for the data point, typically in 'YYYY-MM-DD' or a similarly parsable format. */
      date: PropTypes.string.isRequired,
      /** The numerical value associated with the date (e.g., portfolio monetary value). */
      value: PropTypes.number.isRequired,
    })
  ),
  // Note: No defaultProps for `data` as the component handles undefined/empty data internally.
};

export default ProjectionChart;
