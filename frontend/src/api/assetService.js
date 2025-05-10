import instance from './axiosInstance';
import { ENDPOINTS } from '../config/api';

const assetService = {
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
};

export default assetService; 