import { useEffect } from 'react';
import useThemeStore from '../store/themeStore'; // Zustand store for managing theme state.

/**
 * @hook useTheme
 * @description A custom React hook that provides access to the current application theme
 * and functions to modify it (toggle or set explicitly). It interacts with a global
 * Zustand store (`useThemeStore`) for theme state management and persistence.
 * A key responsibility of this hook is to apply the current theme as a CSS class
 * to the root `<html>` element, enabling global theme-specific styling across the application.
 *
 * @returns {object} An object containing:
 *  - `theme` (string): The current active theme (e.g., 'default', 'high-contrast').
 *  - `toggleTheme` (Function): A function to switch to the next available theme.
 *                              The specific toggle logic is defined within `useThemeStore`.
 *  - `setTheme` (Function): A function to set the theme to a specific value.
 *                           Accepts a theme identifier string as an argument.
 *
 * @example
 * const { theme, toggleTheme } = useTheme();
 * // In a component:
 * // <button onClick={toggleTheme}>Toggle Theme</button>
 * // <div className={theme === 'dark' ? 'dark-styles' : 'light-styles'}>...</div>
 * // (Though direct className checks are less common if global CSS classes on <html> are used)
 */
const useTheme = () => {
  // Select the current theme state from the Zustand store.
  const theme = useThemeStore((state) => state.theme);
  // Select the `toggleTheme` action from the Zustand store.
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  // Select the `setTheme` action from the Zustand store.
  const setTheme = useThemeStore((state) => state.setTheme);

  // `useEffect` to apply the current theme class to the root <html> element.
  // This enables global CSS rules based on the active theme.
  useEffect(() => {
    const root = document.documentElement; // Get the <html> element.

    // Remove any existing theme classes to prevent conflicts.
    root.classList.remove('theme-default', 'theme-high-contrast'); 
    // Add other theme classes here if more themes are introduced e.g. 'theme-dark'

    // Apply the class for the current theme.
    if (theme === 'high-contrast') {
      root.classList.add('theme-high-contrast');
    } else { // Default theme
      root.classList.add('theme-default');
    }
    // Note: If `useThemeStore` uses Zustand's persist middleware with localStorage,
    // explicitly setting localStorage.setItem('theme', theme) here might be redundant
    // as the store would handle persistence. This comment assumes persistence is handled by the store.
  }, [theme]); // Re-run this effect whenever the `theme` state changes.

  // The commented-out useEffect below demonstrates a common pattern for initializing theme
  // from localStorage if Zustand's persist middleware is NOT used or if more complex
  // synchronization is needed. However, with persist middleware, the store is automatically
  // rehydrated on load, and the `theme` variable selected above will already reflect the
  // persisted value. The `useEffect` hook (dependent on `[theme]`) will then correctly
  // apply the class to the `<html>` element. Thus, this second useEffect is typically
  // not necessary when using Zustand's persist middleware for theme storage.
  //
  // useEffect(() => {
  //   // Example: const localTheme = localStorage.getItem('some-theme-key');
  //   // if (localTheme && localTheme !== theme) {
  //   //   setTheme(localTheme); // Sync store with localStorage if different, and persist handles it.
  //   // }
  // }, [theme, setTheme]); // Careful with dependencies like `setTheme` if its reference isn't stable.

  // Return the theme state and modifier functions for use in components.
  return { theme, toggleTheme, setTheme };
};

export default useTheme;