import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RegistrationPage from './pages/RegistrationPage';
import RequestPasswordResetPage from './pages/RequestPasswordResetPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PortfolioListPage from './pages/PortfolioListPage';
import PortfolioDetailPage from './pages/PortfolioDetailPage';
import PortfolioForm from './components/PortfolioForm';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css'; // Keep default styles for now

function App() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div>
      <nav>
        <ul>
          {isAuthenticated ? (
            <>
              <li>
                <Link to="/">Dashboard</Link>
              </li>
              <li>
                <Link to="/portfolios">Portfolios</Link>
              </li>
              <li>
                <span>Welcome, {user?.username || 'User'}!</span>
              </li>
              <li>
                <button onClick={handleLogout} disabled={loading}>
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      <hr />

      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/portfolios" 
          element={
            <ProtectedRoute>
              <PortfolioListPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/portfolios/new" 
          element={
            <ProtectedRoute>
              <PortfolioForm />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/portfolios/:id" 
          element={
            <ProtectedRoute>
              <PortfolioDetailPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/portfolios/:id/edit" 
          element={
            <ProtectedRoute>
              <PortfolioForm />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Routes>
    </div>
  );
}

export default App; 