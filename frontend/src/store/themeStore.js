import { create } from 'zustand'; // Zustand library for state management.
import { persist, createJSONStorage } from 'zustand/middleware'; // Zustand middleware for persistence.

/**
 * @file themeStore.js
 * @description Zustand store for managing the application's UI theme.
 * This store handles the current theme state (e.g., 'default', 'high-contrast'),
 * provides actions to toggle or set the theme, and persists the theme preference
 * to `localStorage` using Zustand's `persist` middleware.
 */

/**
 * The key used for storing the persisted theme data in `localStorage`.
 * @type {string}
 */
const THEME_STORAGE_KEY = 'app-theme';

/**
 * Defines the state and actions for the theme store.
 * This function is passed to `create(persist(...))` to generate the Zustand store.
 * @param {Function} set - Zustand's `set` function to update store state.
 * @param {Function} _get - Zustand's `get` function to access store state (not used here but available).
 * @returns {object} The store's initial state and actions.
 */
const themeStoreDefinition = (set, _get) => ({
  /** 
   * @property {string} theme
   * @description The current active theme of the application.
   * Possible values typically include 'default' and 'high-contrast'.
   * This state is persisted to localStorage.
   * Default: 'default'.
   */
  theme: 'default', 
  
  /**
   * Toggles the application theme between 'default' and 'high-contrast'.
   * If the current theme is 'default', it changes to 'high-contrast', and vice-versa.
   * @function toggleTheme
   */
  toggleTheme: () => {
    set((state) => ({
      theme: state.theme === 'default' ? 'high-contrast' : 'default',
    }));
  },

  /**
   * Sets the application theme to a specific value.
   * It only updates the theme if `newTheme` is one of the recognized values ('default', 'high-contrast').
   * This action can be used, for example, to apply a theme loaded from user preferences or localStorage
   * if not using the persist middleware's automatic rehydration for this specific logic.
   * @function setTheme
   * @param {string} newTheme - The theme identifier string to set (e.g., 'default', 'high-contrast').
   */
  setTheme: (newTheme) => {
    // Validate if the newTheme is one of the allowed theme values before setting.
    if (newTheme === 'default' || newTheme === 'high-contrast') {
      set({ theme: newTheme });
    }
    // If other themes were supported, they would be added to the condition above.
  },
});

/**
 * @store useThemeStore
 * @description Zustand store for managing the application's UI theme, configured with persistence.
 * It uses `persist` middleware to save the `theme` state to `localStorage`.
 *
 * For details on state properties and actions, see `themeStoreDefinition`.
 */
const useThemeStore = create(
  // Use Zustand's `persist` middleware to save the theme state.
  persist(
    themeStoreDefinition, // The function defining the store's state and actions.
    {
      name: THEME_STORAGE_KEY, // Unique key for storing data in localStorage.
      // Specifies localStorage as the storage medium, with JSON serialization.
      storage: createJSONStorage(() => localStorage), 
      // `partialize` is not used here, so the entire store state (which is just `theme`)
      // will be persisted by default. If other non-persistent state were added to this store,
      // `partialize` would be needed to select only `theme` for persistence.
      
      /**
       * Optional: A listener called when the store is rehydrated from localStorage.
       * This function receives the persisted state (or undefined if nothing was stored).
       * @param {object|undefined} _persistedState - The state object rehydrated from storage.
       *                                            Not directly used here as rehydration is automatic.
       */
      onRehydrateStorage: (_persistedState) => {
        // This callback is executed after the store has been rehydrated.
        console.log('Theme store has been rehydrated from localStorage.');
        // The `useTheme` hook is responsible for applying the rehydrated theme
        // to the document's classList. If that hook didn't exist,
        // one might do it here using `_persistedState.theme` or `get().theme`.
        // Example: if (_persistedState?.theme) { applyThemeToBody(_persistedState.theme); }
        return undefined; // No explicit action needed on the state itself here, `set` is not called.
      },
    }
  )
);

// Export the Zustand store hook for use in components or other hooks.
export default useThemeStore;