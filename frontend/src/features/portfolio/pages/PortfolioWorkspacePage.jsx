import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom'; // For accessing route parameters and navigation.
import { Allotment } from 'allotment'; // For resizable pane layout.
import 'allotment/dist/style.css'; // Required styles for Allotment.
import { usePortfolio } from '../state/PortfolioContext'; // Context to access current portfolio data and loading state.
import NavigationPanel from '../panels/NavigationPanel.jsx'; // Left panel for portfolio navigation.
import MainContentPanel from '../panels/MainContentPanel.jsx'; // Center panel for displaying active view (Assets, Changes, etc.).
import ProjectionPanel from '../panels/ProjectionPanel.jsx'; // Right panel for financial projections.
import {
  BREADCRUMB_DASHBOARD,
  BREADCRUMB_PORTFOLIO_PREFIX,
  INFO_PORTFOLIO_DATA_UNAVAILABLE,
  INFO_LOADING_PORTFOLIO_DATA,
} from '../../../constants/textConstants'; // UI text constants.

// Keys for storing layout and active view preferences in localStorage.
const STORAGE_KEY_LAYOUT = 'portfolioWorkspaceLayoutSizes';
const STORAGE_KEY_ACTIVE_VIEW = 'portfolioWorkspaceActiveView';
// Default relative sizes for the three panes [Navigation, MainContent, Projection].
const defaultSizes = [1, 2, 1]; 

/**
 * @page PortfolioWorkspacePage
 * @description This page serves as the main workspace for viewing and managing a single investment portfolio.
 * It features a three-pane resizable layout (Navigation, Main Content, Projections) using the `Allotment` component.
 * Portfolio data is primarily sourced from `PortfolioProvider` via the `usePortfolio` context hook, which
 * handles fetching based on the `portfolioId` from the route.
 * The layout's pane sizes and the active view in the MainContentPanel are persisted to localStorage.
 * Breadcrumb navigation is provided for context.
 *
 * @example
 * // Typically rendered by a protected route that includes PortfolioProvider:
 * // <Route path="/portfolio/:portfolioId" element={<PortfolioProvider><PortfolioWorkspacePage /></PortfolioProvider>} />
 *
 * @returns {JSX.Element} The rendered portfolio workspace UI.
 */
