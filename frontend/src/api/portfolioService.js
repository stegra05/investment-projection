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

  /**
   * Adds a new asset to a specific portfolio.
   * @param {string|number} portfolioId - The ID of the portfolio to add the asset to.
   * @param {object} assetData - The data for the new asset.
   * @param {string} assetData.asset_type - The type of the asset (e.g., 'STOCK', 'BOND').
   * @param {string} assetData.name_or_ticker - The name or ticker symbol.
   * @param {number} assetData.allocation_percentage - Allocation percentage (e.g., 50 for 50%).
   * @param {number} [assetData.manual_expected_return] - Optional manually set expected return.
   * @returns {Promise<object>} A promise that resolves to the newly added asset object (or the updated portfolio).
   * @throws {Error} Throws an error if the API request fails.
   */
  addAssetToPortfolio: async (portfolioId, assetData) => {
    try {
      const endpoint = ENDPOINTS.PORTFOLIO.ADD_ASSET(portfolioId);
      const response = await instance.post(endpoint, assetData);
      // Assuming the API returns the newly added asset or updated portfolio data
      return response.data;
    } catch (error) {
      console.error(`Error adding asset to portfolio ${portfolioId}:`, error);
      // Re-throw for the caller (e.g., AssetsView component) to handle
      throw error;
    }
  },

  /**
   * Updates an existing asset in a specific portfolio.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {string|number} assetId - The ID of the asset to update.
   * @param {object} assetData - The updated data for the asset (partial updates allowed).
   * @returns {Promise<object>} A promise that resolves to the updated asset object.
   * @throws {Error} Throws an error if the API request fails.
   */
  updateAssetInPortfolio: async (portfolioId, assetId, assetData) => {
    try {
      const endpoint = ENDPOINTS.PORTFOLIO.UPDATE_ASSET(portfolioId, assetId);
      // Using PUT as specified in the plan, assuming backend handles partial updates if needed
      const response = await instance.put(endpoint, assetData);
      // Assuming the API returns the updated asset object
      return response.data;
    } catch (error) {
      console.error(`Error updating asset ${assetId} in portfolio ${portfolioId}:`, error);
      // Re-throw for the caller (e.g., EditAssetModal) to handle
      throw error;
    }
  },

  /**
   * Deletes an asset from a specific portfolio.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {string|number} assetId - The ID of the asset to delete.
   * @returns {Promise<void>} A promise that resolves on successful deletion.
   * @throws {Error} Throws an error if the API request fails.
   */
  deleteAssetFromPortfolio: async (portfolioId, assetId) => {
    try {
      const endpoint = ENDPOINTS.PORTFOLIO.DELETE_ASSET(portfolioId, assetId);
      await instance.delete(endpoint);
      // No content typically returned on successful DELETE
      return;
    } catch (error) {
      console.error(`Error deleting asset ${assetId} from portfolio ${portfolioId}:`, error);
      // Re-throw for the caller (e.g., AssetsView component) to handle
      throw error;
    }
  },

  // Planned Changes
  /**
   * Fetches planned changes for a specific portfolio.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {object} [queryParams] - Optional query parameters (e.g., for date range).
   * @returns {Promise<Array<object>>} A promise that resolves to an array of planned change objects.
   * @throws {Error} Throws an error if the API request fails.
   */
  getPlannedChanges: async (portfolioId, queryParams) => {
    try {
      let endpoint = ENDPOINTS.PORTFOLIO.GET_PLANNED_CHANGES(portfolioId);
      if (queryParams) {
        const params = new URLSearchParams(queryParams);
        endpoint = `${endpoint}?${params.toString()}`;
      }
      const response = await instance.get(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error fetching planned changes for portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Adds a new planned change to a specific portfolio.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {object} changeData - The data for the new planned change.
   * @returns {Promise<object>} A promise that resolves to the newly added planned change object.
   * @throws {Error} Throws an error if the API request fails.
   */
  addPlannedChange: async (portfolioId, changeData) => {
    try {
      const endpoint = ENDPOINTS.PORTFOLIO.ADD_PLANNED_CHANGE(portfolioId);
      const response = await instance.post(endpoint, changeData);
      return response.data;
    } catch (error) {
      console.error(`Error adding planned change to portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Updates an existing planned change in a specific portfolio.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {string|number} changeId - The ID of the planned change to update.
   * @param {object} changeData - The updated data for the planned change.
   * @returns {Promise<object>} A promise that resolves to the updated planned change object.
   * @throws {Error} Throws an error if the API request fails.
   */
  updatePlannedChange: async (portfolioId, changeId, changeData) => {
    try {
      const endpoint = ENDPOINTS.PORTFOLIO.UPDATE_PLANNED_CHANGE(portfolioId, changeId);
      const response = await instance.put(endpoint, changeData); // Or instance.patch if backend supports it
      return response.data;
    } catch (error) {
      console.error(
        `Error updating planned change ${changeId} in portfolio ${portfolioId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Deletes a planned change from a specific portfolio.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {string|number} changeId - The ID of the planned change to delete.
   * @returns {Promise<void>} A promise that resolves on successful deletion.
   * @throws {Error} Throws an error if the API request fails.
   */
  deletePlannedChange: async (portfolioId, changeId) => {
    try {
      const endpoint = ENDPOINTS.PORTFOLIO.DELETE_PLANNED_CHANGE(portfolioId, changeId);
      await instance.delete(endpoint);
      return;
    } catch (error) {
      console.error(
        `Error deleting planned change ${changeId} from portfolio ${portfolioId}:`,
        error
      );
      throw error;
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
