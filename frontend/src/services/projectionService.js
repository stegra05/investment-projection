import apiClient from './apiClient';

// Base URL for the projection endpoints
// const API_URL = process.env.REACT_APP_API_URL || '/api'; // Handled by apiClient

/**
 * Runs a financial projection based on portfolio and simulation parameters.
 * @param {object} projectionParams - The parameters for the projection.
 * @param {string|number} projectionParams.portfolioId - The ID of the portfolio to use.
 * @param {number} projectionParams.years - The number of years to project.
 * @param {number} [projectionParams.simulations=1000] - The number of Monte Carlo simulations to run.
 * @param {number} [projectionParams.contribution=0] - Annual contribution amount.
 * // Add other relevant parameters (e.g., withdrawal strategy, rebalancing rules)
 * @returns {Promise<object>} The projection results.
 */
export const runProjection = async (projectionParams) => {
  try {
    // Ensure portfolioId is provided
    if (!projectionParams || !projectionParams.portfolioId) {
      throw new Error('Portfolio ID is required to run a projection.');
    }

    // Use portfolioId in the endpoint path
    const endpoint = `/portfolios/${projectionParams.portfolioId}/project`;

    // Send other parameters in the request body
    const bodyParams = { ...projectionParams };
    delete bodyParams.portfolioId; // Remove portfolioId from body as it's in the URL

    const response = await apiClient.post(endpoint, bodyParams);
    return response.data;
  } catch (error) {
    console.error('Error running projection:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches past projection results for a specific portfolio.
 * @param {string|number} portfolioId - The ID of the portfolio.
 * @returns {Promise<Array>} A list of past projection results.
 */
export const getPastProjections = async (portfolioId) => {
  try {
    const response = await apiClient.get(`/portfolios/${portfolioId}/projections`); // Endpoint assumed
    return response.data;
  } catch (error) {
    console.error(`Error fetching past projections for portfolio ${portfolioId}:`, error.response ? error.response.data : error.message);
    throw error;
  }
};

const projectionService = {
  runProjection,
  getPastProjections,
};

export default projectionService; 