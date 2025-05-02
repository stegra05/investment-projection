import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import portfolioService from '../../../api/portfolioService';

// 1. Create the Context
const PortfolioContext = createContext();

// 2. Create a Provider Component
export const PortfolioProvider = ({ children }) => {
  const { portfolioId } = useParams();

  // State for portfolio data, loading, and error
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const data = await portfolioService.getPortfolioById(portfolioId);
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

  // The value provided to consuming components
  const value = {
    portfolioId,
    portfolio,
    isLoading,
    error,
    // TODO: Add functions for updates if needed later
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