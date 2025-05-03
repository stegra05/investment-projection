import instance from './axiosInstance';

const analyticsService = {
  /**
   * Fetches the risk profile analysis for a specific portfolio.
   * @param {string|number} portfolioId - The ID of the portfolio to analyze.
   * @returns {Promise<object>} A promise that resolves to the risk profile data.
   * @throws {Error} Throws an error if the API request fails.
   */
  getRiskProfile: async (portfolioId) => {
    try {
      const response = await instance.get(`/api/v1/portfolios/${portfolioId}/analytics/risk-profile`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching risk profile for portfolio ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Fetches performance data for a specific portfolio within an optional date range.
   * @param {string|number} portfolioId - The ID of the portfolio to analyze.
   * @param {string|null} [startDate] - Optional start date for the performance period (ISO format).
   * @param {string|null} [endDate] - Optional end date for the performance period (ISO format).
   * @returns {Promise<object>} A promise that resolves to the performance data.
   * @throws {Error} Throws an error if the API request fails.
   */
  getPerformanceData: async (portfolioId, startDate = null, endDate = null) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `/api/v1/portfolios/${portfolioId}/analytics/performance${
        params.toString() ? `?${params.toString()}` : ''
      }`;

      const response = await instance.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching performance data for portfolio ${portfolioId}:`, error);
      throw error;
    }
  },
};

export default analyticsService; 