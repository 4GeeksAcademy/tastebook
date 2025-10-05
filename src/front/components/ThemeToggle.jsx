import React from "react";
import { useTheme } from "../hooks/useTheme";
import { Sun, Moon } from "lucide-react";

/**
 * Bootstrap 5.3 Dark Mode Toggle Component
 */
export default function ThemeToggle() {
  const { theme, toggleTheme, currentTheme } = useTheme();

  // Determine icon and text based on current displayed theme
  const isDark = currentTheme === 'dark';
  
  return (
    <button 
      className="btn btn-outline-secondary border-0" 
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
          <Sun size={20} className="text-warning" />
      ) : (
          <Moon size={20} className="text-primary" />
      )}
    </button>
  );
}