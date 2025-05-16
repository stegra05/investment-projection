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
    set({ isLoading: true, error: null });
    try {
      const data = await portfolioService.getUserPortfolios();
      // Ensure that 'data' is an array. If not, default to an empty array.
      set({ portfolios: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch portfolios';
      // Reset portfolios to an empty array on error to prevent stale data or type issues.
      set({ portfolios: [], isLoading: false, error: errorMessage });
    }
  },

  /**
   * Clears the error message from the store state.
   */
  clearError: () => set({ error: null }),

  // Potential future actions: addPortfolio, deletePortfolio, updatePortfolio, etc.
}));

export default usePortfolioListStore;
