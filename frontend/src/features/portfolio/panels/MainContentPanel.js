import React from 'react';
// import RiskProfileDisplay from '../components/RiskProfileDisplay'; // Removed unused import
import AssetsView from '../views/AssetsView'; // Import the actual component
import ChangesView from '../views/ChangesView'; // Import the new ChangesView
import OverviewSettingsView from '../views/OverviewSettingsView'; // Import the actual OverviewSettingsView
import PropTypes from 'prop-types'; // Import PropTypes
import useTheme from '../../../hooks/useTheme'; // Import useTheme
import Button from '../../../components/Button/Button'; // Import Button component
import {
  // HEADING_PORTFOLIO_OVERVIEW, // Removed unused import
  // PLACEHOLDER_PORTFOLIO_SUMMARY, // Removed unused import
  // HEADING_RISK_ANALYSIS, // Removed unused import
  // HEADING_PORTFOLIO_SETTINGS, // Removed unused import
  // PLACEHOLDER_PORTFOLIO_SETTINGS, // Removed unused import
  BUTTON_ASSETS,
  BUTTON_PLANNED_CHANGES,
  BUTTON_OVERVIEW_SETTINGS,
  LOADING_PORTFOLIO_CONTENT,
} from '../../../constants/textConstants';

function MainContentPanel({ activeView, setActiveView, portfolioLoaded }) {
  const { theme } = useTheme(); // Get theme state, will be used for wrapper, not button directly for now

  const views = {
    assets: <AssetsView />,
    changes: <ChangesView />,
    overview: <OverviewSettingsView />,
  };

  // The getButtonClass function is no longer needed as we use the Button component
  // High-contrast theme specific styling for these buttons will be deferred for now.

  return (
    <div className={`flex flex-col h-full p-4 rounded shadow ${theme === 'high-contrast' ? 'bg-gray-800' : 'bg-white'}`}>
      {portfolioLoaded && (
        <div className="inline-flex rounded-md shadow-sm mb-4" role="group">
          <Button
            variant="outline-select"
            size="default" // Using default size for py-2 px-4 padding
            onClick={() => setActiveView('assets')}
            isActive={activeView === 'assets'}
            // Apply specific rounding and remove Button's default rounding for group effect
            className="rounded-r-none -mr-px focus:z-10"
          >
            {BUTTON_ASSETS}
          </Button>
          <Button
            variant="outline-select"
            size="default"
            onClick={() => setActiveView('changes')}
            isActive={activeView === 'changes'}
            className="rounded-none -mr-px focus:z-10"
          >
            {BUTTON_PLANNED_CHANGES}
          </Button>
          <Button
            variant="outline-select"
            size="default"
            onClick={() => setActiveView('overview')}
            isActive={activeView === 'overview'}
            className="rounded-l-none focus:z-10"
          >
            {BUTTON_OVERVIEW_SETTINGS}
          </Button>
        </div>
      )}

      {/* Content Area */}
      {portfolioLoaded ? (
        <div className={`flex-grow ${theme === 'high-contrast' ? 'border-gray-600' : 'border-gray-200'} border-t pt-4`}>{views[activeView]}</div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className={`${theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-500'}`}>{LOADING_PORTFOLIO_CONTENT}</p> { /* Or handle based on error state */ }
        </div>
      )}
    </div>
  );
}

// Add PropTypes
MainContentPanel.propTypes = {
  activeView: PropTypes.string.isRequired,
  setActiveView: PropTypes.func.isRequired,
  portfolioLoaded: PropTypes.bool.isRequired,
};

export default MainContentPanel;
