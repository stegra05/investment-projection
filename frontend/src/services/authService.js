import apiClient from './apiClient';

// Base URL for the authentication endpoints
// const API_URL = process.env.REACT_APP_API_URL || '/api';
// No longer needed, baseURL is in apiClient

/**
 * Registers a new user.
 * @param {object} userData - The user registration data (e.g., username, email, password).
 * @returns {Promise<object>} The response data from the server.
 */
export const register = async (userData) => {
  try {
    // const response = await axios.post(`${API_URL}/auth/register`, userData);
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Registration failed');
  }
};

/**
 * Logs in a user.
 * @param {object} credentials - The user login credentials (e.g., email, password).
 * @returns {Promise<object>} The response data containing the JWT token.
 */
export const login = async (credentials) => {
  try {
    // const response = await axios.post(`${API_URL}/auth/login`, credentials);
    const response = await apiClient.post('/auth/login', credentials);
    const { access_token, refresh_token, user } = response.data;
    if (access_token) {
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
    } else {
      console.warn('No access token received during login.');
    }
    // Return normalized keys for AuthContext
    return { token: access_token, refreshToken: refresh_token, user };
  } catch (error) {
    console.error('Login error:', error.response ? error.response.data : error.message);
    // Remove token if login fails? Consider security implications.
    localStorage.removeItem('token');
    // delete axios.defaults.headers.common['Authorization']; // No longer needed
    throw error.response ? error.response.data : new Error('Login failed');
  }
};

/**
 * Logs out the current user by removing tokens from local storage.
 * This function does not interact with the backend API endpoint for logout
 * (if one exists) but handles the client-side cleanup.
 */
export const logout = () => {
  // Remove token from local storage
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken'); // Ensure refresh token is also removed
  // Remove the default auth header - No longer needed with apiClient interceptor
  // delete axios.defaults.headers.common['Authorization'];
  // Optionally: Redirect user to login page or update app state
  console.log('User logged out, tokens cleared.');
};

/**
 * Retrieves the profile of the currently logged-in user.
 * Uses the token stored in localStorage via the apiClient interceptor.
 * Handles unauthorized errors by logging the user out.
 * @returns {Promise<object>} The user profile data (e.g., id, username, email).
 * @throws {Error} Throws an error if the request fails, including a specific error
 *                 for session expiration requiring re-login.
 */
export const getUserProfile = async () => {
  try {
    // The interceptor in apiClient will automatically add the Authorization header
    // const token = localStorage.getItem('token');
    // if (!token) {
    //   throw new Error('No token found, please log in.');
    // }
    // const response = await axios.get(`${API_URL}/auth/profile`, {
    //   headers: {
    //     Authorization: `Bearer ${token}`
    //   }
    // });
    const response = await apiClient.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error.response ? error.response.data : error.message);
    // If error is due to unauthorized (e.g., expired token), handle logout
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log('Unauthorized access or token expired, logging out.');
      logout();
      // Optionally throw a specific error or trigger redirect
      throw new Error('Session expired. Please log in again.');
    }
    throw error.response ? error.response.data : new Error('Failed to fetch profile');
  }
};

/**
 * Checks if a user is currently logged in (simple check based on token existence).
 * @returns {boolean} True if a token exists, false otherwise.
 */
export const isLoggedIn = () => {
  return !!localStorage.getItem('token');
};

// TODO: Add functions for password reset API calls when backend is ready
// const requestPasswordReset = async (email) => { ... }

/**
 * Refreshes the access token using a valid refresh token.
 * @param {string} refreshToken - The current refresh token.
 * @returns {Promise<string>} The new access token.
 * @throws {Error} Throws an error if the refresh request fails.
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Pass the refresh token in the Authorization header
    const response = await apiClient.post('/auth/refresh', null, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    const newAccessToken = response.data.access_token;
    if (newAccessToken) {
      localStorage.setItem('token', newAccessToken); // Store the new token
    }
    return newAccessToken;
  } catch (error) {
    console.error('Refresh token error:', error.response ? error.response.data : error.message);
    // If refresh fails (e.g., invalid/expired refresh token), log the user out
    logout();
    throw error.response ? error.response.data : new Error('Session expired. Please log in again.');
  }
};

const authService = {
  register,
  login,
  logout,
  refreshAccessToken,
  // requestPasswordReset,
  // resetPassword,
  getUserProfile,
  isLoggedIn,
};

export default authService; 