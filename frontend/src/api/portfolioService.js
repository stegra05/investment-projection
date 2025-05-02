import instance from './axiosInstance';
import { ENDPOINTS } from '../config/api';

const portfolioService = {
  /**
   * Fetches the list of portfolios for the currently authenticated user.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of portfolio objects.
   * @throws {Error} Throws an error if the API request fails.
   */
  getUserPortfolios: async () => {
    try {
      const response = await instance.get(ENDPOINTS.PORTFOLIO.LIST);
      // Assuming the API returns the array of portfolios directly in the data property
      return response.data;
    } catch (error) {
      console.error('Error fetching user portfolios:', error);
      // Re-throw the error or handle it as needed (e.g., return a specific error object)
      // For now, re-throwing allows the caller (e.g., Zustand store) to handle it.
      throw error;
    }
  },

  // Add other portfolio-related API calls here in the future
  // e.g., createPortfolio, getPortfolioDetails, updatePortfolio, deletePortfolio
};

export default portfolioService; 