import React, { useState } from 'react';
import RiskProfileDisplay from '../components/RiskProfileDisplay';
import AssetsView from '../views/AssetsView'; // Import the actual component
import ChangesView from '../views/ChangesView'; // Import the new ChangesView

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

function MainContentPanel() {
  const [activeView, setActiveView] = useState('assets'); // Default view

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

      {/* Content Area */}
      <div className="flex-grow border-t pt-4">{views[activeView]}</div>
    </div>
  );
}

export default MainContentPanel;
