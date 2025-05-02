import { create } from 'zustand';
import authService from '../api/authService';

// Helper function to safely parse JSON from localStorage
const getInitialState = () => {
  const token = localStorage.getItem('accessToken');
  const userString = localStorage.getItem('user');
  let user = null;

  if (token && userString) {
    try {
      user = JSON.parse(userString);
      // TODO: Add token validation/decoding here if needed (e.g., check expiry)
      // For now, presence implies authenticated initial state
      return { user, isAuthenticated: true };
    } catch (error) {
      console.error('Failed to parse user data from localStorage', error);
      // Clear potentially corrupted data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      return { user: null, isAuthenticated: false };
    }
  }
  return { user: null, isAuthenticated: false };
};


const useAuthStore = create((set) => ({
  ...getInitialState(), // Initialize state from localStorage
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      
      // Store token and user data in localStorage
      if (data && data.access_token && data.user) {
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user)); // Store user as JSON string
      } else {
        console.error('Login response missing access token or user data.', data);
        localStorage.removeItem('accessToken'); // Ensure clean state if login data is incomplete
        localStorage.removeItem('user');
        throw new Error('Login failed: Incomplete data received.'); 
      }

      // Update state on successful login
      set({ user: data.user, isAuthenticated: true, isLoading: false, error: null });
    } catch (error) {
      // Clear token and user on login failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      set({ 
        error: error.message || 'Login failed', 
        isLoading: false, 
        user: null, 
        isAuthenticated: false, 
      });
    }
  },

  logout: () => {
    // Remove token and user data from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    // Reset authentication state
    set({ user: null, isAuthenticated: false, error: null, isLoading: false }); // Also reset isLoading
    // Optionally: Could call a backend logout endpoint via authService if one exists
    // authService.logout(); 
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useAuthStore; 