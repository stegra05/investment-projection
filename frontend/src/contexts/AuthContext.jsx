import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService'; // Import the service

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
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


  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      setToken(data.token);
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
      setUser(null);
    } catch (error) {
        console.error("Logout failed:", error);
        // Even if service call fails, clear client state
        setToken(null);
        setUser(null);
    } finally {
        setLoading(false);
    }
  };

  const value = {
    token,
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