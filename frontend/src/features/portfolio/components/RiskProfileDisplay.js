import React from 'react';
import { usePortfolio } from '../state/PortfolioContext';

const RiskProfileDisplay = () => {
  const { riskProfile, isAnalyticsLoading, analyticsError, fetchRiskProfile } = usePortfolio();

  const handleLoadRiskProfile = () => {
    fetchRiskProfile();
  };

  if (isAnalyticsLoading) {
    return <div>Loading risk profile analysis...</div>;
  }

  if (analyticsError) {
    return (
      <div>
        <div>Error loading risk profile: {analyticsError.message || 'Unknown error'}</div>
        <button onClick={handleLoadRiskProfile}>Retry</button>
      </div>
    );
  }

  if (!riskProfile) {
    return (
      <div>
        <div>Click the button below to load the risk profile analysis.</div>
        <button onClick={handleLoadRiskProfile}>Load Risk Profile</button>
      </div>
    );
  }

  return (
    <div>
      <h3>Risk Profile Analysis</h3>
      <div>
        <strong>Risk Score:</strong> {riskProfile.risk_score}
      </div>
      <div>
        <strong>Volatility Estimate:</strong> {(riskProfile.volatility_estimate * 100).toFixed(2)}%
      </div>
      <div>
        <strong>Sharpe Ratio:</strong> {riskProfile.sharpe_ratio}
      </div>
      <div>
        <strong>95% Confidence Interval:</strong> {riskProfile.confidence_interval_low_95} to {riskProfile.confidence_interval_high_95}
      </div>
      <div>
        <strong>Calculation Date:</strong> {new Date(riskProfile.calculation_date).toLocaleDateString()}
      </div>
      <button onClick={handleLoadRiskProfile}>Refresh Analysis</button>
    </div>
  );
};

export default RiskProfileDisplay; 