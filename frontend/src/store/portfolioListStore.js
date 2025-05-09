import { create } from 'zustand';
import portfolioService from '../api/portfolioService';

const usePortfolioListStore = create(set => ({
  portfolios: [],
  isLoading: false,
  error: null,

  /**
   * Fetches the user's portfolios from the API and updates the store state.
   */
  fetchPortfolios: async () => {
    set({ isLoading: true, error: null }); // Start loading, clear previous errors
    try {
      const data = await portfolioService.getUserPortfolios();
      set({ portfolios: data, isLoading: false }); // Update portfolios on success
    } catch (error) {
      // Attempt to get a meaningful error message
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch portfolios';
      set({ error: errorMessage, isLoading: false }); // Set error message on failure
    }
  },

  // Potential future actions: addPortfolio, deletePortfolio, updatePortfolio, etc.
}));

export default usePortfolioListStore;
