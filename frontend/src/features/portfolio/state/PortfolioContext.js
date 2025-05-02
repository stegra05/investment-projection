import React, { createContext, useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';

// 1. Create the Context
const PortfolioContext = createContext();

// 2. Create a Provider Component
export const PortfolioProvider = ({ children }) => {
  const { portfolioId } = useParams();

  // TODO: Add state related to the specific portfolio being viewed
  // e.g., portfolio details, assets, projections, loading/error states
  const [portfolioData, setPortfolioData] = useState(null); // eslint-disable-line no-unused-vars
  const [isLoading, setIsLoading] = useState(false); // eslint-disable-line no-unused-vars
  const [error, setError] = useState(null); // eslint-disable-line no-unused-vars

  // TODO: Add functions to fetch/update portfolio data

  const value = {
    portfolioId,
    portfolioData,
    isLoading,
    error,
    // TODO: Export functions
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