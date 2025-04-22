import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import NavigationRail from './NavigationRail';
import BottomNavigationBar from './BottomNavigationBar';
import './NavigationBar.css';
import {
  HomeIcon,
  BriefcaseIcon,
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

// M3 Transition Values (approximate from index.css)
const m3EaseStandard = [0.4, 0.0, 0.2, 1];
const m3DurationMedium2 = 0.3; // 300ms

function NavigationBar() {
  const { isAuthenticated, user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const breakpoint = useBreakpoint();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define nav items for easier mapping
  const navItems = [
    { to: "/", icon: HomeIcon, label: "Dashboard" },
    { to: "/portfolios", icon: BriefcaseIcon, label: "Portfolios" },
  ];

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <NavLink to="/">InvestPro</NavLink>
          </div>

          {isAuthenticated && breakpoint === 'large' && (
            <motion.nav className="navbar-nav">
              {navItems.map((item) => {
                const NavIcon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div
                            className="active-indicator-pill"
                            layoutId="activeNavLinkIndicator"
                            transition={{
                              duration: m3DurationMedium2,
                              ease: m3EaseStandard,
                            }}
                          />
                        )}
                        <NavIcon className="nav-icon" />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </motion.nav>
          )}

          <div className="navbar-actions">
            <button onClick={toggleTheme} className="theme-toggle-button" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? <MoonIcon className="theme-icon" /> : <SunIcon className="theme-icon" />}
            </button>
            {isAuthenticated ? (
              <div className="user-menu">
                {breakpoint === 'large' && (
                    <span className="user-greeting">
                      <UserCircleIcon className="user-icon" />
                      <span>Welcome, {user?.username || 'User'}!</span>
                    </span>
                )}
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

      {isAuthenticated && breakpoint === 'medium' && (
        <NavigationRail navItems={navItems} />
      )}

      {isAuthenticated && breakpoint === 'small' && (
        <BottomNavigationBar navItems={navItems} />
      )}
    </>
  );
}

export default NavigationBar; 