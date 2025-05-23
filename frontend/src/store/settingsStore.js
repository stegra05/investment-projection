import { create } from 'zustand'; // Zustand library for state management.
import { persist, createJSONStorage } from 'zustand/middleware'; // Zustand middleware for persistence.
import settingsService from '../api/settingsService'; // API service for settings-related requests.

/**
 * @file settingsStore.js
 * @description Zustand store for managing global user-specific application settings.
 * This store handles settings like the default inflation rate, manages loading and error states
 * for fetching/updating these settings, and persists the `defaultInflationRate` to `localStorage`.
 * It interacts with `settingsService` for backend communication.
 */

/**
 * The key used for storing persisted settings data in `localStorage`.
 * @type {string}
 */
const SETTINGS_STORAGE_KEY = 'app-settings';

/**
 * Defines the state and actions for the settings store.
 * This function is passed to `create(persist(...))` to generate the Zustand store.
 * @param {Function} set - Zustand's `set` function to update store state.
 * @param {Function} _get - Zustand's `get` function to access store state (not used in this version but available).
 * @returns {object} The store's initial state and actions.
 */
const settingsStoreDefinition = (set, _get) => ({
  /** 
   * @property {number|null} defaultInflationRate 
   * @description The user's preferred default annual inflation rate for projections.
   * Persisted to localStorage. Initialized as null.
   */
  defaultInflationRate: null,
  /** 
   * @property {boolean} isLoading 
   * @description Indicates if settings are currently being fetched from or saved to the backend.
   */
  isLoading: false,
  /** 
   * @property {string|object|null} error 
   * @description Stores error messages or error objects from failed API operations related to settings.
   */
  error: null,

  /**
   * Asynchronously fetches user settings (specifically `defaultInflationRate`) from the backend.
   * Updates store state with fetched data, loading status, and any errors.
   * @async
   * @function fetchSettings
   * @returns {Promise<number|null>} A promise that resolves to the fetched inflation rate, or null if not set/found.
   * @throws {Error} Throws an error if the API call fails, allowing calling components to handle it.
   */
  fetchSettings: async () => {
    set({ isLoading: true, error: null }); // Set loading, clear previous errors.
    try {
      const data = await settingsService.getUserSettings(); // API call.
      // Extract defaultInflationRate, defaulting to null if undefined.
      const rate = data.defaultInflationRate !== undefined ? data.defaultInflationRate : null;
      set({ defaultInflationRate: rate, isLoading: false }); // Update state on success.
      return rate; // Return the fetched rate.
    } catch (error) {
      console.error('Failed to fetch settings from API:', error);
      // Extract a user-friendly error message.
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch settings. Please try again.';
      set({ error: errorMessage, isLoading: false }); // Update state with error.
      throw error; // Re-throw error for components to handle if necessary.
    }
  },

  /**
   * Asynchronously updates the user's default inflation rate on the backend and in the store.
   * Performs basic client-side validation before making the API call.
   * @async
   * @function updateDefaultInflationRate
   * @param {number|string|null} rate - The new default inflation rate to save.
   *                                    An empty string or null will be treated as clearing the rate (saved as null).
   * @throws {Error} Throws an error if validation fails or the API call fails.
   */
  updateDefaultInflationRate: async (rate) => {
    set({ isLoading: true, error: null }); // Set loading, clear previous errors.
    try {
      // Process input: empty string or null means rate should be null; otherwise, parse as float.
      const rateToSave = (rate === '' || rate === null) ? null : parseFloat(rate);
      // Client-side validation: if a rate is provided (not null), it must be a non-negative number up to 100.
      if (rateToSave !== null && (isNaN(rateToSave) || rateToSave < 0 || rateToSave > 100)) {
        throw new Error('Inflation rate must be a valid number between 0 and 100, or left empty to clear.');
      }
      // API call to update user settings.
      await settingsService.updateUserSettings({ defaultInflationRate: rateToSave });
      // Update store state on successful API call.
      set({ defaultInflationRate: rateToSave, isLoading: false });
    } catch (error) {
      console.error('Failed to update default inflation rate via API:', error);
      // Extract user-friendly error message.
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update default inflation rate. Please try again.';
      set({ error: errorMessage, isLoading: false }); // Update state with error.
      throw error; // Re-throw error for components to handle.
    }
  },

  /**
   * Clears any stored error message from the `error` state property.
   * @function clearError
   */
  clearError: () => {
    set({ error: null }); // Reset error state to null.
  },
});

/**
 * @store useSettingsStore
 * @description Zustand store for managing user-specific application settings, configured with persistence.
 * It uses `persist` middleware to save the `defaultInflationRate` to `localStorage`.
 *
 * For details on state properties and actions, see `settingsStoreDefinition`.
 */
const useSettingsStore = create(
  // Use Zustand's `persist` middleware to save parts of the store's state.
  persist(
    settingsStoreDefinition, // The function defining the store's state and actions.
    {
      name: SETTINGS_STORAGE_KEY, // Key used for storing data in localStorage.
      // Specifies localStorage as the storage medium, with JSON serialization.
      storage: createJSONStorage(() => localStorage), 
      /**
       * A function that defines which parts of the state should be persisted.
       * Here, only `defaultInflationRate` is persisted. `isLoading` and `error` are transient.
       * @param {object} state - The current store state.
       * @returns {object} The part of the state to persist.
       */
      partialize: (state) => ({ defaultInflationRate: state.defaultInflationRate }),
      /**
       * Optional: A listener called when the store is rehydrated from localStorage.
       * Can be used to perform actions after rehydration, e.g., resetting transient state.
       * @param {object} state - The rehydrated state.
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure transient states like isLoading and error are reset on rehydration,
          // as they should not persist across sessions.
          state.isLoading = false;
          state.error = null;
        }
        console.log('Settings store has been rehydrated from localStorage.');
      },
    },
  ),
);

// Export the Zustand store hook for use in components or other hooks.
export default useSettingsStore;