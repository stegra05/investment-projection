import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const THEME_STORAGE_KEY = 'app-theme';

const themeStore = (set, _get) => ({
  theme: 'default', // Possible values: 'default', 'high-contrast'
  
  toggleTheme: () => {
    set((state) => ({
      theme: state.theme === 'default' ? 'high-contrast' : 'default',
    }));
  },

  // Action to set a specific theme, e.g., loaded from localStorage
  setTheme: (newTheme) => {
    if (newTheme === 'default' || newTheme === 'high-contrast') {
      set({ theme: newTheme });
    }
  },
});

const useThemeStore = create(
  persist(
    themeStore,
    {
      name: THEME_STORAGE_KEY, // Unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage
      onRehydrateStorage: (_state) => {
        // Optional: You can do something when state is rehydrated
        console.log('Theme store rehydrated');
        // This is a good place to initially apply the theme to the body/html tag
        // However, the hook will also handle this.
      },
    }
  )
);

export default useThemeStore; 