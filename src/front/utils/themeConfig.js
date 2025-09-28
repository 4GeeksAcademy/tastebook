// Centralized theme configuration
// Add/modify themes here and they'll be automatically available in all components

export const THEMES = {
    gradients: {
        name: "Gradients",
        cssPath: "/themes/gradients.css"
    },
    light: {
        name: "Light", 
        cssPath: "/themes/light.css"
    },
    dark: {
        name: "Dark",
        cssPath: "/themes/dark.css"
    },
    original: {
        name: "Original",
        cssPath: "/themes/original.css"
    }
};

// Helper functions for easier usage
export const getThemeKeys = () => Object.keys(THEMES);
export const getThemeName = (themeKey) => THEMES[themeKey]?.name || themeKey;
export const getThemePath = (themeKey) => THEMES[themeKey]?.cssPath;
export const getDefaultTheme = () => "light"; // You can change this default here

// Custom hook for theme management with synchronization
import { useState, useEffect } from "react";

// Create a custom event for theme changes
const THEME_CHANGE_EVENT = 'themeChange';

// Helper function to dispatch theme change events
const dispatchThemeChange = (newTheme) => {
    const event = new CustomEvent(THEME_CHANGE_EVENT, { detail: newTheme });
    window.dispatchEvent(event);
};

export const useTheme = (onThemeChange) => {
    const [theme, setTheme] = useState(() => {
        try { 
            return localStorage.getItem("theme") || getDefaultTheme(); 
        } catch (e) { 
            return getDefaultTheme(); 
        }
    });

    // Listen for theme changes from other components
    useEffect(() => {
        const handleThemeChange = (event) => {
            setTheme(event.detail);
        };

        window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
        
        return () => {
            window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
        };
    }, []);

    // Apply theme changes
    useEffect(() => {
        const link = document.getElementById("theme-link");
        const themePath = getThemePath(theme);
        
        if (link && themePath) {
            link.href = themePath;
            try { 
                localStorage.setItem("theme", theme); 
            } catch (e) { 
                /* ignore */ 
            }
        }
        
        // Call parent callback if provided
        if (onThemeChange) {
            onThemeChange(theme);
        }
    }, [theme, onThemeChange]);

    // Custom setter that dispatches events to sync other components
    const setThemeWithSync = (newTheme) => {
        setTheme(newTheme);
        dispatchThemeChange(newTheme);
    };

    return [theme, setThemeWithSync];
};