import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePortfolioListStore from '../../../store/portfolioListStore';
import { usePortfolio } from '../state/PortfolioContext';

function NavigationPanel() {
  const { portfolios, fetchPortfolios, isLoading, error } = usePortfolioListStore();
  const { portfolioId } = usePortfolio();
  const navigate = useNavigate();

  useEffect(() => {
    if (portfolios.length === 0) {
      fetchPortfolios();
    }
  }, [fetchPortfolios, portfolios.length]);

  if (isLoading) return <div>Loading portfolios...</div>;
  if (error) return <div className="text-red-600">Error loading portfolios: {error}</div>;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">Portfolios</h2>
      {portfolios.length === 0 ? (
        <p className="text-gray-500">No portfolios found.</p>
      ) : (
        <ul className="space-y-2 overflow-y-auto flex-grow">
          {portfolios.map(portfolio => {
            const isActive = String(portfolio.portfolio_id) === String(portfolioId);
            return (
              <li key={portfolio.portfolio_id} className="list-none">
                <button
                  type="button"
                  className={`w-full text-left p-2 rounded text-gray-800 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-300 ${isActive ? 'bg-primary-100 text-primary-700 font-semibold border-l-4 border-primary-500' : ''}`}
                  onClick={() => navigate(`/portfolio/${portfolio.portfolio_id}`)}
                >
                  {portfolio.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {/* TODO: Add button/link to go back to Dashboard? */}
    </div>
  );
}

export default NavigationPanel;
