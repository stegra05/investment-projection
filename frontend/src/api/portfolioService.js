import instance from './axiosInstance';
import { ENDPOINTS } from '../config/api';

/**
 * @typedef {object} Portfolio
 * @property {string|number} id - The unique identifier of the portfolio.
 * @property {string} name - The name of the portfolio.
 * @property {string} [description] - Optional description of the portfolio.
 * @property {string} user_id - The ID of the user who owns the portfolio.
 * @property {string} created_at - ISO date string of when the portfolio was created.
 * @property {string} updated_at - ISO date string of when the portfolio was last updated.
 * @property {Array<Asset>} [assets] - Optional array of assets in the portfolio.
 */

/**
 * @typedef {object} Asset
 * @property {string|number} id - The unique identifier of the asset.
 * @property {string} asset_type - Type of asset (e.g., 'STOCK', 'BOND').
 * @property {string} name_or_ticker - Name or ticker of the asset.
 * @property {number} allocation_percentage - Allocation percentage.
 * @property {number|null} [manual_expected_return] - Manually set expected return.
 */

/**
 * @typedef {object} PaginationInfo
 * @property {number} page - Current page number.
 * @property {number} per_page - Items per page.
 * @property {number} total_items - Total number of items.
 * @property {number} total_pages - Total number of pages.
 */

/**
 * @typedef {object} UserPortfoliosResponse
 * @property {Array<Portfolio>} data - Array of portfolio objects.
 * @property {PaginationInfo} pagination - Pagination information.
 */

/**
 * Service for portfolio-related API operations.
 */
