import React from "react";
import { useTheme } from "../hooks/useTheme";
import { Sun, Moon } from "lucide-react";

/**
 * Bootstrap 5.3 Dark Mode Toggle Component
 */

const TOGGLER_ICON_SIZE = 26;
const TOGGLER_STROKE_WIDTH = 2.4;

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
        // <Sun  size={TOGGLER_ICON_SIZE} strokeWidth={TOGGLER_STROKE_WIDTH} className="text-warning"/>
        <Moon size={TOGGLER_ICON_SIZE} strokeWidth={TOGGLER_STROKE_WIDTH} className="text-primary" />
        ) : (
        // <Moon size={TOGGLER_ICON_SIZE} strokeWidth={TOGGLER_STROKE_WIDTH} className="text-primary" />
        <Sun  size={TOGGLER_ICON_SIZE} strokeWidth={TOGGLER_STROKE_WIDTH} className="text-warning"/>
      )}
    </button>
  );
}