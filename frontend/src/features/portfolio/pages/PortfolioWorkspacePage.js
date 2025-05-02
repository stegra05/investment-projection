import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePortfolio } from '../state/PortfolioContext';
import NavigationPanel from '../panels/NavigationPanel';
import MainContentPanel from '../panels/MainContentPanel';
import ProjectionPanel from '../panels/ProjectionPanel';

function PortfolioWorkspacePage() {
  const { portfolioId } = useParams();
  const { portfolio, isLoading, error } = usePortfolio();

  if (isLoading) {
    return <div className="p-4 text-center">Loading portfolio data...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Error loading portfolio: {error.message || 'Unknown error'}</div>;
  }

  if (!portfolio) {
    return <div className="p-4 text-center">Portfolio data not available.</div>;
  }

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-100">
      <nav className="mb-4 text-sm text-gray-600" aria-label="Breadcrumb">
        <ol className="list-none p-0 inline-flex">
          <li className="flex items-center">
            <Link to="/dashboard" className="hover:text-blue-700 hover:underline">
              Dashboard
            </Link>
          </li>
          <li className="flex items-center mx-2">
            <span className="text-gray-400">/</span>
          </li>
          <li className="flex items-center">
            <span className="font-medium text-gray-800" aria-current="page">
              {portfolio.name || `Portfolio ${portfolioId}`}
            </span>
          </li>
        </ol>
      </nav>

      <div className="flex-grow grid grid-cols-4 gap-4">
        <div className="col-span-1 bg-white rounded shadow p-4">
          <NavigationPanel />
        </div>

        <div className="col-span-2 bg-white rounded shadow p-4">
          <MainContentPanel />
        </div>

        <div className="col-span-1 bg-white rounded shadow p-4">
          <ProjectionPanel />
        </div>
      </div>
    </div>
  );
}

export default PortfolioWorkspacePage; 