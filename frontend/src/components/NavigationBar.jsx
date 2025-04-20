import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './NavigationBar.css';
import {
  HomeIcon,
  BriefcaseIcon,
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

function NavigationBar() {
  const { isAuthenticated, user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <NavLink to="/">InvestPro</NavLink>
        </div>

        {isAuthenticated && (
          <nav className="navbar-nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <HomeIcon className="nav-icon" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/portfolios" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <BriefcaseIcon className="nav-icon" />
              <span>Portfolios</span>
            </NavLink>
          </nav>
        )}

        <div className="navbar-actions">
          <button onClick={toggleTheme} className="theme-toggle-button" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? <MoonIcon className="theme-icon" /> : <SunIcon className="theme-icon" />}
          </button>
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-greeting">
                 <UserCircleIcon className="user-icon" />
                 <span>Welcome, {user?.username || 'User'}!</span>
              </span>
              <button
                className="logout-button"
                onClick={handleLogout}
                disabled={authLoading}
                title="Logout"
              >
                <ArrowLeftOnRectangleIcon className="logout-icon" />
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <NavLink to="/login" className="nav-link">Login</NavLink>
              <NavLink to="/register" className="nav-link">Register</NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default NavigationBar; 