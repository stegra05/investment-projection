import axios from 'axios';
import API_BASE_URL from '../config/api';

/**
 * Axios instance for making API requests.
 * Configured with a base URL and a request interceptor for adding JWT tokens.
 * @module axiosInstance
 */
const instance = axios.create({
  /**
   * The base URL for all API requests.
   * Imported from the API configuration.
   */
  baseURL: API_BASE_URL,
});

// Add request interceptor
/**
 * Request interceptor to add JWT token to headers.
 * Retrieves the token from localStorage and adds it to the Authorization header.
 */
instance.interceptors.request.use(
  config => {
    // Retrieve the JWT token from local storage.
    const token = localStorage.getItem('accessToken');
    if (token) {
      // If a token exists, add it to the Authorization header.
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    // Handle request errors.
    return Promise.reject(error);
  }
);

export default instance;
