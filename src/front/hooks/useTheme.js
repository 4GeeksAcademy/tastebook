import { useState, useEffect } from "react";

/**
 * Custom hook for managing Bootstrap 5.3 dark mode theme
 * Handles theme persistence, system preference detection, and live updates
 */
export const useTheme = () => {
  // Get initial theme preference
  const getPreferredTheme = () => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && ['light', 'dark', 'auto'].includes(storedTheme)) {
      return storedTheme;
    }
    return 'auto'; // Default to auto (system preference)
  };

  // Get actual theme to apply (resolves 'auto' to 'light' or 'dark')
  const getActualTheme = (theme) => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const [theme, setThemeState] = useState(getPreferredTheme);

  // Function to set theme and update DOM + localStorage
  const setTheme = (newTheme) => {
    if (!['light', 'dark', 'auto'].includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}. Using 'auto' instead.`);
      newTheme = 'auto';
    }

    // Update state
    setThemeState(newTheme);
    
    // Get actual theme to apply
    const actualTheme = getActualTheme(newTheme);
    
    // Update HTML data attribute
    document.documentElement.setAttribute('data-bs-theme', actualTheme);
    
    // Store in localStorage
    try {
      localStorage.setItem('theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  };

  // Toggle between light and dark (skips auto)
  const toggleTheme = () => {
    const actualTheme = getActualTheme(theme);
    setTheme(actualTheme === 'light' ? 'dark' : 'light');
  };

  // Listen for system theme changes when theme is set to 'auto'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      if (theme === 'auto') {
        const actualTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', actualTheme);
      }
    };

    // Add listener for system theme changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Initial theme application
    const actualTheme = getActualTheme(theme);
    document.documentElement.setAttribute('data-bs-theme', actualTheme);

    // Cleanup listener
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  // Get current actual theme being displayed
  const getCurrentTheme = () => getActualTheme(theme);

  return {
    theme,           // Current theme preference ('light', 'dark', 'auto')
    setTheme,        // Function to set theme preference
    toggleTheme,     // Function to toggle between light/dark
    currentTheme: getCurrentTheme(), // Actual theme being displayed
    isAuto: theme === 'auto'  // Whether auto mode is enabled
  };
};