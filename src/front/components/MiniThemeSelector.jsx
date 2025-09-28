import React from "react";
import { useTheme, getThemeKeys, getThemeName } from "../utils/themeConfig";

const MiniThemeSelector = ({ onThemeChange }) => {
    
    const [theme, setTheme] = useTheme(onThemeChange);

    const handleThemeClick = (selectedTheme) => {
        setTheme(selectedTheme);
    };

    return (
        <div className="mini-theme-selector">
            <div className="mb-2">
                <small className="text-muted fw-bold">Quick Theme Switch</small>
            </div>
            <div className="d-flex flex-wrap gap-1">
                {getThemeKeys().map((themeKey) => (
                    <button
                        key={themeKey}
                        type="button"
                        className={`btn btn-sm ${theme === themeKey ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => handleThemeClick(themeKey)}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                        {getThemeName(themeKey)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MiniThemeSelector;