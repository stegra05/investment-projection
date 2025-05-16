import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import settingsService from '../api/settingsService';

const SETTINGS_STORAGE_KEY = 'app-settings';

const settingsStore = (set, _get) => ({
  defaultInflationRate: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await settingsService.getUserSettings();
      const rate = data.defaultInflationRate !== undefined ? data.defaultInflationRate : null;
      set({ defaultInflationRate: rate, isLoading: false });
      return rate;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch settings';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateDefaultInflationRate: async (rate) => {
    set({ isLoading: true, error: null });
    try {
      const rateToSave = (rate === '' || rate === null) ? null : parseFloat(rate);
      if (rateToSave !== null && (isNaN(rateToSave) || rateToSave < 0 || rateToSave > 100)) {
        throw new Error('Inflation rate must be a number between 0 and 100, or empty.');
      }
      await settingsService.updateUserSettings({ defaultInflationRate: rateToSave });
      set({ defaultInflationRate: rateToSave, isLoading: false });
    } catch (error) {
      console.error('Failed to update default inflation rate:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update inflation rate';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
});

const useSettingsStore = create(
  persist(
    settingsStore,
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ defaultInflationRate: state.defaultInflationRate }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.error = null;
        }
        console.log('Settings store rehydrated');
      },
    },
  ),
);

export default useSettingsStore; 