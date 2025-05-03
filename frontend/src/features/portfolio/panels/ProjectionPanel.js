import React, { useState, useEffect, useCallback } from 'react';
import projectionService from '../../../api/projectionService';
import { usePortfolio } from '../state/PortfolioContext';

// Placeholder imports - Replace with actual paths if different
import Input from '../../../components/Input/Input'; 
import Button from '../../../components/Button/Button';
import ProjectionChart from '../components/ProjectionChart';

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
  const { portfolioId } = usePortfolio();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
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
      
      {/* Projection Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Input 
          name="startDate"
          label="Start Date"
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={isProjectionRunning}
        />
        <Input 
          name="endDate"
          label="End Date"
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={isProjectionRunning}
        />
        <Input 
          name="initialValue"
          label="Initial Total Value ($"
          id="initial-value"
          type="number"
          placeholder="e.g., 100000"
          value={initialValue}
          onChange={(e) => setInitialValue(e.target.value)}
          disabled={isProjectionRunning}
        />
      </div>

      {/* Status Message */}
      {getStatusMessage() && (
        <div className={`mb-4 p-3 rounded ${
          projectionStatus === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {getStatusMessage()}
        </div>
      )}

      {/* Chart Area */}
      <div className="flex-grow bg-gray-100 rounded border border-gray-200 mb-4">
        {projectionStatus === 'completed' && projectionResults && projectionResults.length > 0 ? (
          <ProjectionChart data={projectionResults} />
        ) : (
          <div className="h-64 flex items-center justify-center">
            <span className="text-gray-500">
              {isProjectionRunning ? 'Calculating projection...' : 'Run projection to see results'}
            </span>
          </div>
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