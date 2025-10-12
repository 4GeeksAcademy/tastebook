import { useState, useEffect } from "react";

const THEME_CHANGE_EVENT = 'bootstrap-theme-change';

const isBrowser = () => typeof window !== 'undefined';

const dispatchThemeChange = (preference, actual) => {
  if (!isBrowser()) return;
  const detail = { preference, actual };
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail }));
};

/**
 * Custom hook for managing Bootstrap 5.3 dark mode theme
 * Handles theme persistence, system preference detection, and live updates
 */
export const useTheme = () => {
  // Get initial theme preference
  const getPreferredTheme = () => {
    if (!isBrowser()) return 'auto';
    let storedTheme = null;
    try {
      storedTheme = localStorage.getItem('theme');
    } catch (e) {
      storedTheme = null;
    }
    if (storedTheme && ['light', 'dark', 'auto'].includes(storedTheme)) {
      return storedTheme;
    }
    return 'auto'; // Default to auto (system preference)
  };

  // Get actual theme to apply (resolves 'auto' to 'light' or 'dark')
  const getActualTheme = (theme) => {
    if (!isBrowser()) return 'light';
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const [theme, setThemeState] = useState(getPreferredTheme);
  const [actualTheme, setActualTheme] = useState(() => getActualTheme(getPreferredTheme()));

  // Sync with external theme change events
  useEffect(() => {
    if (!isBrowser()) return undefined;

    const handleExternalThemeChange = (event) => {
      const { preference, actual } = event.detail || {};
      if (!preference) return;

      setThemeState((prev) => (prev === preference ? prev : preference));
      if (actual) {
        setActualTheme((prev) => (prev === actual ? prev : actual));
      }
    };

    const handleStorage = (event) => {
      if (event.key !== 'theme' || !event.newValue) return;
      if (!['light', 'dark', 'auto'].includes(event.newValue)) return;
      setThemeState(event.newValue);
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleExternalThemeChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleExternalThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Function to set theme and update DOM + localStorage
  const setTheme = (newTheme) => {
    if (!['light', 'dark', 'auto'].includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}. Using 'auto' instead.`);
      newTheme = 'auto';
    }

    // Update state
    setThemeState(newTheme);
    
    // Get actual theme to apply
  const resolvedTheme = getActualTheme(newTheme);
    setActualTheme(resolvedTheme);
    
    // Update HTML data attribute
    if (isBrowser()) {
      document.documentElement.setAttribute('data-bs-theme', resolvedTheme);
    }
  dispatchThemeChange(newTheme, resolvedTheme);
    
    // Store in localStorage
    try {
      localStorage.setItem('theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  };

  // Toggle between light and dark (skips auto)
  const toggleTheme = () => {
    const nextTheme = actualTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  // Listen for system theme changes when theme is set to 'auto'
  useEffect(() => {
    if (!isBrowser()) return undefined;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (resolvedTheme) => {
      setActualTheme(resolvedTheme);
      if (isBrowser()) {
        document.documentElement.setAttribute('data-bs-theme', resolvedTheme);
      }
      dispatchThemeChange(theme, resolvedTheme);
    };

    const handleSystemThemeChange = (e) => {
      if (theme === 'auto') {
        const resolvedTheme = e.matches ? 'dark' : 'light';
        applyTheme(resolvedTheme);
      }
    };

    // Add listener for system theme changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Initial theme application
    const resolvedTheme = getActualTheme(theme);
    applyTheme(resolvedTheme);

    // Cleanup listener
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  // Get current actual theme being displayed
  const getCurrentTheme = () => actualTheme;

  return {
    theme,           // Current theme preference ('light', 'dark', 'auto')
    setTheme,        // Function to set theme preference
    toggleTheme,     // Function to toggle between light/dark
    currentTheme: getCurrentTheme(), // Actual theme being displayed
    isAuto: theme === 'auto'  // Whether auto mode is enabled
  };
};