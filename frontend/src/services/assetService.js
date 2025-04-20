import apiClient from './apiClient';

// Base URL for the asset endpoints
// const API_URL = process.env.REACT_APP_API_URL || '/api'; // Handled by apiClient

/**
 * Fetches a list of available asset classes.
 * @returns {Promise<Array>} A list of asset classes.
 */
export const getAssetClasses = async () => {
  try {
    // Assuming the endpoint for asset classes is /assets/classes
    // Adjust if the actual endpoint is different based on api_specification.md
    const response = await apiClient.get('/assets/classes');
    return response.data;
  } catch (error) {
    console.error('Error fetching asset classes:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches historical data for a specific asset symbol.
 * @param {string} symbol - The asset symbol (e.g., 'AAPL', 'BTC-USD').
 * @param {string} [range='1y'] - The time range for historical data (e.g., '1d', '5d', '1mo', '6mo', '1y', '5y', 'max').
 * @returns {Promise<object>} Historical price data for the asset.
 */
export const getAssetHistoricalData = async (symbol, range = '1y') => {
  try {
    // Adjust endpoint and parameters based on your backend API specification
    const response = await apiClient.get('/assets/historical', {
      params: {
        symbol,
        range,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error.response ? error.response.data : error.message);
    throw error;
  }
};

// Add other asset-related API calls as needed (e.g., search assets, get asset details)

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