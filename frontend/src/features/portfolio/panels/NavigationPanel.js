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
          {portfolios.map((portfolio) => {
            const isActive = String(portfolio.portfolio_id) === String(portfolioId);
            return (
              <li key={portfolio.portfolio_id} className="list-none">
                <button 
                  type="button"
                  className={`w-full text-left p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 ${isActive ? 'bg-blue-100 font-semibold' : ''}`}
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