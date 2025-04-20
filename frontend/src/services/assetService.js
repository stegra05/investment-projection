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

/**
 * Adds a new asset to a specific portfolio.
 * @param {string|number} portfolioId - The ID of the portfolio to add the asset to.
 * @param {object} assetData - The data for the new asset.
 * @returns {Promise<object>} The newly created asset data.
 * @throws {Error} Throws an error if the request fails.
 */
export const createAsset = async (portfolioId, assetData) => {
  try {
    const response = await apiClient.post(
      `/portfolios/${portfolioId}/assets`,
      assetData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error creating asset for portfolio ${portfolioId}:`, error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Updates an existing asset within a portfolio.
 * @param {string|number} portfolioId - The ID of the portfolio containing the asset.
 * @param {string|number} assetId - The ID of the asset to update.
 * @param {object} assetData - The updated data for the asset.
 * @returns {Promise<object>} The updated asset data.
 * @throws {Error} Throws an error if the request fails.
 */
export const updateAsset = async (portfolioId, assetId, assetData) => {
  try {
    const response = await apiClient.put(`/portfolios/${portfolioId}/assets/${assetId}`, assetData);
    return response.data;
  } catch (error) {
    console.error(`Error updating asset ${assetId} in portfolio ${portfolioId}:`, error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Deletes an asset from a portfolio.
 * @param {string|number} portfolioId - The ID of the portfolio containing the asset.
 * @param {string|number} assetId - The ID of the asset to delete.
 * @returns {Promise<boolean>} True if the deletion was successful (status 204), false otherwise.
 * @throws {Error} Throws an error if the request fails with a status other than 204.
 */
export const deleteAsset = async (portfolioId, assetId) => {
  try {
    const response = await apiClient.delete(`/portfolios/${portfolioId}/assets/${assetId}`);
    return response.status === 204; // Successfully deleted
  } catch (error) {
    console.error(`Error deleting asset ${assetId} from portfolio ${portfolioId}:`, error.response ? error.response.data : error.message);
    // Only throw if it's not a 404 or other non-deleting error? Depends on desired behavior.
    throw error;
  }
};

// Combine all exported functions into the service object
const assetService = {
    getAssetClasses, // Keep existing exports if needed
    getAssetHistoricalData, // Keep existing exports if needed
    createAsset,
    updateAsset,
    deleteAsset
};
export default assetService; 