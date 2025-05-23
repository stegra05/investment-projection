import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import LoginPage from './features/auth/pages/LoginPage.jsx';
import RegisterPage from './features/auth/pages/RegisterPage.jsx';
import DashboardPage from './features/dashboard/pages/DashboardPage.jsx';
import PortfolioWorkspacePage from './features/portfolio/pages/PortfolioWorkspacePage.jsx';
import { PortfolioProvider } from './features/portfolio/state/PortfolioContext.jsx';

/**
 * A simple layout component that provides a minimum height and background color.
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The child elements to render within the layout.
 * @returns {JSX.Element} The layout component.
 */
const Layout = ({ children }) => <div className="min-h-screen bg-gray-50">{children}</div>;

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * A component that protects routes requiring authentication.
 * If the user is not authenticated, it redirects to the login page.
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The child elements to render if the user is authenticated.
 * @returns {JSX.Element} The protected route component.
 */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * The main application component.
 * It sets up the router and defines the application's routes.
 * @returns {JSX.Element} The App component.
 */
function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio/:portfolioId"
          element={
            <ProtectedRoute>
              <PortfolioProvider>
                <PortfolioWorkspacePage />
              </PortfolioProvider>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App; 