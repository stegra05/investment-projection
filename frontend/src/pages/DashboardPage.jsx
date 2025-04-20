import React from 'react';
import './DashboardPage.css'; // Create this CSS file for dashboard specific styles

function DashboardPage() {
  return (
    <div className="dashboard-page">
      {/* Use H1 style for page title */}
      <h1 className="page-title">Dashboard</h1> 

      {/* Example Grid Layout for Dashboard Widgets */}
      <div className="dashboard-grid">
        {/* Example Card 1 */}
        <div className="dashboard-card">
          <h2 className="card-title">Portfolio Overview</h2>
          <p className="card-content">Placeholder for portfolio summary data or chart.</p>
          {/* TODO: Add chart or summary component */}
        </div>

        {/* Example Card 2 */}
        <div className="dashboard-card">
          <h2 className="card-title">Market Snapshot</h2>
          <p className="card-content">Placeholder for market data or news.</p>
          {/* TODO: Add market data component */}
        </div>

        {/* Example Card 3 */}
        <div className="dashboard-card">
          <h2 className="card-title">Recent Activity</h2>
          <p className="card-content">Placeholder for recent trades or alerts.</p>
          {/* TODO: Add activity feed component */}
        </div>

         {/* Example Card 4 */}
         <div className="dashboard-card">
          <h2 className="card-title">Performance</h2>
          <p className="card-content">Placeholder for performance chart.</p>
          {/* TODO: Add performance chart component */}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage; 