const portfolioService = {
  /**
   * Fetches the list of portfolios for the currently authenticated user.
   * Supports pagination, sorting, and filtering.
   * @param {object} [params] - Optional query parameters.
   * @param {number} [params.page] - Page number for pagination (e.g., 1, 2).
   * @param {number} [params.per_page] - Number of items per page (e.g., 10, 20).
   * @param {string} [params.sort_by] - Field to sort by (e.g., 'name', 'created_at').
   * @param {'asc'|'desc'} [params.sort_order] - Sort order ('asc' or 'desc').
   * @param {string} [params.filter_name] - Filter portfolios by name (case-insensitive, partial match).
   * @returns {Promise<UserPortfoliosResponse>} A promise that resolves to an object containing an array of portfolio objects and pagination information.
   * @throws {Error} Throws an error if the API request fails, typically with error details from the server.
   */
  getUserPortfolios: async (params) => {
    try {
      const config = {};
      if (params) {
        const queryParams = { ...params }; // Copy incoming params

        // Handle page parameter
        if (params.page !== undefined && params.page !== null && String(params.page).trim() !== '') {
          const pageNum = parseInt(String(params.page), 10);
          if (!isNaN(pageNum)) {
            queryParams.page = pageNum;
          } else {
            delete queryParams.page; // Or set to undefined to be caught by the cleanup
          }
        } else {
          delete queryParams.page; // Remove if empty, null, or undefined
        }

        // Handle per_page parameter
        if (params.per_page !== undefined && params.per_page !== null && String(params.per_page).trim() !== '') {
          const perPageNum = parseInt(String(params.per_page), 10);
          if (!isNaN(perPageNum)) {
            queryParams.per_page = perPageNum;
          } else {
            delete queryParams.per_page; // Or set to undefined
          }
        } else {
          delete queryParams.per_page; // Remove if empty, null, or undefined
        }
        
        // Ensure other params (sort_by, sort_order, filter_name) are passed as is if they exist
        // queryParams already contains them from the initial spread ...params

        // Remove undefined keys so they don't get sent as "undefined" string
        Object.keys(queryParams).forEach(key => {
          if (queryParams[key] === undefined || queryParams[key] === null || String(queryParams[key]).trim() === '') {
            // For sort_by and sort_order, backend has defaults. If filter_name is empty, it should not be sent.
            // For page/per_page, if they ended up invalid, they should be removed to use backend defaults.
            delete queryParams[key];
          }
        });
        
        if (Object.keys(queryParams).length > 0) {
          config.params = queryParams;
        }
      }
      const response = await instance.get(ENDPOINTS.PORTFOLIO.LIST, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching user portfolios:', error);
      // Re-throws the error, allowing the caller (e.g., Zustand store or component) to handle it.
      throw error;
    }
  },

  /**
   * Creates a new portfolio for the currently authenticated user.
   * @param {object} portfolioData - The data for the new portfolio.
   * @param {string} portfolioData.name - The name of the portfolio (must be unique for the user).
   * @param {string} [portfolioData.description] - An optional description of the portfolio.
   * @returns {Promise<Portfolio>} A promise that resolves to the newly created portfolio object.
   * @throws {Error} Throws an error if the API request fails (e.g., validation error, server error).
   */
  createPortfolio: async portfolioData => {
    try {
      const response = await instance.post(ENDPOINTS.PORTFOLIO.LIST, portfolioData);
      return response.data;
    } catch (error) {
      console.error('Error creating portfolio:', error);
      // Re-throws the error for the caller (e.g., a modal form) to handle.
      throw error;
    }
  },

  /**
   * Fetches the details of a specific portfolio by its ID.
   * @param {string|number} portfolioId - The ID of the portfolio to fetch.
   * @param {'summary'|'assets'|'full'} [includeLevel] - Optional level of detail to include.
   *                                                   'summary': Basic portfolio info.
   *                                                   'assets': Portfolio info plus its assets.
   *                                                   'full': Portfolio info, assets, and potentially other related data.
   * @returns {Promise<Portfolio>} A promise that resolves to the detailed portfolio object.
   * @throws {Error} Throws an error if the API request fails (e.g., portfolio not found).
   */
  getPortfolioById: async (portfolioId, includeLevel) => {
    try {
      let endpoint = ENDPOINTS.PORTFOLIO.DETAIL(portfolioId);
      if (includeLevel && ['summary', 'assets', 'full'].includes(includeLevel)) {
        const params = new URLSearchParams({ include: includeLevel });
        endpoint = `${endpoint}?${params.toString()}`;
      }
      const response = await instance.get(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error fetching portfolio with ID ${portfolioId}:`, error);
      // Re-throws the error for the caller (e.g., PortfolioContext or view component) to handle.
      throw error;
    }
  },

  /**
   * Adds an asset to a specific portfolio.
   * Note: This function may be a duplicate of functionality in `assetService.js`.
   * Consider using `assetService.addAssetToPortfolio` directly unless this provides distinct behavior.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {object} assetData - The data for the new asset.
   * @param {string} assetData.asset_type - The type of the asset (e.g., 'STOCK', 'BOND').
   * @param {string} assetData.name_or_ticker - The name or ticker symbol.
   * @param {number} assetData.allocation_percentage - Allocation percentage.
   * @param {number} [assetData.manual_expected_return] - Optional manually set expected return.
   * @returns {Promise<Asset>} A promise that resolves to the newly added asset object.
   * @throws {Error} Throws an error if the API request fails.
   */
  addAssetToPortfolio: async (portfolioId, assetData) => {
    try {
      const endpoint = ENDPOINTS.PORTFOLIO.ADD_ASSET(portfolioId);
      const response = await instance.post(endpoint, assetData);
      return response.data;
    } catch (error) {
      console.error(`Error adding asset to portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Updates an existing asset within a specific portfolio.
   * Note: This function may be a duplicate of functionality in `assetService.js`.
   * Consider using `assetService.updateAssetInPortfolio` directly unless this provides distinct behavior.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {string|number} assetId - The ID of the asset to update.
   * @param {object} assetData - The data to update the asset with (partial updates may be supported).
   * @returns {Promise<Asset>} A promise that resolves to the updated asset object.
   * @throws {Error} Throws an error if the API request fails.
   */
  updateAssetInPortfolio: async (portfolioId, assetId, assetData) => {
    try {
      // Assuming you have an endpoint like ENDPOINTS.PORTFOLIO.UPDATE_ASSET(portfolioId, assetId)
      // If not, you'll need to define it in your ENDPOINTS configuration.
      const endpoint = ENDPOINTS.PORTFOLIO.UPDATE_ASSET(portfolioId, assetId);
      const response = await instance.put(endpoint, assetData);
      return response.data;
    } catch (error) {
      console.error(`Error updating asset ${assetId} in portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Updates specific details of a portfolio (e.g., its name or description).
   * @param {string|number} portfolioId - The ID of the portfolio to update.
   * @param {object} portfolioUpdateData - An object containing the fields to update.
   * @param {string} [portfolioUpdateData.name] - The new name for the portfolio.
   * @param {string} [portfolioUpdateData.description] - The new description for the portfolio.
   * @returns {Promise<Portfolio>} A promise that resolves to the updated portfolio object.
   * @throws {Error} Throws an error if the API request fails (e.g., validation error, portfolio not found).
   */
  updatePortfolioDetails: async (portfolioId, portfolioUpdateData) => {
    try {
      const endpoint = ENDPOINTS.PORTFOLIO.DETAIL(portfolioId);
      const response = await instance.put(endpoint, portfolioUpdateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating portfolio details for ID ${portfolioId}:`, error);
      // Re-throws for the caller (e.g., a view component or settings page) to handle.
      throw error;
    }
  },

  /**
   * @typedef {object} PlannedChange
   * @property {string|number} [id] - ID of the planned change (present if not a new/draft change).
   * @property {string} date - Date of the change (YYYY-MM-DD).
   * @property {string} change_type - Type of change (e.g., 'deposit', 'withdrawal', 'rebalance').
   * @property {number} [amount] - Amount for deposit/withdrawal.
   * @property {string} [description] - Description of the change.
   * @property {Array<object>} [asset_targets] - For rebalancing, target allocations.
   */

  /**
   * @typedef {object} ProjectionParams
   * @property {string} [startDate] - Start date for the projection (YYYY-MM-DD).
   * @property {string} [endDate] - End date for the projection (YYYY-MM-DD).
   * @property {string} [timeHorizon] - Predefined time horizon (e.g., '1y', '5y', 'max').
   * Add other relevant projection parameters here
   */

  /**
   * @typedef {object} ProjectionResult
   * @property {Array<object>} series - Data series for the projection chart.
   * @property {object} summary - Summary statistics of the projection.
   * Add other relevant projection result fields here
   */

  // Projection Preview
  /**
   * Requests a projection preview incorporating temporary or unsaved planned changes.
   * This allows users to see the potential impact of changes before committing them.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {ProjectionParams} projectionParams - Standard parameters for the projection (e.g., time horizon).
   * @param {Array<PlannedChange>} draftChanges - A list of planned changes, including temporary/modified ones,
   *                                            to be used for this preview instead of saved changes.
   * @returns {Promise<ProjectionResult>} A promise that resolves to the projection result object.
   * @throws {Error} Throws an error if the API request fails.
   */
  previewProjection: async (portfolioId, projectionParams, draftChanges) => {
    try {
      const endpoint = ENDPOINTS.PORTFOLIO.PREVIEW_PROJECTION(portfolioId);
      const payload = {
        ...projectionParams,
        draft_changes: draftChanges,
      };
      const response = await instance.post(endpoint, payload);
      return response.data;
    } catch (error) {
      console.error(`Error fetching projection preview for portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Updates a specific planned change for a portfolio.
   * Note: This function may be a duplicate of functionality in `plannedChangeService.js`.
   * Consider using `plannedChangeService.updatePlannedChange` directly unless this provides distinct behavior.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {string|number} changeId - The ID of the planned change to update.
   * @param {Partial<PlannedChange>} changeData - The data to update the planned change with.
   * @returns {Promise<PlannedChange>} A promise that resolves to the updated planned change object.
   * @throws {Error} Throws an error if the API request fails.
   */
  updatePlannedChange: async (portfolioId, changeId, changeData) => {
    try {
      const endpoint = ENDPOINTS.PORTFOLIO.UPDATE_PLANNED_CHANGE(portfolioId, changeId);
      const response = await instance.put(endpoint, changeData);
      return response.data;
    } catch (error) {
      console.error(`Error updating planned change ${changeId} for portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Adds a new planned change to a portfolio.
   * Note: This function may be a duplicate of functionality in `plannedChangeService.js`.
   * Consider using `plannedChangeService.addPlannedChange` directly unless this provides distinct behavior.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {Omit<PlannedChange, 'id'>} changeData - The data for the new planned change.
   * @returns {Promise<PlannedChange>} A promise that resolves to the newly created planned change object.
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
   * Deletes a specific planned change from a portfolio.
   * Note: This function may be a duplicate of functionality in `plannedChangeService.js`.
   * Consider using `plannedChangeService.deletePlannedChange` directly unless this provides distinct behavior.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {string|number} changeId - The ID of the planned change to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is successful (typically with no content).
   * @throws {Error} Throws an error if the API request fails.
   */
  deletePlannedChange: async (portfolioId, changeId) => {
    try {
      // Ensure ENDPOINTS.PORTFOLIO.DELETE_PLANNED_CHANGE is defined in your config, e.g.:
      // DELETE_PLANNED_CHANGE: (portfolioId, changeId) => `portfolios/${portfolioId}/planned-changes/${changeId}`,
      const endpoint = ENDPOINTS.PORTFOLIO.DELETE_PLANNED_CHANGE(portfolioId, changeId);
      await instance.delete(endpoint);
      await instance.delete(endpoint);
      // No specific data to return on successful DELETE (often 204 No Content).
    } catch (error) {
      console.error(`Error deleting planned change ${changeId} from portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  // Future methods like deletePortfolio would be added here.
  // /**
  //  * Deletes a specific portfolio by its ID.
  //  * @param {string|number} portfolioId - The ID of the portfolio to delete.
  //  * @returns {Promise<void>} A promise that resolves upon successful deletion.
  //  * @throws {Error} Throws an error if the API request fails.
  //  */
  // deletePortfolio: async (portfolioId) => {
  //   try {
  //     const endpoint = ENDPOINTS.PORTFOLIO.DETAIL(portfolioId); // Assuming same endpoint for DELETE
  //     await instance.delete(endpoint);
  //     // No content typically returned on successful DELETE
  //     return;
  //   } catch (error) {
  //     console.error(`Error deleting portfolio ${portfolioId}:`, error);
  //     throw error;
  //   }
  // },
};

export default portfolioService;
