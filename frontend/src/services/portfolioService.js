import apiClient from './apiClient';

// Base URL for the portfolio endpoints
// const API_URL = process.env.REACT_APP_API_URL || '/api'; // Handled by apiClient

/**
 * Fetches all portfolios for the current user.
 * @returns {Promise<Array>} A list of portfolios.
 */
export const getPortfolios = async () => {
  try {
    const response = await apiClient.get('/portfolios');
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolios:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches a single portfolio by its ID.
 * @param {string|number} portfolioId - The ID of the portfolio to fetch.
 * @returns {Promise<object>} The portfolio details.
 */
export const getPortfolioById = async (portfolioId) => {
  try {
    const response = await apiClient.get(`/portfolios/${portfolioId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching portfolio ${portfolioId}:`, error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Creates a new portfolio.
 * @param {object} portfolioData - The data for the new portfolio.
 * @returns {Promise<object>} The newly created portfolio.
 */
export const createPortfolio = async (portfolioData) => {
  try {
    const response = await apiClient.post('/portfolios', portfolioData);
    return response.data;
  } catch (error) {
    console.error('Error creating portfolio:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Updates an existing portfolio.
 * @param {string|number} portfolioId - The ID of the portfolio to update.
 * @param {object} portfolioData - The updated data for the portfolio.
 * @returns {Promise<object>} The updated portfolio.
 */
export const updatePortfolio = async (portfolioId, portfolioData) => {
  try {
    const response = await apiClient.put(`/portfolios/${portfolioId}`, portfolioData);
    return response.data;
  } catch (error) {
    console.error(`Error updating portfolio ${portfolioId}:`, error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Deletes a portfolio.
 * @param {string|number} portfolioId - The ID of the portfolio to delete.
 * @returns {Promise<object>} Confirmation response from the server.
 */
export const deletePortfolio = async (portfolioId) => {
  try {
    const response = await apiClient.delete(`/portfolios/${portfolioId}`);
    return response.data; // Usually an empty object or success message
  } catch (error) {
    console.error(`Error deleting portfolio ${portfolioId}:`, error.response ? error.response.data : error.message);
    throw error;
  }
};

const portfolioService = {
  getPortfolios,
  getPortfolioById,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
};

export default portfolioService; 