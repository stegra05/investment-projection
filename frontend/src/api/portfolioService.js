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

  /**
   * Creates a new portfolio for the currently authenticated user.
   * @param {object} portfolioData - The data for the new portfolio.
   * @param {string} portfolioData.name - The name of the portfolio.
   * @param {string} [portfolioData.description] - The optional description of the portfolio.
   * @returns {Promise<object>} A promise that resolves to the newly created portfolio object.
   * @throws {Error} Throws an error if the API request fails.
   */
  createPortfolio: async portfolioData => {
    try {
      const response = await instance.post(ENDPOINTS.PORTFOLIO.LIST, portfolioData);
      // Assuming the API returns the newly created portfolio object in the data property
      return response.data;
    } catch (error) {
      console.error('Error creating portfolio:', error);
      // Re-throw for the caller (e.g., modal form) to handle
      throw error;
    }
  },

  /**
   * Fetches the details of a specific portfolio by its ID.
   * @param {string|number} portfolioId - The ID of the portfolio to fetch.
   * @param {string} [includeLevel] - Optional level of detail to include ('summary', 'assets', 'full').
   * @returns {Promise<object>} A promise that resolves to the portfolio object.
   * @throws {Error} Throws an error if the API request fails.
   */
  getPortfolioById: async (portfolioId, includeLevel) => {
    try {
      let endpoint = ENDPOINTS.PORTFOLIO.DETAIL(portfolioId);
      if (includeLevel && ['summary', 'assets', 'full'].includes(includeLevel)) {
        const params = new URLSearchParams({ include: includeLevel });
        endpoint = `${endpoint}?${params.toString()}`;
      }
      const response = await instance.get(endpoint);
      return response.data; // Assuming API returns the portfolio object directly
    } catch (error) {
      console.error(`Error fetching portfolio with ID ${portfolioId}:`, error);
      throw error; // Re-throw for the caller (PortfolioContext) to handle
    }
  },

  // Projection Preview
  /**
   * Requests a projection preview with temporary planned changes.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {object} projectionParams - Standard parameters for the projection (e.g., startDate, endDate).
   * @param {Array<object>} draftChanges - A list of planned changes, including temporary/modified ones.
   * @returns {Promise<object>} A promise that resolves to the projection result.
   * @throws {Error} Throws an error if the API request fails.
   */
  previewProjection: async (portfolioId, projectionParams, draftChanges) => {
    try {
      const endpoint = ENDPOINTS.PORTFOLIO.PREVIEW_PROJECTION(portfolioId);
      const payload = {
        ...projectionParams,
        draft_changes: draftChanges, // Assuming backend expects draft changes under this key
      };
      const response = await instance.post(endpoint, payload);
      return response.data;
    } catch (error) {
      console.error(`Error fetching projection preview for portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  // Add other portfolio-related API calls here in the future
  // e.g., updatePortfolio, deletePortfolio
};

export default portfolioService;
