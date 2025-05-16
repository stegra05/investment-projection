import React from 'react';
import RiskProfileDisplay from '../components/RiskProfileDisplay';
import AssetsView from '../views/AssetsView'; // Import the actual component
import ChangesView from '../views/ChangesView'; // Import the new ChangesView
import OverviewSettingsView from '../views/OverviewSettingsView'; // Import the actual OverviewSettingsView
import PropTypes from 'prop-types'; // Import PropTypes
import {
  HEADING_PORTFOLIO_OVERVIEW,
  PLACEHOLDER_PORTFOLIO_SUMMARY,
  HEADING_RISK_ANALYSIS,
  HEADING_PORTFOLIO_SETTINGS,
  PLACEHOLDER_PORTFOLIO_SETTINGS,
  BUTTON_ASSETS,
  BUTTON_PLANNED_CHANGES,
  BUTTON_OVERVIEW_SETTINGS,
  LOADING_PORTFOLIO_CONTENT,
} from '../../../constants/textConstants';

function MainContentPanel({ activeView, setActiveView, portfolioLoaded }) {

  const views = {
    assets: <AssetsView />,
    changes: <ChangesView />,
    overview: <OverviewSettingsView />,
  };

  const getButtonClass = viewName => {
    const baseStyle =
      'py-2 px-4 text-sm font-medium focus:outline-none focus:z-10 focus:ring-2 focus:ring-primary-300';
    const activeStyle = 'bg-primary-100 text-primary-700 border border-primary-300';
    const inactiveStyle = 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50';

    // Apply specific border radius based on position
    let roundedStyle = '';
    if (viewName === 'assets') roundedStyle = 'rounded-l-lg';
    else if (viewName === 'overview') roundedStyle = 'rounded-r-lg';
    else roundedStyle = ''; // Middle button has no rounding on sides

    return `${baseStyle} ${roundedStyle} ${activeView === viewName ? activeStyle : inactiveStyle}`;
  };

  return (
    <div className="flex flex-col h-full p-4 bg-white rounded shadow">
      {portfolioLoaded && ( // Only show tabs if portfolio is loaded
        <div className="inline-flex rounded-md shadow-sm mb-4" role="group">
          <button
            type="button"
            className={getButtonClass('assets')}
            onClick={() => setActiveView('assets')}
          >
            {BUTTON_ASSETS}
          </button>
          <button
            type="button"
            className={getButtonClass('changes')}
            onClick={() => setActiveView('changes')}
          >
            {BUTTON_PLANNED_CHANGES}
          </button>
          <button
            type="button"
            className={getButtonClass('overview')}
            onClick={() => setActiveView('overview')}
          >
            {BUTTON_OVERVIEW_SETTINGS}
          </button>
        </div>
      )}

      {/* Content Area */}
      {portfolioLoaded ? (
        <div className="flex-grow border-t pt-4">{views[activeView]}</div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500">{LOADING_PORTFOLIO_CONTENT}</p> { /* Or handle based on error state */ }
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
