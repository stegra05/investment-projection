import apiClient from './apiClient';

/**
 * Service functions for managing planned changes within a portfolio.
 */
const changeService = {
  /**
   * Creates a new planned change for a portfolio.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {object} changeData - The data for the new change (change_type, change_date, amount, description).
   * @returns {Promise<object>} The created change object.
   */
  createChange: async (portfolioId, changeData) => {
    try {
      const response = await apiClient.post(`/portfolios/${portfolioId}/changes`, changeData);
      return response.data;
    } catch (error) {
      console.error('Error creating change:', error.response?.data || error.message);
      throw error; // Re-throw to be handled by the calling component
    }
  },

  /**
   * Updates an existing planned change for a portfolio.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {string|number} changeId - The ID of the change to update.
   * @param {object} changeData - The updated data for the change.
   * @returns {Promise<object>} The updated change object.
   */
  updateChange: async (portfolioId, changeId, changeData) => {
    try {
      const response = await apiClient.put(`/portfolios/${portfolioId}/changes/${changeId}`, changeData);
      return response.data;
    } catch (error) {
      console.error('Error updating change:', error.response?.data || error.message);
      throw error; // Re-throw
    }
  },

  /**
   * Deletes a planned change.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {string|number} changeId - The ID of the change to delete.
   * @returns {Promise<void>}
   */
  deleteChange: (portfolioId, changeId) => {
    return apiClient.delete(`/portfolios/${portfolioId}/changes/${changeId}`);
  },

  // Potential future function:
  // getChanges: (portfolioId) => {
  //   return apiClient.get(`/portfolios/${portfolioId}/changes`);
  // }
};

export default changeService; 