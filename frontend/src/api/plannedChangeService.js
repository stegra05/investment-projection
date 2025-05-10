import instance from './axiosInstance';
import { ENDPOINTS } from '../config/api';

const plannedChangeService = {
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
};

export default plannedChangeService; 