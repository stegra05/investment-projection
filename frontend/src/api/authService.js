import instance from './axiosInstance'; // Import the configured Axios instance
import { ENDPOINTS } from '../config/api';

/**
 * @typedef {object} AuthError
 * @property {string} message - A descriptive error message.
 * @property {object} [details] - Optional additional error details from the API.
 */

/**
 * @typedef {object} LoginResponse
 * @property {string} accessToken - The JWT access token.
 * @property {object} user - User information.
 * @property {number} user.id - User ID.
 * @property {string} user.username - Username.
 */

/**
 * @typedef {object} RegisterResponse
 * @property {object} user - User information.
 * @property {number} user.id - User ID.
 * @property {string} user.username - Username.
 * @property {string} message - Success message.
 */

/**
 * Authentication service object.
 * Handles login, registration, and logout operations.
 */
const authService = {
  /**
   * Logs in a user.
   * Makes a POST request to the login endpoint.
   * @param {object} credentials - The user's login credentials.
   * @param {string} credentials.username - The username.
   * @param {string} credentials.password - The password.
   * @returns {Promise<LoginResponse>} A promise that resolves to the login response data, including an access token and user info.
   * @throws {AuthError} Throws an error object with a message if login fails.
   */
  login: async credentials => {
    try {
      const response = await instance.post(ENDPOINTS.AUTH.LOGIN, credentials);
      return response.data;
    } catch (error) {
      // Throws the error data from the response if available, otherwise a generic error.
      throw error.response?.data || { message: error.message || 'Login failed' };
    }
  },

  /**
   * Registers a new user.
   * Makes a POST request to the register endpoint.
   * @param {object} userData - The user's registration data.
   * @param {string} userData.username - The desired username.
   * @param {string} userData.email - The user's email address.
   * @param {string} userData.password - The chosen password.
   * @returns {Promise<RegisterResponse>} A promise that resolves to the registration response data, including user info and a success message.
   * @throws {AuthError} Throws an error object with a message if registration fails.
   */
  register: async userData => {
    try {
      const response = await instance.post(ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      // Throws the error data from the response if available, otherwise a generic error.
      throw error.response?.data || { message: error.message || 'Registration failed' };
    }
  },

  /**
   * Logs out the current user.
   * Makes a POST request to the logout endpoint.
   * @returns {Promise<{message: string}>} A promise that resolves to a success message upon successful logout.
   * @throws {AuthError} Throws an error object with a message if logout fails.
   */
  logout: async () => {
    // Implement logout logic if needed (e.g., invalidating token on server-side)
    try {
      // Assumes the backend has a /logout endpoint that might invalidate the token
      await instance.post(ENDPOINTS.AUTH.LOGOUT);
      return { message: 'Logout successful' };
    } catch (error) {
      // Handle errors, e.g., network issues or if the backend returns an error
      console.error('Logout failed:', error);
      // Throws the error data from the response if available, otherwise a generic error.
      throw error.response?.data || { message: error.message || 'Logout failed' };
    }
  },
};

export default authService;
