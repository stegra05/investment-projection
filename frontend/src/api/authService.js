import axios from 'axios';
import { ENDPOINTS } from '../config/api';

const authService = {
  login: async (credentials) => {
    try {
      const response = await axios.post(ENDPOINTS.AUTH.LOGIN, credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  register: async (userData) => {
    try {
      const response = await axios.post(ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  logout: async () => {
    // Implement logout logic if needed
    return Promise.resolve();
  },
};

export default authService; 