function PortfolioWorkspacePage() {
  // Get `portfolioId` from the current route URL (e.g., /portfolio/123).
  const { portfolioId } = useParams();
  // Access portfolio data and loading state from the PortfolioContext.
  // `rawPortfolioData` is the detailed portfolio object; `portfolioLoading` indicates if it's being fetched.
  const { 
    portfolio: rawPortfolioData, 
    loading: portfolioLoading, 
  } = usePortfolio();

  // Local state for managing the relative sizes of the Allotment panes.
  // Initialized with default sizes, then potentially overridden by localStorage.
  const [sizes, setSizes] = useState(defaultSizes);
  // Local state for the active view displayed in the MainContentPanel (e.g., 'assets', 'plannedChanges').
  // Initialized from localStorage or defaults to 'assets'.
  const [activeMainView, setActiveMainView] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_VIEW) || 'assets';
  });
  // Ref for the Allotment component instance to allow programmatic control (e.g., reset).
  const allotmentRef = useRef(null);

  // `useEffect` to load saved layout sizes from localStorage on component mount.
  useEffect(() => {
    const savedSizes = localStorage.getItem(STORAGE_KEY_LAYOUT);
    if (savedSizes) {
      try {
        const parsedSizes = JSON.parse(savedSizes);
        // Validate the saved sizes before applying them.
        if (
          Array.isArray(parsedSizes) &&
          parsedSizes.length === 3 && // Expects three panes.
          parsedSizes.every(n => typeof n === 'number') // All elements must be numbers.
        ) {
          setSizes(parsedSizes);
        } else {
          // If invalid, log a warning and remove the faulty item from localStorage.
          console.warn('Invalid layout sizes found in localStorage, using defaults.');
          localStorage.removeItem(STORAGE_KEY_LAYOUT);
        }
      } catch (e) {
        // Handle JSON parsing errors.
        console.error('Failed to parse saved layout sizes, using defaults.', e);
        localStorage.removeItem(STORAGE_KEY_LAYOUT);
      }
    }
  }, []); // Empty dependency array: runs only on mount.

  /**
   * Handles the end of a drag operation on the Allotment sashes.
   * Saves the new pane sizes to localStorage and updates the local `sizes` state.
   * @param {number[]} newSizes - Array of new relative sizes for the panes.
   */
  const handleDragEnd = newSizes => {
    localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(newSizes));
    setSizes(newSizes);
  };

  // `useEffect` to save the active main view to localStorage whenever it changes.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_VIEW, activeMainView);
  }, [activeMainView]); // Dependency: runs when `activeMainView` changes.

  // `useEffect` to add a double-click listener to Allotment sashes for resetting layout.
  // This effect demonstrates interacting with the Allotment component's DOM structure.
  useEffect(() => {
    // Delay slightly to ensure Allotment sashes are rendered.
    const timer = setTimeout(() => {
      // Access the Allotment component's parent element to find sashes.
      const allotmentElement = allotmentRef.current?.parentElement;
      if (!allotmentElement) return;

      const sashes = allotmentElement.querySelectorAll('.allotment-sash'); // Selector for Allotment sashes.

      // Handler to reset layout to default sizes.
      const handleDoubleClick = () => {
        allotmentRef.current?.reset(); // Programmatically reset Allotment to its initial/default sizes.
        setSizes(defaultSizes); // Update local state to reflect default sizes.
        localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(defaultSizes)); // Save defaults to localStorage.
      };

      // Add double-click event listeners to each sash.
      sashes.forEach(sash => {
        sash.removeEventListener('dblclick', handleDoubleClick); // Remove any existing listener first.
        sash.addEventListener('dblclick', handleDoubleClick);
      });

      // Cleanup function: remove event listeners when component unmounts or effect re-runs.
      return () => {
        sashes.forEach(sash => {
          sash.removeEventListener('dblclick', handleDoubleClick);
        });
      };
    }, 100); // 100ms delay.

    return () => clearTimeout(timer); // Cleanup timeout on unmount/re-run.
  }, []); // Empty dependency array: runs once on mount, cleans up on unmount.

  // Conditional rendering for when portfolio data is unavailable (and not loading).
  // This might occur if an error happened during fetch or if the portfolio ID is invalid.
  if (!rawPortfolioData && !portfolioLoading) {
    return <div className="p-4 text-center text-red-600">{INFO_PORTFOLIO_DATA_UNAVAILABLE}</div>;
  }

  // Conditional rendering for the initial loading state when no data is yet available.
  if (portfolioLoading && !rawPortfolioData) {
    // TODO: Replace with a more sophisticated full-page skeleton loader or spinner.
    return <div className="p-4 text-center text-gray-600">{INFO_LOADING_PORTFOLIO_DATA}</div>;
  }
  
  // Main workspace UI rendering.
  return (
    // Full-screen flex container with padding and background color.
    <div className="flex flex-col h-screen p-4 bg-gray-100">
      {/* Breadcrumb Navigation Section */}
      <nav className="mb-4 text-sm text-gray-600 flex-shrink-0" aria-label="Breadcrumb">
        <ol className="list-none p-0 inline-flex">
          {/* Link to Dashboard */}
          <li className="flex items-center">
            <Link to="/dashboard" className="hover:text-blue-700 hover:underline">
              {BREADCRUMB_DASHBOARD}
            </Link>
          </li>
          <li className="flex items-center mx-2"> {/* Separator */}
            <span className="text-gray-400">/</span>
          </li>
          {/* Current Portfolio Name (or ID if name is loading/unavailable) */}
          <li className="flex items-center">
            <span className="font-medium text-gray-800" aria-current="page">
              {rawPortfolioData?.name || `${BREADCRUMB_PORTFOLIO_PREFIX} ${portfolioId}`}
            </span>
          </li>
        </ol>
      </nav>

      {/* Resizable Panes Area: takes remaining vertical space and prevents overflow. */}
      <div className="flex-grow min-h-0">
        {/* Allotment component for managing the three-pane layout. */}
        <Allotment ref={allotmentRef} defaultSizes={sizes} onDragEnd={handleDragEnd}>
          {/* Navigation Panel (Left) */}
          <Allotment.Pane minSize={200} maxSize={600}>
            <div className="h-full bg-white rounded shadow p-4 overflow-auto">
              <NavigationPanel />
            </div>
          </Allotment.Pane>
          {/* Main Content Panel (Center) */}
          <Allotment.Pane minSize={300}>
            <div className="h-full bg-white rounded shadow p-4 overflow-auto">
              <MainContentPanel 
                activeView={activeMainView} // Current active view (e.g., 'assets').
                setActiveView={setActiveMainView} // Callback to change the active view.
                portfolioLoaded={!!rawPortfolioData} // Pass loading status for conditional rendering inside panel.
              />
            </div>
          </Allotment.Pane>
          {/* Projection Panel (Right) */}
          <Allotment.Pane minSize={250} maxSize={800}>
            <div className="h-full bg-white rounded shadow p-4 overflow-auto">
              <ProjectionPanel />
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
}

// As a page-level component, PortfolioWorkspacePage typically does not receive props directly
// from other components but rather from routing (useParams) or global state (useContext),
// so PropTypes are not usually defined here.
export default PortfolioWorkspacePage;