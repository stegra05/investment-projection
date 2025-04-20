import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create an axios instance for portfolio API calls
const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Log each request for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.debug('[portfolioService] Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('[portfolioService] No auth token found');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fetch all portfolios for the authenticated user
export const getPortfolios = async () => {
  const endpoint = API_URL.endsWith('/') ? `${API_URL}portfolios` : `${API_URL}/portfolios`;
  console.debug('[portfolioService] GET', endpoint);
  const response = await apiClient.get('/portfolios');
  return response.data;
};

// Fetch details of a single portfolio by ID
export const getPortfolio = async (portfolioId) => {
  const response = await apiClient.get(`/portfolios/${portfolioId}`);
  return response.data;
};

// Create a new portfolio
export const createPortfolio = async (portfolioData) => {
  const response = await apiClient.post('/portfolios', portfolioData);
  return response.data;
};

// Update an existing portfolio
export const updatePortfolio = async (portfolioId, portfolioData) => {
  const response = await apiClient.put(`/portfolios/${portfolioId}`, portfolioData);
  return response.data;
};

// Delete a portfolio
export const deletePortfolio = async (portfolioId) => {
  const response = await apiClient.delete(`/portfolios/${portfolioId}`);
  return response.status === 204;
};

const portfolioService = {
  getPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
};

export default portfolioService; 