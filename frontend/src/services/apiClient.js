import axios from 'axios';

const apiClient = axios.create({
  // Use Vite env variable or default to versioned API prefix
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
});

// Add a request interceptor to include the token in headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient; 