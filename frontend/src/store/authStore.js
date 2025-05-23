import { create } from 'zustand'; // Zustand library for state management.
import authService from '../api/authService'; // API service for authentication requests.

/**
 * @file authStore.js
 * @description Zustand store for managing global authentication state and actions.
 * This store handles user authentication status, user information, loading states during auth processes,
 * and error messages. It persists authentication state to `localStorage` to maintain sessions
 * across browser refreshes and interacts with `authService` for backend communication.
 */

/**
 * Helper function to safely retrieve and parse initial authentication state from `localStorage`.
 * It checks for an `accessToken` and `user` data. If found and valid, it returns an
 * authenticated initial state. If data is missing, corrupted, or parsing fails, it ensures
 * `localStorage` is cleared of auth items and returns an unauthenticated state.
 *
 * @returns {object} An object with initial `user` (object|null) and `isAuthenticated` (boolean).
 */
const getInitialState = () => {
  const token = localStorage.getItem('accessToken');
  const userString = localStorage.getItem('user');
  let user = null;

  if (token && userString) { // Both token and user string must exist.
    try {
      user = JSON.parse(userString); // Attempt to parse user data.
      // TODO: Implement token validation/decoding here (e.g., check expiry using a library like jwt-decode).
      // For now, the presence of a token and user data implies an authenticated initial state.
      return { user, isAuthenticated: true };
    } catch (error) {
      // If parsing user data fails (e.g., corrupted JSON).
      console.error('Failed to parse user data from localStorage during initial state retrieval:', error);
      // Clear potentially corrupted authentication items from localStorage.
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      return { user: null, isAuthenticated: false }; // Return unauthenticated state.
    }
  }
  // If token or userString is missing, return unauthenticated state.
  return { user: null, isAuthenticated: false };
};

/**
 * @store useAuthStore
 * @description Zustand store definition for authentication.
 *
 * @property {object|null} user - Stores the authenticated user's information object. Null if not authenticated.
 * @property {boolean} isAuthenticated - True if the user is authenticated, false otherwise.
 * @property {boolean} isLoading - True when an asynchronous authentication operation (login, logout) is in progress.
 * @property {string|object|null} error - Stores error messages or error objects from failed authentication attempts. Null if no error.
 *
 * @action login - Asynchronously logs in a user.
 * @action logout - Asynchronously logs out a user.
 * @action clearError - Clears any stored authentication error.
 */
const useAuthStore = create(set => ({
  // Initialize state by spreading the result of getInitialState(), which checks localStorage.
  ...getInitialState(), 
  isLoading: false, // Tracks loading state for async authentication operations.
  error: null,      // Stores error messages from login/logout failures.

  /**
   * Asynchronously logs in a user with the provided credentials.
   * Updates `localStorage` and store state on success; handles errors on failure.
   * @param {object} credentials - User credentials, typically `{ emailOrUsername, password }`.
   */
  login: async credentials => {
    set({ isLoading: true, error: null }); // Set loading true, clear previous errors.
    try {
      const data = await authService.login(credentials); // Call login API service.

      // Validate response structure.
      if (data && data.access_token && data.user) {
        // On successful login, store token and user data in localStorage.
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        // If response is malformed, log error and throw to be caught by catch block.
        console.error('Login response missing access_token or user data:', data);
        localStorage.removeItem('accessToken'); // Ensure clean state if login data is incomplete.
        localStorage.removeItem('user');
        throw new Error('Login failed: Incomplete data received from server.');
      }

      // Update store state with user info and authenticated status.
      set({ user: data.user, isAuthenticated: true, isLoading: false, error: null });
    } catch (error) {
      // On login failure (API error or thrown error from above).
      localStorage.removeItem('accessToken'); // Clear any potentially stored token.
      localStorage.removeItem('user');      // Clear any potentially stored user data.
      // Update store state with error message and unauthenticated status.
      set({
        error: error.message || 'Login failed due to an unexpected error.',
        isLoading: false,
        user: null,
        isAuthenticated: false,
      });
    }
  },

  /**
   * Asynchronously logs out the current user.
   * Attempts to call a backend logout endpoint via `authService.logout()`.
   * Regardless of backend call success, it clears local authentication state (localStorage and store).
   */
  logout: async () => {
    set(state => ({ ...state, isLoading: true, error: null })); // Indicate loading, clear previous errors.
    try {
      await authService.logout(); // Attempt to call the backend logout endpoint.
      // If backend logout is successful (or if it doesn't throw an error that's caught):
      localStorage.removeItem('accessToken'); // Clear token from localStorage.
      localStorage.removeItem('user');      // Clear user data from localStorage.
      // Reset store state to unauthenticated.
      set({ user: null, isAuthenticated: false, error: null, isLoading: false });
    } catch (error) {
      // If backend logout fails (e.g., network error, server error).
      console.error('Backend logout request failed:', error);
      // IMPORTANT: Still clear local storage and set user as unauthenticated on the client-side
      // as a fallback, because the user's intent was to log out. This ensures the client session ends.
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        // Optionally, set an error message to inform the user about the backend issue,
        // while still confirming they are logged out locally.
        error: error.response?.data?.msg || error.message || 'Logout failed on server. You have been logged out locally.',
      });
    }
  },

  /**
   * Clears any stored authentication error message from the store state.
   */
  clearError: () => {
    set({ error: null }); // Reset error state to null.
  },
}));

// Export the Zustand store hook for use in components.
export default useAuthStore;
