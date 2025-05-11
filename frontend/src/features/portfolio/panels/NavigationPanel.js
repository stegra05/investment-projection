import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePortfolioListStore from '../../../store/portfolioListStore';
import { usePortfolio } from '../state/PortfolioContext';
import {
  HEADING_PORTFOLIOS,
  LOADING_PORTFOLIOS_LIST,
  ERROR_LOADING_PORTFOLIOS_LIST_PREFIX,
  EMPTY_PORTFOLIOS_LIST,
} from '../../../constants/textConstants';

function NavigationPanel() {
  const { portfolios, fetchPortfolios, isLoading, error } = usePortfolioListStore();
  const { portfolioId } = usePortfolio();
  const navigate = useNavigate();

  useEffect(() => {
    if (portfolios.length === 0) {
      fetchPortfolios();
    }
  }, [fetchPortfolios, portfolios.length]);

  if (isLoading) return <div>{LOADING_PORTFOLIOS_LIST}</div>;
  if (error) return <div className="text-red-600">{ERROR_LOADING_PORTFOLIOS_LIST_PREFIX} {error}</div>;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">{HEADING_PORTFOLIOS}</h2>
      {portfolios.length === 0 ? (
        <p className="text-gray-500">{EMPTY_PORTFOLIOS_LIST}</p>
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
    </div>
  );
}

export default NavigationPanel;
