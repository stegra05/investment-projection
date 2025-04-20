import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RegistrationPage from './pages/RegistrationPage';
import RequestPasswordResetPage from './pages/RequestPasswordResetPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PortfolioListPage from './pages/PortfolioListPage';
import PortfolioDetailPage from './pages/PortfolioDetailPage';
import PortfolioForm from './components/PortfolioForm';
import ProtectedRoute from './components/ProtectedRoute';
import NavigationBar from './components/NavigationBar';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function AppContent() {
  const location = useLocation();

  const noNavbarPaths = [
    // Example: '/landing',
  ];
  const showNavbar = !noNavbarPaths.includes(location.pathname);

  return (
    <div className="app-container">
      {showNavbar && <NavigationBar />}
      <main className="main-app-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          <Route 
            path="/" 
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
          />
          <Route 
            path="/portfolios"
            element={<ProtectedRoute><PortfolioListPage /></ProtectedRoute>}
          />
          <Route 
            path="/portfolios/new"
            element={<ProtectedRoute><PortfolioForm /></ProtectedRoute>}
          />
          <Route 
            path="/portfolios/:id"
            element={<ProtectedRoute><PortfolioDetailPage /></ProtectedRoute>}
          />
          <Route 
            path="/portfolios/:id/edit"
            element={<ProtectedRoute><PortfolioForm /></ProtectedRoute>}
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App; 