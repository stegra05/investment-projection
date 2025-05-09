import React, { useState, useEffect, useCallback } from 'react';
import projectionService from '../../../api/projectionService';
import { usePortfolio } from '../state/PortfolioContext';

// Placeholder imports - Replace with actual paths if different
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import ProjectionChart from '../components/ProjectionChart';
import ProjectionSummaryMetrics from '../components/ProjectionSummaryMetrics';

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

  // Projection task tracking
  const [projectionTaskId, setProjectionTaskId] = useState(null);
  const [projectionStatus, setProjectionStatus] = useState('idle');
  const [projectionResults, setProjectionResults] = useState(null);
  const [projectionError, setProjectionError] = useState(null);
  const [pollingIntervalId, setPollingIntervalId] = useState(null);

  // Effect for polling task status
  useEffect(() => {
    if (!projectionTaskId) return;

    let isMounted = true;
    let timeoutId = null;

    const checkStatus = async () => {
      if (!isMounted) return;

      try {
        const status = await projectionService.getProjectionTaskStatus(projectionTaskId);

        if (!isMounted) return;

        switch (status.status) {
        case 'COMPLETED':
          setProjectionStatus('completed');
          if (status.result?.data) {
            console.log('Raw projection results:', status.result);
            const chartData = Object.entries(status.result.data).map(([date, value]) => ({
              date,
              value: Number(value),
            }));
            console.log('Transformed chart data:', chartData);
            setProjectionResults(chartData);
          } else {
            console.warn('No data in projection results:', status.result);
            setProjectionResults([]);
          }
          break;
        case 'FAILED':
          setProjectionStatus('error');
          setProjectionError(status.error || 'Projection calculation failed');
          break;
        case 'PROCESSING':
          setProjectionStatus('processing');
          timeoutId = setTimeout(checkStatus, 5000);
          break;
        case 'PENDING':
          setProjectionStatus('pending');
          timeoutId = setTimeout(checkStatus, 5000);
          break;
        default:
          setProjectionStatus('error');
          setProjectionError('Unknown task status');
        }
      } catch (error) {
        if (!isMounted) return;

        console.error('Error checking task status:', error);
        if (error.response?.status === 429) {
          // If rate limited, wait longer before retrying
          timeoutId = setTimeout(checkStatus, 10000);
        } else {
          setProjectionStatus('error');
          setProjectionError(error.message || 'Error checking task status');
        }
      }
    };

    // Initial check
    checkStatus();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [projectionTaskId]);

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
      return 'Projection task submitted...';
    case 'processing':
      return 'Calculating projection...';
    case 'completed':
      return 'Projection completed successfully!';
    case 'error':
      return projectionError || 'An error occurred during projection';
    default:
      return null;
    }
  };

  const isProjectionRunning = ['pending', 'submitted', 'processing'].includes(projectionStatus);

  // Memoize runProjection with useCallback
  const runProjection = useCallback(async () => {
    // Reset state
    setProjectionStatus('pending');
    setProjectionTaskId(null);
    setProjectionResults(null);
    setProjectionError(null);

    // Clear any existing polling
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }

    try {
      const taskId = await projectionService.startProjection(portfolioId, {
        start_date: startDate,
        end_date: endDate,
        initial_total_value: initialValue,
      });

      setProjectionTaskId(taskId);
      setProjectionStatus('submitted');
    } catch (error) {
      setProjectionError(error.message || 'Failed to start projection');
      setProjectionStatus('error');
    }
  }, [portfolioId, startDate, endDate, initialValue, pollingIntervalId]);

  return (
    <div className="p-4 bg-white rounded shadow h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">Projection Setup</h2>

      {/* Projection Parameters Section */}
      <div className="space-y-6"> {/* Increased spacing for visual separation of groups */}
        
        {/* Row 1: Start Date, End Date, Horizon Years */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            name="startDate"
            label="Start Date"
            id="start-date"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            disabled={isProjectionRunning}
          />
          <Input
            name="endDate"
            label="End Date"
            id="end-date"
            type="date"
            value={endDate}
            // onChange is removed as it's readOnly and derived
            disabled={isProjectionRunning}
            readOnly 
          />
          <Input
            name="projectionHorizonYears"
            label="Projection Horizon (Years)"
            id="projection-horizon"
            type="number"
            placeholder="e.g., 10"
            value={projectionHorizonYears}
            onChange={e => {
              const val = e.target.value;
              if (val === '' || (parseInt(val, 10) > 0 && !val.includes('.'))) {
                setProjectionHorizonYears(val === '' ? '' : parseInt(val, 10));
              } else if (parseInt(val, 10) <= 0 && val !== '') {
                setProjectionHorizonYears(1); // Default to 1 if invalid non-empty value
              }
            }}
            min="1"
            disabled={isProjectionRunning}
          />
        </div>

        {/* Row 2: Quick Select Buttons & Initial Value Input */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          {/* Group for Quick Select Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700 mr-2 md:hidden">Set Horizon:</span> {/* Label for small screens */}
            {[1, 2, 5, 10, 15, 20, 30].map(years => (
              <Button
                key={years}
                onClick={() => setProjectionHorizonYears(years)}
                disabled={isProjectionRunning}
                className={`py-1 px-3 border border-gray-300 rounded-md text-sm font-medium 
                            text-gray-700 hover:bg-gray-100 hover:border-gray-400
                            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 
                            focus:border-primary-500
                            disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150
                            ${parseInt(projectionHorizonYears, 10) === years ? 'bg-primary-100 border-primary-300 text-primary-700' : 'bg-white'}`}
              >
                {years}Y
              </Button>
            ))}
          </div>

          {/* Group for Initial Value Input */}
          <div className="w-full md:w-auto md:max-w-xs">
            <Input
              name="initialValue"
              label="Initial Total Value ($)"
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

      {/* Status Message */}
      {getStatusMessage() && (
        <div
          className={`mb-4 p-3 rounded ${
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
          onClick={runProjection}
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
