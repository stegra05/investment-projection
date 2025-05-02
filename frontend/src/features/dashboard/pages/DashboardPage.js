import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
// Adjust import paths based on actual file location (frontend/src/features/dashboard/pages)
import usePortfolioListStore from '../../../store/portfolioListStore';
import useAuthStore from '../../../store/authStore';
// Assuming a Button component exists relative to frontend/src
// import Button from '../../../components/Button/Button';
// Assuming a Spinner component exists relative to frontend/src
// import Spinner from '../../../components/Spinner/Spinner';

function DashboardPage() {
  const { portfolios, isLoading, error, fetchPortfolios } = usePortfolioListStore();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  const handleLogout = () => {
    logout();
    // No need to navigate here, ProtectedRoute will handle redirect
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My Portfolios</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
        >
          Logout
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-40">
          {/* Replace with Spinner component if available */}
          <p>Loading portfolios...</p>
          {/* <Spinner /> */}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {portfolios.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <p>No portfolios found.</p>
              <p>Click the button below to create your first one!</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {portfolios.map((portfolio) => (
                <li key={portfolio.portfolio_id} className="border rounded-lg p-4 hover:bg-gray-50 transition duration-150 ease-in-out">
                  {/* Ensure portfolio.portfolio_id is the correct key from your API */}
                  <Link to={`/portfolio/${portfolio.portfolio_id}`} className="block">
                    <h2 className="text-lg font-medium text-blue-600 hover:text-blue-800">{portfolio.name}</h2>
                    {/* Add more details if needed, e.g., portfolio.description */}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex justify-center">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out">
              Create New Portfolio
            </button>
            {/* <Button>Create New Portfolio</Button> */}
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardPage; 