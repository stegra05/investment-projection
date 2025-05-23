import React from 'react';
import PropTypes from 'prop-types';
import NotificationContainer from '../Notification/NotificationContainer.jsx';

/**
 * @component Layout
 * @description Provides a consistent top-level structure and styling for all pages in the application.
 * It sets a minimum screen height, applies default background and text colors,
 * centers the main content within a responsive container, and includes the `NotificationContainer`
 * for displaying global notifications.
 *
 * @example
 * // In App.js or a route definition
 * <Layout>
 *   <MyPageComponent />
 * </Layout>
 *
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The page content to be rendered within the layout. Required.
 *
 * @returns {JSX.Element} The rendered layout structure with the provided children and global notification container.
 */
const Layout = ({ children }) => (
  // Main wrapper div: sets minimum height for the viewport and default background/text colors.
  <div className="min-h-screen bg-gray-50 text-gray-900">
    {/* Optional: Placeholder for a consistent application header. */}
    {/* <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">App Header</div>
        </header> */}
    
    {/* Main content area: uses a responsive container with horizontal padding and vertical spacing. */}
    <main className="container mx-auto px-4 py-8">
      {children}
    </main>
    
    {/* Optional: Placeholder for a consistent application footer. */}
    {/* <footer className="bg-gray-100 border-t border-gray-200">
          <div className="container mx-auto px-4 py-4 text-center text-sm">App Footer</div>
        </footer> */}
    
    {/* Global container for displaying notifications (toasts) throughout the application. */}
    <NotificationContainer />
  </div>
);

// PropTypes for type-checking and component documentation.
Layout.propTypes = {
  /** The content to be rendered within the main part of the layout. Typically a page component. */
  children: PropTypes.node.isRequired,
};

export default Layout;
