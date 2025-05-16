import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePortfolioListStore from '../../../store/portfolioListStore';
import { usePortfolio } from '../state/PortfolioContext';
import useTheme from '../../../hooks/useTheme';
import { FaPlus } from 'react-icons/fa';
import {
  HEADING_PORTFOLIOS,
  LOADING_PORTFOLIOS_LIST,
  ERROR_LOADING_PORTFOLIOS_LIST_PREFIX,
  EMPTY_PORTFOLIOS_LIST,
  BUTTON_CREATE_NEW_PORTFOLIO,
} from '../../../constants/textConstants';

function NavigationPanel() {
  const { portfolios, fetchPortfolios, isLoading, error } = usePortfolioListStore();
  const { portfolioId } = usePortfolio();
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    if (portfolios.length === 0) {
      fetchPortfolios();
    }
  }, [fetchPortfolios, portfolios.length]);

  return (
    <div className={`flex flex-col h-full p-4 ${theme === 'high-contrast' ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <h2 className={`text-lg font-semibold mb-4 border-b pb-2 ${theme === 'high-contrast' ? 'text-gray-100 border-gray-600' : 'text-gray-900 border-gray-300'}`}>{HEADING_PORTFOLIOS}</h2>
      
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate('/portfolio/new')}
          className={`w-full flex items-center justify-center px-4 py-2 rounded font-semibold focus:outline-none focus:ring-2 transition-colors group
            ${
              theme === 'high-contrast'
                ? 'bg-primary-500 hover:bg-primary-400 text-white focus:ring-primary-300'
                : 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500'
            }`}
        >
          <FaPlus className={`mr-2 h-4 w-4 ${theme === 'high-contrast' ? 'text-white' : 'text-white'}`} /> 
          {BUTTON_CREATE_NEW_PORTFOLIO}
        </button>
      </div>

      {isLoading && <div>{LOADING_PORTFOLIOS_LIST}</div>}
      {!isLoading && error && <div className="text-red-600">{ERROR_LOADING_PORTFOLIOS_LIST_PREFIX} {error}</div>}
      
      {!isLoading && !error && portfolios.length === 0 && (
        <p className={`${theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-500'}`}>{EMPTY_PORTFOLIOS_LIST}</p>
      )}

      {!isLoading && !error && portfolios.length > 0 && (
        <ul className="space-y-2 overflow-y-auto flex-grow">
          {portfolios.map(portfolio => {
            const isActive = String(portfolio.portfolio_id) === String(portfolioId);
            
            const baseClasses = 'w-full text-left p-2 rounded focus:outline-none focus:ring-2 transition-colors duration-150';
            let themeItemClasses = '';
            let activeItemClasses = '';
            let inactiveItemClasses = '';
            let borderItemClass = 'border-l-4 border-transparent';

            if (theme === 'high-contrast') {
              themeItemClasses = 'hover:bg-gray-700 focus:ring-primary-400';
              if (isActive) {
                activeItemClasses = 'bg-primary-600 text-white font-semibold';
                borderItemClass = 'border-l-4 border-primary-400';
              } else {
                inactiveItemClasses = 'text-gray-100';
              }
            } else {
              themeItemClasses = 'hover:bg-primary-50 focus:ring-primary-300';
              if (isActive) {
                activeItemClasses = 'bg-primary-100 text-primary-700 font-semibold';
                borderItemClass = 'border-l-4 border-primary-500';
              } else {
                inactiveItemClasses = 'text-gray-800';
              }
            }

            return (
              <li key={portfolio.portfolio_id} className="list-none">
                <button
                  type="button"
                  className={`${baseClasses} ${themeItemClasses} ${isActive ? activeItemClasses : inactiveItemClasses} ${borderItemClass}`}
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
