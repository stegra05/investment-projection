import React, { createContext, useContext, useState } from 'react';

// 1. Create the Context
const PortfolioContext = createContext();

// 2. Create a Provider Component
export const PortfolioProvider = ({ children }) => {
  // TODO: Add state related to the specific portfolio being viewed
  // e.g., portfolio details, assets, projections, loading/error states
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // TODO: Add functions to fetch/update portfolio data

  const value = {
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