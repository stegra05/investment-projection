import axiosInstance from './axiosInstance'; // Assuming a configured axios instance

const API_URL = '/users/settings'; // Base URL for user settings

/**
 * @typedef {object} UserSettings
 * @property {number} [id] - Unique identifier of the settings object (usually matches user ID).
 * @property {number} [default_inflation_rate] - The default annual inflation rate to be used in projections (e.g., 0.02 for 2%).
 * @property {number} [default_expected_return] - The default expected annual rate of return for investments (e.g., 0.07 for 7%).
 * @property {string} [preferred_currency] - The user's preferred currency code (e.g., 'USD', 'EUR').
 * @property {boolean} [dark_mode_enabled] - Whether dark mode is enabled for the UI.
 * @property {string} [created_at] - ISO date string of when the settings were created.
 * @property {string} [updated_at] - ISO date string of when the settings were last updated.
 * Add other potential user settings fields here as they are defined in the backend.
 */

/**
 * Fetches the current authenticated user's application settings.
 * Makes a GET request to the `/users/settings` endpoint.
 * @returns {Promise<UserSettings>} A promise that resolves to the user settings object.
 * @throws {Error} Throws a custom error with a detailed message if the API request fails.
 *                 The error message attempts to include details from the server response or request failure.
 */
const getUserSettings = async () => {
  try {
    const response = await axiosInstance.get(API_URL);
    return response.data; // Assumes API returns the settings object directly
  } catch (error) {
    console.error('Error fetching user settings:', error.response || error);
    let detailedMessage = 'Failed to fetch user settings';
    if (error.response) {
      detailedMessage = `Failed to fetch user settings: Server responded with status ${error.response.status}. `;
      if (error.response.data && typeof error.response.data.message === 'string') {
        detailedMessage += error.response.data.message;
      } else if (error.response.data && typeof error.response.data.error === 'string') {
        detailedMessage += error.response.data.error;
      } else if (typeof error.response.data === 'string' && error.response.data.trim() !== '') {
        detailedMessage += error.response.data; // For plain text error responses
      } else if (error.response.statusText) {
        detailedMessage += error.response.statusText;
      }
    } else if (error.request) {
      detailedMessage = 'Failed to fetch user settings: No response from server. Check network or if the server is running.';
    } else {
      // For setup errors or other issues
      detailedMessage = `Failed to fetch user settings: ${error.message}`;
    }
    throw new Error(detailedMessage);
  }
};

/**
 * Updates the current authenticated user's application settings.
 * Makes a PUT request to the `/users/settings` endpoint.
 * @param {Partial<UserSettings>} settingsData - An object containing the settings fields to update.
 *                                             Example: `{ default_inflation_rate: 0.025, preferred_currency: 'EUR' }`
 * @returns {Promise<UserSettings>} A promise that resolves to the updated user settings object.
 * @throws {Error} Throws a custom error with a detailed message if the API request fails.
 *                 The error message attempts to include details from the server response or request failure.
 */
const updateUserSettings = async (settingsData) => {
  try {
    const response = await axiosInstance.put(API_URL, settingsData);
    return response.data; // Assumes API returns the updated settings object
  } catch (error) {
    console.error('Error updating user settings:', error.response || error);
    let detailedMessage = 'Failed to update user settings';
    if (error.response) {
      detailedMessage = `Failed to update user settings: Server responded with status ${error.response.status}. `;
      if (error.response.data && typeof error.response.data.message === 'string') {
        detailedMessage += error.response.data.message;
      } else if (error.response.data && typeof error.response.data.error === 'string') {
        detailedMessage += error.response.data.error;
      } else if (typeof error.response.data === 'string' && error.response.data.trim() !== '') {
        detailedMessage += error.response.data; // For plain text error responses
      } else if (error.response.statusText) {
        detailedMessage += error.response.statusText;
      }
    } else if (error.request) {
      detailedMessage = 'Failed to update user settings: No response from server. Check network or if the server is running.';
    } else {
      // For setup errors or other issues
      detailedMessage = `Failed to update user settings: ${error.message}`;
    }
    throw new Error(detailedMessage);
  }
};

/**
 * Service object for managing user settings.
 * It provides methods to fetch and update application settings for the authenticated user.
 */
const settingsService = {
  getUserSettings,
  updateUserSettings,
};

export default settingsService;