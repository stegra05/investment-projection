import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // For programmatic navigation.
import usePortfolioListStore from '../../../store/portfolioListStore'; // Zustand store for the list of all portfolios.
import { usePortfolio } from '../state/PortfolioContext'; // Context to get the currently active portfolio's ID.
import useTheme from '../../../hooks/useTheme'; // Hook for accessing theme state.
import { FaPlus } from 'react-icons/fa'; // Plus icon for "Create New" button.
import { // UI text constants.
  HEADING_PORTFOLIOS,
  LOADING_PORTFOLIOS_LIST,
  ERROR_LOADING_PORTFOLIOS_LIST_PREFIX,
  EMPTY_PORTFOLIOS_LIST,
  BUTTON_CREATE_NEW_PORTFOLIO,
} from '../../../constants/textConstants';
import Spinner from '../../../components/Spinner/Spinner'; // Spinner for loading state

/**
 * @component NavigationPanel
 * @description A panel component displayed within the portfolio workspace that lists all user portfolios,
 * allowing navigation between them. It highlights the currently active portfolio and includes a button
 * to navigate to the "Create New Portfolio" page. It fetches portfolio data using `usePortfolioListStore`,
 * determines the active portfolio via `usePortfolio` context, and applies theming with `useTheme`.
 *
 * @example
 * // Used as one of the panes in PortfolioWorkspacePage's Allotment layout.
 * // <Allotment.Pane><NavigationPanel /></Allotment.Pane>
 *
 * @returns {JSX.Element} The rendered navigation panel.
 */
function NavigationPanel() {
  // State and actions from the global portfolio list store.
  const { 
    portfolios,         // Array of all portfolio objects.
    fetchPortfolios,    // Action to fetch/refresh the list of portfolios.
    isLoading,          // Boolean indicating if the portfolio list is currently loading.
    error               // Error object/message if fetching the list failed.
  } = usePortfolioListStore();
  
  // Get the ID of the currently active portfolio from PortfolioContext.
  // This is used to highlight the active portfolio in the list.
  const { portfolioId } = usePortfolio(); 
  
  // Hook for programmatic navigation.
  const navigate = useNavigate();
  // Access theme state for styling.
  const { theme } = useTheme();

  // `useEffect` to fetch the list of portfolios if it's initially empty.
  // This ensures that the panel attempts to load data when it first mounts.
  useEffect(() => {
    if (portfolios.length === 0) {
      fetchPortfolios();
    }
  }, [fetchPortfolios, portfolios.length]); // Dependencies: run if fetchPortfolios or list length changes.

  return (
    // Main container for the navigation panel, with flex layout and theme-dependent background.
    <div className={`flex flex-col h-full p-4 ${theme === 'high-contrast' ? 'bg-gray-800' : 'bg-gray-50'}`}>
      {/* Panel Title, styled based on theme and using text from constants. */}
      <h2 className={`text-lg font-semibold mb-4 border-b pb-2 ${theme === 'high-contrast' ? 'text-gray-100 border-gray-600' : 'text-gray-900 border-gray-300'}`}>
        {HEADING_PORTFOLIOS}
      </h2>
      
      {/* "Create New Portfolio" Button Section. */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate('/portfolio/new')} // Navigates to the new portfolio creation page.
          // Dynamic styling for the button, including theme considerations.
          className={`w-full flex items-center justify-center px-4 py-2 rounded font-semibold focus:outline-none focus:ring-2 transition-colors group
            ${
              theme === 'high-contrast'
                ? 'bg-primary-500 hover:bg-primary-400 text-white focus:ring-primary-300' // High contrast theme style.
                : 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500' // Default theme style.
            }`}
        >
          <FaPlus className={`mr-2 h-4 w-4 ${theme === 'high-contrast' ? 'text-white' : 'text-white'}`} /> 
          {BUTTON_CREATE_NEW_PORTFOLIO}
        </button>
      </div>

      {/* Conditional Rendering for Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Spinner size="h-5 w-5" color={theme === 'high-contrast' ? 'text-gray-100' : 'text-primary-600'} />
          <span className={`ml-2 text-sm ${theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-600'}`}>{LOADING_PORTFOLIOS_LIST}</span>
        </div>
      )}
      {/* Conditional Rendering for Error State */}
      {!isLoading && error && (
        <div className={`text-sm p-3 rounded-md ${theme === 'high-contrast' ? 'bg-red-700 text-red-100' : 'bg-red-100 text-red-700'}`}>
          {ERROR_LOADING_PORTFOLIOS_LIST_PREFIX} {typeof error === 'object' ? error.message : String(error)}
        </div>
      )}
      
      {/* Conditional Rendering for Empty Portfolio List (and not loading, no error) */}
      {!isLoading && !error && portfolios.length === 0 && (
        <p className={`text-center py-4 ${theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-500'}`}>{EMPTY_PORTFOLIOS_LIST}</p>
      )}

      {/* Display Portfolio List if available, not loading, and no error. */}
      {!isLoading && !error && portfolios.length > 0 && (
        // Scrollable list container that takes remaining vertical space.
        <ul className="space-y-2 overflow-y-auto flex-grow">
          {portfolios.map(portfolio => {
            // Determine if the current portfolio in the list is the active one.
            const isActive = String(portfolio.portfolio_id) === String(portfolioId);
            
            // Define base and theme-specific classes for portfolio items.
            const baseClasses = 'w-full text-left p-2 rounded focus:outline-none focus:ring-2 transition-colors duration-150';
            let themeItemClasses = ''; // For hover and general theme text.
            let activeItemClasses = '';  // For the currently active/selected item.
            let inactiveItemClasses = ''; // For non-active items.
            let borderItemClass = 'border-l-4 border-transparent'; // Left border to indicate active state.

            // Apply styling based on theme and active state.
            if (theme === 'high-contrast') {
              themeItemClasses = 'hover:bg-gray-700 focus:ring-primary-400';
              if (isActive) {
                activeItemClasses = 'bg-primary-600 text-white font-semibold';
                borderItemClass = 'border-l-4 border-primary-400'; // Active border color for high contrast.
              } else {
                inactiveItemClasses = 'text-gray-100'; // Text color for inactive items in high contrast.
              }
            } else { // Default theme
              themeItemClasses = 'hover:bg-primary-50 focus:ring-primary-300';
              if (isActive) {
                activeItemClasses = 'bg-primary-100 text-primary-700 font-semibold';
                borderItemClass = 'border-l-4 border-primary-500'; // Active border color for default theme.
              } else {
                inactiveItemClasses = 'text-gray-800'; // Text color for inactive items in default theme.
              }
            }

            return (
              // Each portfolio is a list item containing a button for navigation.
              <li key={portfolio.portfolio_id} className="list-none">
                <button
                  type="button"
                  // Combine all classes: base, theme-specific, active/inactive, and border.
                  className={`${baseClasses} ${themeItemClasses} ${isActive ? activeItemClasses : inactiveItemClasses} ${borderItemClass}`}
                  onClick={() => navigate(`/portfolio/${portfolio.portfolio_id}`)} // Navigate to the selected portfolio's workspace.
                >
                  {portfolio.name} {/* Display portfolio name. */}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// This component sources its data primarily from global stores (Zustand) and context,
// and does not receive direct props for its core functionality. Thus, PropTypes are not defined here.
export default NavigationPanel;
