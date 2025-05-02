import React from 'react';
import PropTypes from 'prop-types';

const Layout = ({ children }) => (
  <div className="min-h-screen bg-gray-50 text-gray-900">
    {/* Optional: Add a consistent container or header/footer here */}
    {/* <header>...</header> */}
    <main className="container mx-auto px-4 py-8">
      {children}
    </main>
    {/* <footer>...</footer> */}
  </div>
);

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout; 