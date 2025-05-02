import axios from 'axios';
import API_BASE_URL from '../config/api'; // Import the base URL

const instance = axios.create({
  baseURL: API_BASE_URL, // Set the base URL for all requests made with this instance
});

// Add request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request error here
    return Promise.reject(error);
  }
);

export default instance; 