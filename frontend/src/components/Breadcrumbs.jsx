import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';
import './Breadcrumbs.css'; // We will create this CSS file next

// Helper function to capitalize words
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Don't show breadcrumbs on root or simple top-level paths like /login
  if (pathnames.length === 0 || (pathnames.length === 1 && [
    'login', 'register', 'request-password-reset', 'reset-password', 'portfolios'
  ].includes(pathnames[0]))) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs-container">
      <ol className="breadcrumbs-list">
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            <HomeIcon className="breadcrumb-icon" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          // Basic logic to handle potential UUIDs or numbers in paths
          let displayValue = value;
          if (value.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/) || !isNaN(value)) {
            // Try to get a more meaningful name if possible (e.g., from state or parent component)
            // For now, we might just display "Details" or "Edit"
            if (pathnames[index-1] === 'portfolios') {
              displayValue = last && pathnames[index+1] === 'edit' ? 'Details' : (last ? 'Details' : 'Portfolio');
              if(last && value === 'edit') displayValue = 'Edit';
              if(last && value === 'new') displayValue = 'New'; // Handle /new path
            }
            // Add more specific logic here if needed for other routes
          } else {
            displayValue = capitalize(value.replace(/-/g, ' ')); // Replace dashes and capitalize
            if(value === 'new') displayValue = 'New'; // Handle /new path
          }

          return (
            <li key={to} className="breadcrumb-item">
              <span className="breadcrumb-separator" aria-hidden="true">/</span>
              {last ? (
                <span className="breadcrumb-current" aria-current="page">
                  {displayValue}
                </span>
              ) : (
                <Link to={to} className="breadcrumb-link">
                  {displayValue}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs; 