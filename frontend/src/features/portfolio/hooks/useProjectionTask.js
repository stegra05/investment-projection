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

  const checkStatus = useCallback(async (isMountedRef, currentTimeoutIdRef) => {
    if (!projectionTaskId) return;

    try {
      const statusData = await projectionService.getProjectionTaskStatus(projectionTaskId);

      if (!isMountedRef.current) return;

      const currentStatus = statusData.status.toLowerCase();

      // Only update if the status has actually changed or if it's an error that needs reporting
      if (currentStatus !== projectionStatus || (currentStatus === 'error' && projectionStatus !== 'error')) {
        switch (currentStatus) {
        case 'completed':
          setProjectionStatus('completed');
          if (statusData.result) {
            const chartData = transformProjectionData(statusData.result);
            setProjectionResults(chartData);
          } else {
            setProjectionResults([]);
          }
          setProjectionError(null);
          break;
        case 'failed': // Treat 'failed' as 'error'
          setProjectionStatus('error');
          setProjectionError(statusData.error || 'Projection calculation failed');
          setProjectionResults(null);
          break;
        case 'processing':
          setProjectionStatus('processing');
          // No need to set timeout here, useEffect will handle it
          break;
        case 'pending':
          setProjectionStatus('pending');
          // No need to set timeout here, useEffect will handle it
          break;
        default:
          setProjectionStatus('error');
          setProjectionError('Unknown task status: ' + statusData.status);
          setProjectionResults(null);
        }
      }
      // If still processing or pending, the useEffect will schedule the next check
    } catch (error) {
      if (!isMountedRef.current) return;

      console.error('Error checking task status:', error);
      // Only set error status if it's not already 'error' to avoid loops on repeated errors
      if (projectionStatus !== 'error') {
        setProjectionStatus('error');
        setProjectionError(error.message || 'Error checking task status');
        setProjectionResults(null);
      }
      // For 429, the useEffect will handle the longer delay
    }
  }, [projectionTaskId, projectionStatus, setProjectionStatus, setProjectionResults, setProjectionError]);

  // Effect for polling task status
  useEffect(() => {
    if (!projectionTaskId || !['submitted', 'processing', 'pending'].includes(projectionStatus)) {
      return;
    }

    let isMountedRef = { current: true };
    let timeoutId = null;

    const performCheck = async () => {
      await checkStatus(isMountedRef, { current: timeoutId }); // Pass refs

      if (!isMountedRef.current) return;

      // Schedule next check if still in a polling state
      if (['processing', 'pending'].includes(projectionStatus)) {
        const delay = projectionError && projectionError.includes('429') ? 10000 : 5000;
        timeoutId = setTimeout(performCheck, delay);
      }
    };
    
    // If status is 'submitted', we transition it to 'pending' to start the polling,
    // or directly call performCheck if it's already a polling status.
    if (projectionStatus === 'submitted') {
      setProjectionStatus('pending'); // This will re-trigger the useEffect for 'pending' state
    } else {
      performCheck(); // Initial check for 'processing' or 'pending'
    }

    return () => {
      isMountedRef.current = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [projectionTaskId, projectionStatus, checkStatus, projectionError]); // Added projectionError for 429 handling

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