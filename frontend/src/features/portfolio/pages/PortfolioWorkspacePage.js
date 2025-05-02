import React from 'react';
import NavigationPanel from '../panels/NavigationPanel';
import MainContentPanel from '../panels/MainContentPanel';
import ProjectionPanel from '../panels/ProjectionPanel';

function PortfolioWorkspacePage() {
  return (
    // Apply grid layout: Nav=1, Main=2, Proj=1 (total 4 cols)
    <div className="grid grid-cols-4 gap-4 h-screen p-4 bg-gray-100">
      {/* Navigation Panel (takes 1 column) */}
      <div className="col-span-1 bg-white rounded shadow p-4">
        <NavigationPanel />
      </div>

      {/* Main Content Panel (takes 2 columns) */}
      <div className="col-span-2 bg-white rounded shadow p-4">
        <MainContentPanel />
      </div>

      {/* Projection Panel (takes 1 column) */}
      <div className="col-span-1 bg-white rounded shadow p-4">
        <ProjectionPanel />
      </div>
    </div>
  );
}

export default PortfolioWorkspacePage; 