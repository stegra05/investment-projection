import React, { useState, useEffect, useCallback } from 'react';
import { usePortfolio } from '../state/PortfolioContext';
import useProjectionTask from '../hooks/useProjectionTask';

// Placeholder imports - Replace with actual paths if different
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import ProjectionChart from '../components/ProjectionChart';
import ProjectionSummaryMetrics from '../components/ProjectionSummaryMetrics';
import ProjectionParamsForm from '../components/ProjectionParamsForm';

// Helper function to format date as YYYY-MM-DD
const formatDate = date => {
  return date.toISOString().split('T')[0];
};

// Calculate default dates
const today = new Date();
const defaultStartDate = formatDate(today);
const defaultProjectionHorizonYears = 2; // Default to 2 years
const defaultInitialValue = 1000;

function ProjectionPanel() {
  const { portfolioId } = usePortfolio();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [projectionHorizonYears, setProjectionHorizonYears] = useState(defaultProjectionHorizonYears);
  const [endDate, setEndDate] = useState(() => {
    const initialEndDate = new Date(defaultStartDate);
    initialEndDate.setFullYear(initialEndDate.getFullYear() + defaultProjectionHorizonYears);
    return formatDate(initialEndDate);
  });
  const [initialValue, setInitialValue] = useState(defaultInitialValue);

  const {
    projectionStatus,
    projectionResults,
    projectionError,
    startNewProjection,
    isProjectionRunning,
  } = useProjectionTask();

  // Effect to update end date when start date or horizon changes
  useEffect(() => {
    if (startDate && projectionHorizonYears > 0) {
      const newEndDate = new Date(startDate);
      newEndDate.setFullYear(newEndDate.getFullYear() + parseInt(projectionHorizonYears, 10));
      setEndDate(formatDate(newEndDate));
    }
  }, [startDate, projectionHorizonYears]);

  const getStatusMessage = () => {
    switch (projectionStatus) {
    case 'pending':
      return 'Preparing to start projection...';
    case 'submitted':
      return 'Projection task submitted, waiting for processing...';
    case 'processing':
      return 'Calculating projection...';
    case 'completed':
      return 'Projection completed successfully!';
    case 'error':
      return projectionError || 'An error occurred during projection.';
    default:
      return null;
    }
  };

  const handleRunProjection = useCallback(() => {
    startNewProjection(portfolioId, {
      start_date: startDate,
      end_date: endDate,
      initial_total_value: initialValue,
    });
  }, [portfolioId, startDate, endDate, initialValue, startNewProjection]);

  return (
    <div className="p-4 bg-white rounded shadow h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">Projection Setup</h2>

      {/* Projection Parameters Section - Replaced with ProjectionParamsForm component */}
      <ProjectionParamsForm
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        projectionHorizonYears={projectionHorizonYears}
        setProjectionHorizonYears={setProjectionHorizonYears}
        initialValue={initialValue}
        setInitialValue={setInitialValue}
        isProjectionRunning={isProjectionRunning}
      />

      {/* Status Message */}
      {getStatusMessage() && (
        <div
          className={`my-4 p-3 rounded ${
            projectionStatus === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          {getStatusMessage()}
        </div>
      )}

      {/* Chart Area & Summary */}
      <div className="flex-grow flex flex-col bg-gray-50 rounded border border-gray-200 mb-4 min-h-0">
        <div className="flex-grow min-h-0">
          {projectionStatus === 'completed' && projectionResults && projectionResults.length > 0 ? (
            <ProjectionChart data={projectionResults} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-gray-500">
                {isProjectionRunning
                  ? 'Calculating projection...'
                  : projectionStatus === 'error'
                  ? 'Failed to retrieve projection.'
                  : 'Run projection to see results'}
              </span>
            </div>
          )}
        </div>
        {projectionStatus === 'completed' && projectionResults && projectionResults.length > 1 && (
          <ProjectionSummaryMetrics data={projectionResults} />
        )}
      </div>

      {/* Run Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleRunProjection}
          disabled={isProjectionRunning}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isProjectionRunning ? 'Processing...' : 'Run Projection'}
        </Button>
      </div>
    </div>
  );
}

export default ProjectionPanel;
