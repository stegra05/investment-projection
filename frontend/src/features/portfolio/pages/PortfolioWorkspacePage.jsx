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

/**
 * PortfolioWorkspacePage component.
 * This page serves as the main workspace for a single investment portfolio.
 * It uses a three-pane resizable layout to display navigation, main content (like assets or planned changes),
 * and financial projections. Portfolio data is sourced via `usePortfolio` context.
 * Layout preferences and active view are persisted to localStorage.
 * @returns {JSX.Element} The rendered portfolio workspace.
 */
function PortfolioWorkspacePage() {
  // Get `portfolioId` from the current route URL (e.g., /portfolio/123).
  const { portfolioId } = useParams(); 
  // Access portfolio data and its loading status from the PortfolioContext.
  // `rawPortfolioData` holds the detailed portfolio object (or null if not loaded/found).
  // `isPortfolioLoading` indicates if the core portfolio data is currently being fetched.
  const { 
    portfolio: rawPortfolioData, 
    isLoading: isPortfolioLoading, // Renamed for clarity from context's `loading`
  } = usePortfolio();

  // --- Local State Management ---
  // State for managing the relative sizes of the Allotment panes.
  // Initialized with default sizes, then potentially overridden by values from localStorage.
  const [paneSizes, setPaneSizes] = useState(defaultSizes);
  // State for the active view key (e.g., 'assets', 'plannedChanges') displayed in the MainContentPanel.
  // Initialized from localStorage to remember the user's last active view, or defaults to 'assets'.
  const [activeMainView, setActiveMainView] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_VIEW) || 'assets';
  });
  // Ref for the Allotment component instance, allowing programmatic control (e.g., resetting pane sizes).
  const allotmentRef = useRef(null);

  // Effect hook to load saved layout (pane) sizes from localStorage when the component mounts.
  useEffect(() => {
    const savedSizes = localStorage.getItem(STORAGE_KEY_LAYOUT);
    if (savedSizes) {
      try {
        const parsedSizes = JSON.parse(savedSizes);
        // Validate the saved sizes before applying them.
        if (
          Array.isArray(parsedSizes) &&
          parsedSizes.length === 3 && // Validate: must be an array of 3 numbers.
          parsedSizes.every(n => typeof n === 'number')
        ) {
          setPaneSizes(parsedSizes); // Apply saved sizes if valid.
        } else {
          // If data in localStorage is invalid (e.g., wrong format, wrong length),
          // log a warning and remove the corrupted item to prevent future errors.
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
    setPaneSizes(newSizes); // Update state with the new sizes after drag.
  };

  // Effect hook to save the `activeMainView` to localStorage whenever it changes.
  // This ensures the user's selected view persists across sessions for this workspace.
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
        allotmentRef.current?.reset(); // Use Allotment's API to reset to initial/default sizes.
        setPaneSizes(defaultSizes); // Update local state to reflect these default sizes.
        localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(defaultSizes)); // Persist the reset state.
      };

      // Add double-click event listeners to each sash for layout reset.
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

  // --- Conditional Rendering for Loading/Error States ---

  // Display message if portfolio data is unavailable and not currently loading.
  // This can happen if fetching failed or if `portfolioId` is invalid.
  // `usePortfolio` context handles the actual error state internally.
  if (!rawPortfolioData && !isPortfolioLoading) {
    return <div className="p-4 text-center text-red-600">{INFO_PORTFOLIO_DATA_UNAVAILABLE}</div>;
  }

  // Display a loading indicator if portfolio data is being fetched and not yet available.
  // This typically covers the initial load of the page.
  if (isPortfolioLoading && !rawPortfolioData) {
    // TODO: Consider replacing with a more sophisticated full-page skeleton loader or spinner component
    // for better user experience during initial data fetch.
    return <div className="p-4 text-center text-gray-600">{INFO_LOADING_PORTFOLIO_DATA}</div>;
  }
  
  // --- Main Workspace UI Rendering ---
  // This section renders if portfolio data is available or if it's loading but some (potentially stale)
  // data is already present (e.g., during a refresh).
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
      <div className="flex-grow min-h-0"> {/* This div ensures Allotment takes up remaining space and handles overflow. */}
        {/* Allotment component for managing the three-pane resizable layout. */}
        <Allotment ref={allotmentRef} defaultSizes={paneSizes} onDragEnd={handleDragEnd}>
          {/* Navigation Panel (Left Pane) */}
          <Allotment.Pane minSize={200} maxSize={600}>
            <div className="h-full bg-white rounded shadow p-4 overflow-auto">
              {/* NavigationPanel displays portfolio-specific navigation links (e.g., to Assets, Planned Changes). */}
              <NavigationPanel />
            </div>
          </Allotment.Pane>
          {/* Main Content Panel (Center Pane) */}
          <Allotment.Pane minSize={300}>
            <div className="h-full bg-white rounded shadow p-4 overflow-auto">
              {/* MainContentPanel displays the content corresponding to the `activeMainView`. */}
              <MainContentPanel 
                activeView={activeMainView} // Currently selected view (e.g., 'assets', 'plannedChanges').
                setActiveView={setActiveMainView} // Function to update the active view.
                // `portfolioLoaded` indicates if the main portfolio data is available,
                // allowing child components to render appropriately.
                portfolioLoaded={!!rawPortfolioData} 
              />
            </div>
          </Allotment.Pane>
          {/* Projection Panel (Right Pane) */}
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