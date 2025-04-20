import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create an axios instance for projection API calls
const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to each request if available
apiClient.interceptors.request.use(
  (config) => {
    // Debug: log the request details
    console.debug('[projectionService] Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Trigger projection calculation for a portfolio
export const runProjection = async (portfolioId, startDate, endDate, initialTotalValue) => {
  // Build JSON body with required fields
  const body = {
    start_date: startDate,
    end_date: endDate,
    initial_total_value: initialTotalValue.toString(),
  };
  console.debug('[projectionService] Body:', body);
  // Call the nested projections endpoint for the given portfolio
  const response = await apiClient.post(
    `/portfolios/${portfolioId}/projections`,
    body
  );
  return response.data;
};

const projectionService = {
  runProjection,
};

export default projectionService; 