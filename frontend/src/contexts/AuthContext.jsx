import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService'; // Import the service (includes refreshAccessToken)
import { refreshAccessToken } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  // Store the refresh-token for sliding-window refresh
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [user, setUser] = useState(() => {
      const storedUser = localStorage.getItem('user');
      try {
          return storedUser ? JSON.parse(storedUser) : null;
      } catch (error) {
          console.error("Failed to parse user from localStorage", error);
          localStorage.removeItem('user'); // Clear invalid entry
          return null;
      }
  });
  const [loading, setLoading] = useState(false); // Optional: track loading state

  // Optional: Persist user to localStorage when it changes
  useEffect(() => {
      if (user) {
          localStorage.setItem('user', JSON.stringify(user));
      } else {
          localStorage.removeItem('user');
      }
  }, [user]);

   // Optional: Persist token to localStorage when it changes
   useEffect(() => {
    if (token) {
        localStorage.setItem('token', token);
        // Interceptor in authService handles adding token to requests
    } else {
        localStorage.removeItem('token');
        // Interceptor in authService won't add header if token is missing
    }
}, [token]);

  // Persist refresh token to localStorage when it changes
  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, [refreshToken]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      setToken(data.token);
      // Save refresh token for sliding-window refresh
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      setLoading(false);
      return data; // Return data for potential use in component
    } catch (error) {
      setLoading(false);
      console.error('Login failed:', error);
      // Rethrow the error so the component can handle it (e.g., show message)
      throw error; 
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout(); // Call service (might do nothing if only client-side)
      setToken(null);
      // Clear refresh token on logout
      setRefreshToken(null);
      setUser(null);
    } catch (error) {
        console.error("Logout failed:", error);
        // Even if service call fails, clear client state
        setToken(null);
        setRefreshToken(null);
        setUser(null);
    } finally {
        setLoading(false);
    }
  };

  // -------------- Sliding-Window Token Refresh --------------
  useEffect(() => {
    // Only set up if we have a refresh token
    if (!refreshToken) return;
    // Refresh every 10 minutes
    const intervalMs = 10 * 60 * 1000;
    const intervalId = setInterval(async () => {
      try {
        const newAccess = await refreshAccessToken(refreshToken);
        setToken(newAccess);
        console.debug('Refreshed access token');
      } catch (err) {
        console.error('Access token refresh failed, logging out:', err);
        // If refresh fails (e.g. expired), log the user out
        await logout();
      }
    }, intervalMs);
    return () => clearInterval(intervalId);
  }, [refreshToken]);

  const value = {
    token,
    refreshToken,
    user,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
}; 