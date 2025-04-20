import { useState, useEffect, useCallback } from 'react';
import { getPortfolioById } from '../services/portfolioService';

export function usePortfolioData(portfolioId) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPortfolioById(portfolioId);
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
      setError(err.response?.data?.message || 'Failed to load portfolio details.');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    if (portfolioId) {
      fetchPortfolio();
    } else {
        // Handle case where portfolioId is not yet available or invalid
        setLoading(false);
        setError("No Portfolio ID provided.");
        setPortfolio(null);
    }
  }, [fetchPortfolio, portfolioId]); // Add portfolioId dependency

  return { portfolio, loading, error, refetchPortfolio: fetchPortfolio };
} 