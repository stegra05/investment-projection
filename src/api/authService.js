import instance from './axiosInstance';
import { ENDPOINTS } from '../config/api';

const authService = {
  login: async (credentials) => {
    try {
      const response = await instance.post(ENDPOINTS.AUTH.LOGIN, credentials);
      // Assuming the API returns { access_token: '...', user: { ... } } on success
      return response.data;
    } catch (error) {
      // Re-throw the error so it can be caught by the store/component
      throw error;
    }
  },

  // 1.5.1: Add register Function Signature
  register: async (userData) => {
    // 1.5.2: Implement register API Call
    try {
      // Assuming userData is { username, email, password }
      const response = await instance.post(ENDPOINTS.AUTH.REGISTER, userData);
      // Assuming the API returns some confirmation or user data upon successful registration
      return response.data; // Or maybe just return true/response status
    } catch (error) {
      // Re-throw for component-level handling
      throw error;
    }
  },
};

export default authService; 