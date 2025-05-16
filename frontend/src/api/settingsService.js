import axiosInstance from './axiosInstance'; // Assuming a configured axios instance

const API_URL = '/users/settings'; // Base URL for user settings

/**
 * Fetches the current user's settings.
 * @returns {Promise<object>} The user settings data.
 */
const getUserSettings = async () => {
  try {
    const response = await axiosInstance.get(API_URL);
    return response.data;
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
        detailedMessage += error.response.data;
      } else if (error.response.statusText) {
        detailedMessage += error.response.statusText;
      }
    } else if (error.request) {
      detailedMessage = 'Failed to fetch user settings: No response from server. Check network or if the server is running.';
    } else {
      detailedMessage = `Failed to fetch user settings: ${error.message}`;
    }
    throw new Error(detailedMessage);
  }
};

/**
 * Updates the current user's settings.
 * @param {object} settingsData - The settings data to update.
 * @param {number} [settingsData.default_inflation_rate] - The default annual inflation rate.
 * @returns {Promise<object>} The updated user settings data.
 */
const updateUserSettings = async (settingsData) => {
  try {
    const response = await axiosInstance.put(API_URL, settingsData);
    return response.data;
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
        detailedMessage += error.response.data;
      } else if (error.response.statusText) {
        detailedMessage += error.response.statusText;
      }
    } else if (error.request) {
      detailedMessage = 'Failed to update user settings: No response from server. Check network or if the server is running.';
    } else {
      detailedMessage = `Failed to update user settings: ${error.message}`;
    }
    throw new Error(detailedMessage);
  }
};

const settingsService = {
  getUserSettings,
  updateUserSettings,
};

export default settingsService; 