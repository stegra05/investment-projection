import axios from 'axios';

const API_URL = process.env.VITE_API_URL || '/api/v1';

// Configure axios instance for API calls
// This allows setting base URL and potentially other defaults
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const register = async (userData) => {
  console.log('Calling register API with:', userData);
  const response = await apiClient.post(`/auth/register`, userData);
  return response.data; // Backend likely returns a success message
};

const login = async (credentials) => {
  console.log('Calling login API with:', credentials);
  const response = await apiClient.post(`/auth/login`, credentials);
  console.log('Login API response data:', response.data);
  // Accept either access_token or token for compatibility
  const token = response.data.access_token || response.data.token;
  const refreshToken = response.data.refresh_token;
  if (token && refreshToken) {
    return { token, refreshToken, user: response.data.user };
  }
  // Throw an error if tokens not provided
  throw new Error('Login response did not include expected tokens.');
};

const logout = async () => {
  // Call backend logout endpoint if it exists and requires action (like blacklisting token)
  // For simple JWT, client-side removal might be sufficient.
  // Check api_specification.md if /auth/logout needs to be called.
  try {
     // Assuming /auth/logout exists and expects a POST request (perhaps with the token implicitly via interceptor)
     await apiClient.post(`/auth/logout`);
     console.log('Called backend /auth/logout endpoint.');
  } catch (error) {
      console.error("Backend logout call failed (might be expected if endpoint doesn't exist or requires no action):", error);
      // Proceed with client-side logout regardless
  }

  // Client-side cleanup (handled by AuthContext)
  console.log('authService.logout completed (client-side cleanup handled by context)');
  return Promise.resolve(); // Service itself doesn't need to remove token now
};

// TODO: Add functions for password reset API calls when backend is ready
// const requestPasswordReset = async (email) => { ... }
// const resetPassword = async (token, newPassword) => { ... }

// Refresh the access token using a valid refresh JWT
export const refreshAccessToken = async (refreshToken) => {
  // Pass the refresh token in the Authorization header
  const response = await apiClient.post('/auth/refresh', null, {
    headers: { Authorization: `Bearer ${refreshToken}` },
  });
  return response.data.access_token;
};

const authService = {
  register,
  login,
  logout,
  refreshAccessToken,
  // requestPasswordReset,
  // resetPassword,
};

export default authService; 