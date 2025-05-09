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
    return Promise.resolve();
  },
};

export default authService;
