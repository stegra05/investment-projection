import { create } from 'zustand';
import authService from '../api/authService';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      
      // Store token in localStorage
      if (data && data.access_token) {
        localStorage.setItem('accessToken', data.access_token);
      } else {
        // Handle case where token is missing, maybe throw error or log
        console.error('Login successful but access token not found in response.');
        // Optionally, you could throw an error here to be caught below
        // throw new Error('Access token missing from login response.');
      }

      // Update state on successful login
      set({ user: data.user, isAuthenticated: true, isLoading: false, error: null });
    } catch (error) {
      // Clear potentially stale token on login failure
      localStorage.removeItem('accessToken');
      set({ 
        error: error.message || 'Login failed', 
        isLoading: false, 
        user: null, 
        isAuthenticated: false, 
      });
    }
  },

  logout: () => {
    // Remove token from localStorage
    localStorage.removeItem('accessToken');
    // Reset authentication state
    set({ user: null, isAuthenticated: false, error: null });
    // Optionally: Could call a backend logout endpoint via authService if one exists
    // authService.logout(); 
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useAuthStore; 