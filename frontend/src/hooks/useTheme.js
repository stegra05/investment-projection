import { useEffect } from 'react';
import useThemeStore from '../store/themeStore';

const useTheme = () => {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    const root = document.documentElement; // Target <html> element
    if (theme === 'high-contrast') {
      root.classList.add('theme-high-contrast');
      root.classList.remove('theme-default'); // Ensure default is removed
    } else {
      root.classList.add('theme-default');
      root.classList.remove('theme-high-contrast');
    }
    // Optional: Store preference in localStorage directly if not using persist middleware
    // localStorage.setItem('theme', theme);
  }, [theme]);

  // This effect was intended to initialize from localStorage if not using persist, or to sync.
  // With Zustand persist middleware, the store is automatically rehydrated, and the `theme` variable
  // will reflect the persisted value. The useEffect above `[theme]` will then apply the class.
  // Thus, this second useEffect is not strictly necessary for functionality with persist.
  // useEffect(() => {
  //   const _storedTheme = localStorage.getItem('app-theme'); // Prefix to mark as handled
  //   // Logic to setTheme based on _storedTheme if not using persist, but persist handles it.
  // }, [setTheme]); // Dependency on setTheme might cause re-runs if setTheme reference changes.

  return { theme, toggleTheme, setTheme };
};

export default useTheme; 