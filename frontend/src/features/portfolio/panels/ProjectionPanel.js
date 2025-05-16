import React, { useState, useEffect, useCallback } from 'react';
import { usePortfolio } from '../state/PortfolioContext';
import useProjectionTask from '../hooks/useProjectionTask';
import Button from '../../../components/Button/Button';
import ProjectionChart from '../components/ProjectionChart';
import ProjectionSummaryMetrics from '../components/ProjectionSummaryMetrics';
import ProjectionParamsForm from '../components/ProjectionParamsForm';
import useNotification from '../../../hooks/useNotification';
import {
  DEFAULT_PROJECTION_HORIZON_YEARS,
  DEFAULT_INITIAL_VALUE,
} from '../../../constants/portfolioConstants';
import {
  HEADING_PROJECTION_SETUP,
  STATUS_PROJECTION_PROCESSING,
  STATUS_PROJECTION_COMPLETED,
  ERROR_PROJECTION_FALLBACK,
  CHART_EMPTY_FAILED,
  CHART_EMPTY_PENDING_RUN,
  BUTTON_RUN_PROJECTION,
  BUTTON_PROCESSING_PROJECTION,
} from '../../../constants/textConstants';

// Helper function to format date as YYYY-MM-DD
const formatDate = date => {
  return date.toISOString().split('T')[0];
};

// Calculate default dates
const today = new Date();
const defaultStartDate = formatDate(today);

function ProjectionPanel() {
  const { portfolioId } = usePortfolio();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [projectionHorizonYears, setProjectionHorizonYears] = useState(
    DEFAULT_PROJECTION_HORIZON_YEARS
  );
  const [projectionHorizonError, setProjectionHorizonError] = useState('');
  const [endDate, setEndDate] = useState(() => {
    const initialEndDate = new Date(defaultStartDate);
    initialEndDate.setFullYear(
      initialEndDate.getFullYear() + DEFAULT_PROJECTION_HORIZON_YEARS
    );
    return formatDate(initialEndDate);
  });
  const [initialValue, setInitialValue] = useState(DEFAULT_INITIAL_VALUE);

  const {
    projectionStatus,
    projectionResults,
    projectionError,
    startNewProjection,
    isProjectionRunning,
  } = useProjectionTask();
  const { addNotification } = useNotification();

  // Effect to update end date when start date or horizon changes
  useEffect(() => {
    const horizon = Number(projectionHorizonYears);
    if (startDate && !isNaN(horizon) && horizon > 0 && Number.isInteger(horizon)) {
      const newEndDate = new Date(startDate);
      newEndDate.setFullYear(newEndDate.getFullYear() + horizon);
      setEndDate(formatDate(newEndDate));
    } else if (projectionHorizonYears === '') {
      setEndDate(startDate);
    }
  }, [startDate, projectionHorizonYears]);

  // New useEffect for notifications
  useEffect(() => {
    if (projectionStatus === 'completed') {
      addNotification(STATUS_PROJECTION_COMPLETED, 'success');
    } else if (projectionStatus === 'error' && projectionError) {
      addNotification(projectionError || ERROR_PROJECTION_FALLBACK, 'error');
    }
    // We don't want to include addNotification, STATUS_PROJECTION_COMPLETED, ERROR_PROJECTION_FALLBACK in dependency array
    // as they are stable. If addNotification isn't memoized, it could cause infinite loops.
    // Assuming addNotification is stable (e.g. from useCallback in useNotification hook)
  }, [projectionStatus, projectionError, addNotification]);

  const handleRunProjection = useCallback(() => {
    if (projectionHorizonYears === '') {
      setProjectionHorizonError('Horizon (years) is required to run projection.');
      return;
    }
    const horizonNum = Number(projectionHorizonYears);
    if (!Number.isInteger(horizonNum) || horizonNum < 1 || horizonNum > 100) {
      setProjectionHorizonError('Invalid horizon value. Please correct it first.');
      return;
    }
    setProjectionHorizonError('');

    startNewProjection(portfolioId, {
      start_date: startDate,
      end_date: (() => {
        const newEndDate = new Date(startDate);
        newEndDate.setFullYear(newEndDate.getFullYear() + horizonNum);
        return formatDate(newEndDate);
      })(),
      initial_total_value: Number(initialValue) || 0,
    });
  }, [
    portfolioId,
    startDate,
    initialValue,
    startNewProjection,
    projectionHorizonYears,
  ]);

  const isRunButtonDisabled = 
    isProjectionRunning || 
    !!projectionHorizonError || 
    !projectionHorizonYears;

  return (
    <div className="p-4 bg-white rounded shadow h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">{HEADING_PROJECTION_SETUP}</h2>

      <ProjectionParamsForm
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        projectionHorizonYears={projectionHorizonYears}
        setProjectionHorizonYears={setProjectionHorizonYears}
        projectionHorizonError={projectionHorizonError}
        setProjectionHorizonError={setProjectionHorizonError}
        initialValue={initialValue}
        setInitialValue={setInitialValue}
        isProjectionRunning={isProjectionRunning}
      />

      {/* Chart Area & Summary */}
      <div className="flex-grow flex flex-col bg-gray-50 rounded border border-gray-200 mb-4 min-h-0">
        <div className="flex-grow min-h-0">
          {projectionStatus === 'completed' && projectionResults && projectionResults.length > 0 ? (
            <ProjectionChart data={projectionResults} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-gray-500">
                {isProjectionRunning
                  ? STATUS_PROJECTION_PROCESSING
                  : projectionStatus === 'error'
                    ? CHART_EMPTY_FAILED
                    : CHART_EMPTY_PENDING_RUN}
              </span>
            </div>
          )}
        </div>
        {projectionStatus === 'completed' && projectionResults && projectionResults.length > 1 && (
          <ProjectionSummaryMetrics data={projectionResults} />
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleRunProjection}
          disabled={isRunButtonDisabled}
          variant="primary"
        >
          {isProjectionRunning ? BUTTON_PROCESSING_PROJECTION : BUTTON_RUN_PROJECTION}
        </Button>
      </div>
    </div>
  );
}

export default ProjectionPanel;
