import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Include token in headers if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a new asset to a portfolio
export const createAsset = async (portfolioId, assetData) => {
  const response = await apiClient.post(`/portfolios/${portfolioId}/assets`, assetData);
  return response.data;
};

// Update an existing asset
export const updateAsset = async (portfolioId, assetId, assetData) => {
  const response = await apiClient.put(`/portfolios/${portfolioId}/assets/${assetId}`, assetData);
  return response.data;
};

// Delete an asset from a portfolio
export const deleteAsset = async (portfolioId, assetId) => {
  const response = await apiClient.delete(`/portfolios/${portfolioId}/assets/${assetId}`);
  return response.status === 204;
};

const assetService = { createAsset, updateAsset, deleteAsset };
export default assetService; 