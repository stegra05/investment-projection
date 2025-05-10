import instance from './axiosInstance'; // Import the configured Axios instance
import { ENDPOINTS } from '../config/api';

const authService = {
  login: async credentials => {
    try {
      const response = await instance.post(ENDPOINTS.AUTH.LOGIN, credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message || 'Login failed' };
    }
  },

  register: async userData => {
    try {
      const response = await instance.post(ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message || 'Registration failed' };
    }
  },

  logout: async () => {
    // Implement logout logic if needed
    // return Promise.resolve();
    try {
      await instance.post(ENDPOINTS.AUTH.LOGOUT);
      // No specific data to return on successful logout, or you can return a success message
      return { message: 'Logout successful' };
    } catch (error) {
      // Handle errors, e.g., network issues or if the backend returns an error
      // Depending on how you want to handle errors, you might re-throw or return a specific error structure
      console.error('Logout failed:', error);
      throw error.response?.data || { message: error.message || 'Logout failed' };
    }
  },
};

export default authService;
