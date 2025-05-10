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

const useAuthStore = create(set => ({
  ...getInitialState(), // Initialize state from localStorage
  isLoading: false,
  error: null,

  login: async credentials => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);

      if (data && data.access_token && data.user) {
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        console.error('Login response missing access token or user data.', data);
        localStorage.removeItem('accessToken'); // Ensure clean state if login data is incomplete
        localStorage.removeItem('user');
        throw new Error('Login failed: Incomplete data received.');
      }

      set({ user: data.user, isAuthenticated: true, isLoading: false, error: null });
    } catch (error) {
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, error: null, isLoading: false });
    authService.logout().catch(error => {
      // Even if backend logout fails, client-side cleanup has occurred.
      // Log the error or display a notification to the user if necessary.
      console.error('Backend logout failed:', error);
      // You might want to set an error state here if needed for the UI
      // set({ error: 'Backend logout failed. Please try again or contact support.' });
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useAuthStore;
