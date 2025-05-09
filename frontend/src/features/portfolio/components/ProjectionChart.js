import React from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const ProjectionChart = ({ data }) => {
  if (!data || !data.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No projection data available</p>
      </div>
    );
  }

  const chartData = data.map(item => ({
    date: item.date,
    value: Number(item.value),
  }));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={date => new Date(date).toLocaleDateString()} />
          <YAxis tickFormatter={value => `$${value.toLocaleString()}`} />
          <Tooltip
            formatter={value => [`$${value.toLocaleString()}`, 'Portfolio Value']}
            labelFormatter={date => new Date(date).toLocaleDateString()}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="Portfolio Value"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

ProjectionChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
};

export default ProjectionChart;
