import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // For linking to individual portfolio pages.
import usePortfolioListStore from '../../../store/portfolioListStore'; // Zustand store for managing portfolio list state.
import useAuthStore from '../../../store/authStore'; // Zustand store for authentication state (logout).
import Button from '../../../components/Button/Button.jsx'; // Reusable Button component.
import CreatePortfolioModal from '../components/CreatePortfolioModal.jsx'; // Modal for creating new portfolios.
import portfolioService from '../../../api/portfolioService'; // API service for portfolio operations.
import Spinner from '../../../components/Spinner/Spinner.jsx'; // Spinner component for loading states.
// Note: Layout component is not explicitly imported here, assuming it's part of a higher-level route setup.

/**
 * @page DashboardPage
 * @description This page serves as the main dashboard for authenticated users.
 * It displays a list of their investment portfolios, provides functionality to create new portfolios
 * via a modal dialog, and allows users to log out.
 * It interacts with `usePortfolioListStore` to fetch and display portfolio data,
 * and `useAuthStore` for logout functionality. Portfolio creation is handled by directly
 * calling `portfolioService`. Local state is used to manage the "Create Portfolio" modal
 * and the loading/error states associated with the creation process.
 *
 * @example
 * // Typically rendered by a protected route:
 * // <ProtectedRoute path="/dashboard" element={<DashboardPage />} />
 *
 * @returns {JSX.Element} The rendered dashboard page UI.
 */
function DashboardPage() {
  // Destructure state and actions from the portfolio list store.
  const {
    portfolios,          // Array of portfolio objects.
    isLoading: isLoadingList, // Boolean indicating if the portfolio list is being fetched.
    error: listError,       // Error object/message if fetching the list failed.
    fetchPortfolios,     // Action to fetch/refresh the portfolio list.
  } = usePortfolioListStore();

  // Access the logout action from the authentication store.
  const logout = useAuthStore(state => state.logout);

  // Local state for managing the "Create Portfolio" modal.
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls modal visibility.
  // Local state for loading status during the portfolio creation API call.
  const [isCreating, setIsCreating] = useState(false);
  // Local state for storing any error that occurs during portfolio creation.
  const [createError, setCreateError] = useState(null);

  // `useEffect` to fetch portfolios when the component mounts or `fetchPortfolios` function identity changes.
  useEffect(() => {
    fetchPortfolios(); // Initial fetch of portfolios.
  }, [fetchPortfolios]); // Dependency array.

  /**
   * Handles the logout action. Calls the logout function from the auth store.
   * Navigation to login page is typically handled by `ProtectedRoute` upon auth state change.
   */
  const handleLogout = () => {
    logout();
    // No explicit navigation here; ProtectedRoute or auth store listener should redirect.
  };

  /**
   * Handles the creation of a new portfolio.
   * This function is passed as the `onSubmit` prop to the `CreatePortfolioModal`.
   * It sets loading states, calls the portfolio creation API service,
   * closes the modal on success, refreshes the portfolio list, and handles errors.
   * @param {object} portfolioData - Data for the new portfolio, typically `{ name, description }`.
   */
  const handleCreatePortfolio = async portfolioData => {
    setIsCreating(true); // Indicate start of creation process.
    setCreateError(null); // Clear any previous creation errors.
    try {
      await portfolioService.createPortfolio(portfolioData); // API call.
      setIsModalOpen(false); // Close the modal on successful creation.
      await fetchPortfolios(); // Refresh the portfolio list to include the new one.
    } catch (err) {
      console.error('Failed to create portfolio:', err); // Log the full error for debugging.
      // Extract a user-friendly error message from the error object.
      const message = err.response?.data?.message || err.message || 'An unexpected error occurred while creating the portfolio.';
      setCreateError(message); // Set the error message to be displayed in the modal.
    } finally {
      setIsCreating(false); // Indicate end of creation process, regardless of outcome.
    }
  };

  return (
    // Main container for the dashboard page.
    <div className="container mx-auto p-4">
      {/* Header section with page title and logout button. */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My Portfolios</h1>
        <Button variant="danger" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Conditional rendering for loading state of the portfolio list. */}
      {isLoadingList && (
        <div className="flex justify-center items-center h-40">
          <Spinner size="h-10 w-10" /> {/* Display a spinner while loading. */}
          <p className="ml-3">Loading portfolios...</p>
        </div>
      )}

      {/* Conditional rendering for error state when fetching portfolio list. */}
      {listError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert" // ARIA role for accessibility.
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {String(listError)}</span> {/* Ensure listError is a string */}
        </div>
      )}

      {/* Main content area: displayed if not loading and no error occurred while fetching list. */}
      {!isLoadingList && !listError && (
        <>
          {/* Conditional rendering based on whether portfolios exist. */}
          {portfolios.length === 0 ? (
            // Display message if no portfolios are found.
            <div className="text-center text-gray-500 py-10">
              <p>No portfolios found.</p>
              <p>Click the button below to create your first one!</p>
            </div>
          ) : (
            // Display list of portfolios if any exist.
            <ul className="space-y-4">
              {portfolios.map(portfolio => (
                <li
                  key={portfolio.portfolio_id} // Unique key for each list item.
                  className="border rounded-lg p-4 hover:bg-gray-50 transition duration-150 ease-in-out"
                >
                  {/* Link to the detailed view of the specific portfolio. */}
                  <Link to={`/portfolio/${portfolio.portfolio_id}`} className="block">
                    <h2 className="text-lg font-medium text-blue-600 hover:text-blue-800">
                      {portfolio.name} {/* Display portfolio name. */}
                    </h2>
                    {/* Future enhancement: Display portfolio description or other summary details here. */}
                    {/* e.g., <p className="text-sm text-gray-600">{portfolio.description}</p> */}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Button to open the "Create New Portfolio" modal. */}
          <div className="mt-8 flex justify-center">
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Create New Portfolio
            </Button>
          </div>
        </>
      )}

      {/* The modal for creating a new portfolio. 
          Its visibility and state are managed by this DashboardPage component. */}
      <CreatePortfolioModal
        isOpen={isModalOpen} // Controls modal visibility.
        onClose={() => setIsModalOpen(false)} // Handler to close the modal.
        onSubmit={handleCreatePortfolio} // Handler for form submission within the modal.
        isLoading={isCreating} // Loading state for the creation process.
        error={createError} // Error message to display within the modal if creation fails.
      />
    </div>
  );
}

// As a page-level component, DashboardPage typically does not receive props directly
// from other components but rather from routing or global state, so PropTypes are not usually defined.
export default DashboardPage;