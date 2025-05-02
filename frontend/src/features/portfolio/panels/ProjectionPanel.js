import React, { useState, useEffect, useCallback } from 'react';

// Placeholder imports - Replace with actual paths if different
import Input from '../../../components/Input/Input'; 
import Button from '../../../components/Button/Button';

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Calculate default dates
const today = new Date();
const defaultStartDate = formatDate(today);
const futureDate = new Date(today);
futureDate.setFullYear(today.getFullYear() + 2);
const defaultEndDate = formatDate(futureDate);
const defaultInitialValue = 1000;

function ProjectionPanel() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [initialValue, setInitialValue] = useState(defaultInitialValue);

  // Memoize runProjection with useCallback
  const runProjection = useCallback(() => {
    // console.log('Running projection with parameters:', {
    //   startDate,
    //   endDate,
    //   initialValue,
    // });
    // TODO: Implement actual projection logic (e.g., API call)
  }, [startDate, endDate, initialValue]); // Dependencies for useCallback

  // Run projection on initial load and when parameters change
  useEffect(() => {
    runProjection();
    // Now include the memoized runProjection in the dependency array
  }, [runProjection]);

  return (
    <div className="p-4 bg-white rounded shadow h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">Projection Setup</h2>
      
      {/* Projection Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Input 
          label="Start Date"
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input 
          label="End Date"
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Input 
          label="Initial Total Value ($"
          id="initial-value"
          type="number" // Or text with validation
          placeholder="e.g., 100000"
          value={initialValue}
          onChange={(e) => setInitialValue(e.target.value)}
        />
      </div>

      {/* Chart Placeholder */}
      <div className="flex-grow bg-gray-100 h-64 rounded border border-gray-200 mb-4 flex items-center justify-center">
        <span className="text-gray-500">Projection Chart Area</span>
      </div>

      {/* Action Button */}
      <div className="mt-auto">
        <Button 
          variant="primary" 
          onClick={runProjection} // Trigger projection manually too
        >
          Run Projection
        </Button>
      </div>

    </div>
  );
}

export default ProjectionPanel; 