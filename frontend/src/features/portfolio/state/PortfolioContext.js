import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import portfolioService from '../../../api/portfolioService';
import analyticsService from '../../../api/analyticsService';

// 1. Create the Context
const PortfolioContext = createContext();

// 2. Create a Provider Component
export const PortfolioProvider = ({ children }) => {
  const { portfolioId } = useParams();

  // State for portfolio data, loading, and error
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for analytics data
  const [riskProfile, setRiskProfile] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Effect to fetch portfolio data when portfolioId changes
  useEffect(() => {
    if (!portfolioId) {
      // Handle case where ID might be missing momentarily or invalid route structure
      setError(new Error('Portfolio ID is missing.'));
      setIsLoading(false);
      setPortfolio(null);
      return;
    }

    const fetchPortfolioData = async () => {
      setIsLoading(true);
      setError(null);
      setPortfolio(null); // Clear previous data
      try {
        // Always fetch full portfolio data for the context to ensure all components have access to complete data
        // This can be optimized later by implementing data loading strategies based on component needs
        const data = await portfolioService.getPortfolioById(portfolioId, 'full');
        setPortfolio(data); 
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        setError(err.response?.data || err); // Store the error object or response data
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  }, [portfolioId]); // Dependency array ensures this runs when ID changes

  /**
   * Fetches the risk profile analysis for the current portfolio.
   * @returns {Promise<void>}
   */
  const fetchRiskProfile = async () => {
    if (!portfolioId) return;

    setIsAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await analyticsService.getRiskProfile(portfolioId);
      setRiskProfile(data);
    } catch (err) {
      console.error('Error fetching risk profile:', err);
      setAnalyticsError(err.response?.data || err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  /**
   * Fetches performance data for the current portfolio within an optional date range.
   * @param {string|null} [startDate] - Optional start date for the performance period (ISO format).
   * @param {string|null} [endDate] - Optional end date for the performance period (ISO format).
   * @returns {Promise<void>}
   */
  const fetchPerformanceData = async (startDate = null, endDate = null) => {
    if (!portfolioId) return;

    setIsAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await analyticsService.getPerformanceData(portfolioId, startDate, endDate);
      setPerformanceData(data);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setAnalyticsError(err.response?.data || err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  // The value provided to consuming components
  const value = {
    portfolioId,
    portfolio,
    isLoading,
    error,
    // Analytics-related state and functions
    riskProfile,
    performanceData,
    isAnalyticsLoading,
    analyticsError,
    fetchRiskProfile,
    fetchPerformanceData,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

// Add propTypes validation
PortfolioProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// 3. Create a custom hook for easy consumption
export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

// Export the context itself if needed elsewhere (less common)
// export default PortfolioContext; 