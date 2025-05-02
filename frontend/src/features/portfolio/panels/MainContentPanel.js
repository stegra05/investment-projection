import React, { useState } from 'react';

// Placeholder components (replace with actual imports later)
const AssetsView = () => <div>Assets View Placeholder</div>;
const ChangesView = () => <div>Planned Changes View Placeholder</div>;
const OverviewSettingsView = () => <div>Overview/Settings Placeholder</div>;

function MainContentPanel() {
  const [activeView, setActiveView] = useState('assets'); // Default view

  const views = {
    assets: <AssetsView />,
    changes: <ChangesView />,
    overview: <OverviewSettingsView />,
  };

  const getButtonClass = (viewName) => {
    const baseStyle = 'py-2 px-4 text-sm font-medium focus:outline-none focus:z-10 focus:ring-2 focus:ring-primary-300';
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
      <div className="flex-grow border-t pt-4">
        {views[activeView]}
      </div>
    </div>
  );
}

export default MainContentPanel; 