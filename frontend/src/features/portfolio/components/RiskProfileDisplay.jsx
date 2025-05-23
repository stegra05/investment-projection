import React from 'react';
import { usePortfolio } from '../state/PortfolioContext'; // Context to access portfolio-specific data and actions.
import Button from '../../../components/Button/Button'; // Reusable Button component.
import Spinner from '../../../components/Spinner/Spinner'; // Spinner for loading states.
import AlertMessage from '../../../components/AlertMessage/AlertMessage'; // For displaying errors.

/**
 * @component RiskProfileDisplay
 * @description Displays the risk profile analysis for the current portfolio.
 * It fetches data using the `usePortfolio` context, handles loading and error states,
 * and presents various risk metrics such as risk score, volatility, Sharpe ratio,
 * confidence intervals, and the calculation date. Users can load or refresh the analysis.
 *
 * @example
 * // Typically used within a portfolio's analytics or overview section.
 * <RiskProfileDisplay />
 *
 * @returns {JSX.Element} The rendered risk profile display section, or relevant loading/error/prompt states.
 */
const RiskProfileDisplay = () => {
  // Destructure necessary state and functions from the PortfolioContext.
  const { 
    riskProfile,            // The risk profile data object.
    isAnalyticsLoading,     // Boolean indicating if analytics (including risk profile) are loading.
    analyticsError,         // Error object if fetching analytics failed.
    fetchRiskProfile,       // Function to trigger fetching/refreshing the risk profile.
  } = usePortfolio();

  /**
   * Handles the click event for the "Load Risk Profile" or "Retry" or "Refresh Analysis" button.
   * Calls the `fetchRiskProfile` function from the context.
   */
  const handleLoadRiskProfile = () => {
    fetchRiskProfile();
  };

  // Conditional rendering based on loading state.
  if (isAnalyticsLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg shadow min-h-[200px]">
        <Spinner size="h-8 w-8" />
        <p className="mt-2 text-sm text-gray-600">Loading risk profile analysis...</p>
      </div>
    );
  }

  // Conditional rendering based on error state.
  if (analyticsError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg shadow">
        <AlertMessage 
          type="error"
          title="Error Loading Risk Profile"
          message={analyticsError.message || 'An unknown error occurred while fetching the risk profile.'}
        />
        <Button onClick={handleLoadRiskProfile} variant="secondary" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // Conditional rendering if risk profile data is not yet loaded (initial state).
  if (!riskProfile) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg shadow text-center min-h-[200px] flex flex-col items-center justify-center">
        <p className="text-sm text-gray-600 mb-4">
          Risk profile analysis has not been loaded yet.
        </p>
        <Button onClick={handleLoadRiskProfile} variant="primary">
          Load Risk Profile
        </Button>
      </div>
    );
  }

  // Main display of risk profile metrics when data is available.
  return (
    <div className="p-4 md:p-6 bg-white shadow-md rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
        Risk Profile Analysis
      </h3>
      {/* Grid layout for displaying metrics. Responsive columns. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
        {/* Risk Score Display */}
        <div>
          <span className="font-medium text-gray-600">Risk Score:</span>
          <span className="ml-2 text-gray-900 font-semibold">{riskProfile.risk_score ?? 'N/A'}</span>
        </div>
        {/* Volatility Estimate Display */}
        <div>
          <span className="font-medium text-gray-600">Volatility Estimate:</span>
          {/* Format volatility as a percentage with 2 decimal places. Handle null/undefined. */}
          <span className="ml-2 text-gray-900">
            {typeof riskProfile.volatility_estimate === 'number' 
              ? `${(riskProfile.volatility_estimate * 100).toFixed(2)}%` 
              : 'N/A'}
          </span>
        </div>
        {/* Sharpe Ratio Display */}
        <div>
          <span className="font-medium text-gray-600">Sharpe Ratio:</span>
          <span className="ml-2 text-gray-900">{typeof riskProfile.sharpe_ratio === 'number' ? riskProfile.sharpe_ratio.toFixed(3) : 'N/A'}</span>
        </div>
        {/* 95% Confidence Interval Display */}
        <div>
          <span className="font-medium text-gray-600">95% Confidence Interval:</span>
          {/* Handle cases where interval values might be null/undefined. */}
          <span className="ml-2 text-gray-900">
            {typeof riskProfile.confidence_interval_low_95 === 'number' && typeof riskProfile.confidence_interval_high_95 === 'number'
              ? `${riskProfile.confidence_interval_low_95.toFixed(2)} to ${riskProfile.confidence_interval_high_95.toFixed(2)}`
              : 'N/A'}
          </span>
        </div>
        {/* Calculation Date Display */}
        <div>
          <span className="font-medium text-gray-600">Calculation Date:</span>
          {/* Format the calculation date to a more readable local date string. Handle invalid or missing date. */}
          <span className="ml-2 text-gray-900">
            {riskProfile.calculation_date 
              ? new Date(riskProfile.calculation_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) 
              : 'N/A'}
          </span>
        </div>
      </div>
      {/* Button to refresh the risk profile analysis. */}
      <div className="mt-6 text-right">
        <Button onClick={handleLoadRiskProfile} variant="outline-select" size="small">
          Refresh Analysis
        </Button>
      </div>
    </div>
  );
};

// RiskProfileDisplay does not take direct props as it sources data from PortfolioContext.
// Thus, PropTypes are not defined here.

export default RiskProfileDisplay;
