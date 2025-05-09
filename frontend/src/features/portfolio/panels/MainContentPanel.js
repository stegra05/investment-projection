import React, { useState } from 'react';
import RiskProfileDisplay from '../components/RiskProfileDisplay';
import AssetsView from '../views/AssetsView'; // Import the actual component
import ChangesView from '../views/ChangesView'; // Import the new ChangesView
import PropTypes from 'prop-types'; // Import PropTypes

// Placeholder components (remove AssetsView placeholder)
// const AssetsView = () => <div>Assets View Placeholder</div>; // Removed placeholder
// const ChangesView = () => <div>Planned Changes View Placeholder</div>; // Removed placeholder

const OverviewSettingsView = () => (
  <div className="space-y-6">
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Portfolio Overview</h2>
      <div className="space-y-4">
        {/* Placeholder for other overview content */}
        <div>Portfolio summary and key metrics will go here</div>
      </div>
    </div>

    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Risk Analysis</h2>
      <RiskProfileDisplay />
    </div>

    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Portfolio Settings</h2>
      <div className="space-y-4">
        {/* Placeholder for settings content */}
        <div>Portfolio settings and configuration will go here</div>
      </div>
    </div>
  </div>
);

function MainContentPanel({ activeView, setActiveView, portfolioLoaded }) { // Accept props
  // const [activeView, setActiveView] = useState('assets'); // Remove local state

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
      {/* Navigation Buttons (Segmented Control Style) */}
      {portfolioLoaded && ( // Only show tabs if portfolio is loaded
        <div className="inline-flex rounded-md shadow-sm mb-4" role="group">
          <button
            type="button"
            className={getButtonClass('assets')}
            onClick={() => setActiveView('assets')}
          >
            Assets
          </button>
          <button
            type="button"
            className={getButtonClass('changes')}
            onClick={() => setActiveView('changes')}
          >
            Planned Changes
          </button>
          <button
            type="button"
            className={getButtonClass('overview')}
            onClick={() => setActiveView('overview')}
          >
            Overview & Settings
          </button>
        </div>
      )}

      {/* Content Area */}
      {portfolioLoaded ? (
        <div className="flex-grow border-t pt-4">{views[activeView]}</div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500">Loading portfolio content...</p> { /* Or handle based on error state */ }
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
