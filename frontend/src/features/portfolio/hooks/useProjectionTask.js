import { useState, useEffect, useCallback } from 'react';
import projectionService from '../../../api/projectionService';

// Helper function to format chart data - can be co-located or imported if used elsewhere
const transformProjectionData = (rawData) => {
  if (!rawData || typeof rawData !== 'object') {
    console.warn('No data or invalid format in projection results:', rawData);
    return [];
  }
  return Object.entries(rawData).map(([date, value]) => ({
    date,
    value: Number(value),
  }));
};

function useProjectionTask() {
  const [projectionTaskId, setProjectionTaskId] = useState(null);
  const [projectionStatus, setProjectionStatus] = useState('idle'); // idle, pending, submitted, processing, completed, error
  const [projectionResults, setProjectionResults] = useState(null);
  const [projectionError, setProjectionError] = useState(null);

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
              const chartData = transformProjectionData(status.result.data);
              setProjectionResults(chartData);
            } else {
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
          case 'PENDING': // Assuming PENDING is a valid status from backend before PROCESSING
            setProjectionStatus('pending');
            timeoutId = setTimeout(checkStatus, 5000);
            break;
          default:
            setProjectionStatus('error');
            setProjectionError('Unknown task status: ' + status.status);
        }
      } catch (error) {
        if (!isMounted) return;

        console.error('Error checking task status:', error);
        if (error.response?.status === 429) {
          timeoutId = setTimeout(checkStatus, 10000); // Longer delay for rate limiting
        } else {
          setProjectionStatus('error');
          setProjectionError(error.message || 'Error checking task status');
        }
      }
    };

    if (projectionStatus === 'submitted' || projectionStatus === 'processing' || projectionStatus === 'pending') {
        checkStatus(); // Initial check if task was just submitted or is still processing/pending
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectionTaskId, projectionStatus]); // Add projectionStatus to allow re-triggering based on it if needed

  const startNewProjection = useCallback(async (portfolioId, params) => {
    // Reset state for a new projection
    setProjectionStatus('pending');
    setProjectionTaskId(null); // Clear previous task ID immediately
    setProjectionResults(null);
    setProjectionError(null);

    try {
      const taskId = await projectionService.startProjection(portfolioId, params);
      setProjectionTaskId(taskId); // Set new task ID
      setProjectionStatus('submitted'); // Update status to submitted
    } catch (error) {
      console.error('Failed to start projection:', error);
      setProjectionError(error.message || 'Failed to start projection task');
      setProjectionStatus('error');
    }
  }, []); // No dependencies needed for useCallback as it calls setters which are stable

  const isProjectionRunning = ['pending', 'submitted', 'processing'].includes(projectionStatus);

  return {
    projectionStatus,
    projectionResults,
    projectionError,
    startNewProjection,
    isProjectionRunning,
    projectionTaskId, // Exposing for potential debugging or advanced use cases
  };
}

export default useProjectionTask; 