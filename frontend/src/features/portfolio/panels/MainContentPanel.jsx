import React from 'react';
import PropTypes from 'prop-types';
// Child view components that this panel can render:
import AssetsView from '../views/AssetsView'; 
import ChangesView from '../views/ChangesView'; 
import OverviewSettingsView from '../views/OverviewSettingsView'; 
import useTheme from '../../../hooks/useTheme'; // Hook for accessing theme state.
import Button from '../../../components/Button/Button'; // Reusable Button component.
import { // UI text constants for button labels and loading messages.
  BUTTON_ASSETS,
  BUTTON_PLANNED_CHANGES,
  BUTTON_OVERVIEW_SETTINGS,
  LOADING_PORTFOLIO_CONTENT,
} from '../../../constants/textConstants';
// Note: Unused imports like RiskProfileDisplay and various HEADING constants were removed.

/**
 * @component MainContentPanel
 * @description This component serves as the central content display area within the portfolio workspace.
 * It features a tab-like button group to switch between different views related to a portfolio:
 * Assets, Planned Changes, and Overview/Settings. The actual content for each view is rendered
 * by respective child components (`AssetsView`, `ChangesView`, `OverviewSettingsView`).
 * It displays a loading message if the main portfolio data isn't yet loaded and applies theming.
 *
 * @example
 * <MainContentPanel
 *   activeView="assets"
 *   setActiveView={handleViewChange}
 *   portfolioLoaded={isDataReady}
 * />
 *
 * @param {object} props - The component's props.
 * @param {string} props.activeView - A string key identifying the currently active view (e.g., 'assets', 'changes', 'overview'). Required.
 * @param {Function} props.setActiveView - Callback function to change the active view. Receives the new view key as an argument. Required.
 * @param {boolean} props.portfolioLoaded - Boolean indicating if the main portfolio data has been loaded.
 *                                          If false, a loading message is displayed instead of the view content. Required.
 *
 * @returns {JSX.Element} The rendered main content panel with view navigation and content area.
 */
function MainContentPanel({ activeView, setActiveView, portfolioLoaded }) {
  // Access the current theme (e.g., 'light', 'dark', 'high-contrast') for styling.
  const { theme } = useTheme(); 

  // A map associating view keys with their corresponding React components.
  // This allows for dynamic rendering of the active view.
  const views = {
    assets: <AssetsView />,           // Component for displaying portfolio assets.
    changes: <ChangesView />,         // Component for displaying planned financial changes.
    overview: <OverviewSettingsView />, // Component for portfolio overview and settings.
  };

  // Note: The previous getButtonClass function was removed as styling is now handled
  // by the Button component's `variant` and `isActive` props, along with specific
  // className overrides for grouped button appearance.
  // Theme-specific styling for these buttons (beyond what Button component provides)
  // would be managed via Button's props or dedicated theme variants if needed.

  return (
    // Main container for the panel, applying flex layout, theming, and styling.
    <div className={`flex flex-col h-full p-4 rounded shadow ${theme === 'high-contrast' ? 'bg-gray-800' : 'bg-white'}`}>
      {/* View navigation button group: only shown if portfolio data is loaded. */}
      {portfolioLoaded && (
        <div className="inline-flex rounded-md shadow-sm mb-4" role="group" aria-label="Portfolio Views">
          {/* Button to switch to Assets view. */}
          <Button
            variant="outline-select" // Uses a specific variant for selectable outline buttons.
            size="default" 
            onClick={() => setActiveView('assets')} // Sets 'assets' as the active view.
            isActive={activeView === 'assets'} // True if this is the currently active view.
            // Custom classes for grouped button effect: removes right rounding, negative margin for overlap.
            className="rounded-r-none -mr-px focus:z-10" 
          >
            {BUTTON_ASSETS}
          </Button>
          {/* Button to switch to Planned Changes view. */}
          <Button
            variant="outline-select"
            size="default"
            onClick={() => setActiveView('changes')} // Sets 'changes' as the active view.
            isActive={activeView === 'changes'}
            // Custom classes: removes all rounding for middle button, negative margin, focus behavior.
            className="rounded-none -mr-px focus:z-10"
          >
            {BUTTON_PLANNED_CHANGES}
          </Button>
          {/* Button to switch to Overview & Settings view. */}
          <Button
            variant="outline-select"
            size="default"
            onClick={() => setActiveView('overview')} // Sets 'overview' as the active view.
            isActive={activeView === 'overview'}
            // Custom classes: removes left rounding, focus behavior.
            className="rounded-l-none focus:z-10"
          >
            {BUTTON_OVERVIEW_SETTINGS}
          </Button>
        </div>
      )}

      {/* Content Area: Renders the active view or a loading message. */}
      {portfolioLoaded ? (
        // If portfolio data is loaded, render the component associated with the `activeView` key.
        // Includes a themed top border.
        <div className={`flex-grow ${theme === 'high-contrast' ? 'border-gray-600' : 'border-gray-200'} border-t pt-4`}>
          {views[activeView]}
        </div>
      ) : (
        // If portfolio data is not loaded, display a loading message.
        // Centers the message within the content area.
        <div className="flex-grow flex items-center justify-center">
          <p className={`${theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-500'}`}>
            {LOADING_PORTFOLIO_CONTENT} {/* Text from constants. */}
            {/* TODO: Could also display an error message here if portfolio loading failed, based on an error prop. */}
          </p>
        </div>
      )}
    </div>
  );
}

// PropTypes for type-checking and component documentation.
MainContentPanel.propTypes = {
  /** 
   * A string key that determines which view is currently active and should be rendered.
   * Expected values: 'assets', 'changes', 'overview'. Required.
   */
  activeView: PropTypes.string.isRequired,
  /** 
   * Callback function to be invoked when the user clicks a view navigation button.
   * It receives the key of the new view to be activated (e.g., 'assets') as an argument. Required.
   */
  setActiveView: PropTypes.func.isRequired,
  /** 
   * Boolean flag indicating whether the essential portfolio data (that this panel's views depend on)
   * has been successfully loaded. If false, a loading message is displayed. Required.
   */
  portfolioLoaded: PropTypes.bool.isRequired,
};

export default MainContentPanel;
