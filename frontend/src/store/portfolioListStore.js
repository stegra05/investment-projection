import { create } from 'zustand'; // Zustand library for state management.
import portfolioService from '../api/portfolioService'; // API service for portfolio-related requests.

/**
 * @file portfolioListStore.js
 * @description Zustand store for managing the global list of user portfolios.
 * This store handles fetching all portfolios associated with the authenticated user,
 * tracks loading states during these operations, and stores any errors encountered.
 * It provides actions to fetch the portfolio list and clear errors.
 */

/**
 * @store usePortfolioListStore
 * @description Zustand store definition for managing the list of user portfolios.
 *
 * @property {Array<object>} portfolios - An array of portfolio objects fetched from the API.
 *                                        Each object typically contains details like `portfolio_id`, `name`, etc.
 *                                        Defaults to an empty array.
 * @property {boolean} isLoading - True when the portfolio list is being fetched from the API, false otherwise.
 * @property {string|object|null} error - Stores error messages or error objects from failed attempts to fetch portfolios.
 *                                       Null if no error or error has been cleared.
 *
 * @action fetchPortfolios - Asynchronously fetches the list of user portfolios and updates the store state.
 * @action clearError - Clears any stored error message related to fetching the portfolio list.
 */
const usePortfolioListStore = create(set => ({
  /** 
   * @property {Array<object>} portfolios 
   * @description The list of portfolio objects for the current user. 
   * Initialized as an empty array.
   */
  portfolios: [],
  /** 
   * @property {boolean} isLoading 
   * @description Indicates if the portfolio list is currently being fetched.
   */
  isLoading: false,
  /** 
   * @property {string|object|null} error 
   * @description Stores any error encountered during portfolio list fetching.
   */
  error: null,

  /**
   * Asynchronously fetches the user's portfolios from the API using `portfolioService.getUserPortfolios()`
   * and updates the store's `portfolios`, `isLoading`, and `error` states accordingly.
   * Handles successful data retrieval and error scenarios.
   */
  fetchPortfolios: async () => {
    // Set loading state to true and clear any previous errors before starting the fetch.
    set({ isLoading: true, error: null });
    try {
      // Call the API service to get user portfolios.
      const response = await portfolioService.getUserPortfolios();
      // The backend service is expected to return an object like { data: [...], pagination: {...} }.
      // We are interested in the 'data' property which should be an array of portfolios.
      set({
        portfolios: Array.isArray(response.data) ? response.data : [], // Ensure portfolios is always an array.
        // TODO: Consider storing pagination information as well if the API supports it and UI requires it.
        isLoading: false, // Reset loading state on successful fetch.
      });
    } catch (error) {
      // Handle errors during the fetch operation.
      console.error("Error fetching portfolios in store:", error); // Log the full error for debugging.
      // Extract a user-friendly error message from the API response or error object.
      const errorMessage =
        error.response?.data?.message || // Prioritize backend's error message.
        error.message ||                 // Fallback to generic error message.
        'Failed to fetch portfolios. Please try again.'; // Default fallback.
      // Update store state: reset portfolios to empty array on error to prevent stale/corrupted data,
      // set loading to false, and store the error message.
      set({ portfolios: [], isLoading: false, error: errorMessage });
    }
  },

  /**
   * Clears any stored error message from the `error` state property.
   */
  clearError: () => set({ error: null }), // Reset error state to null.

  // Placeholder comment for potential future actions related to the portfolio list,
  // such as optimistic updates for add/delete/update if not handled by re-fetching.
  // e.g., addPortfolioToList, removePortfolioFromList, updatePortfolioInList
}));

// Export the Zustand store hook for use in components or other hooks.
export default usePortfolioListStore;
