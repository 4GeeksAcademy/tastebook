import React from "react";
import { THEMES, useTheme, getThemeKeys, getThemeName } from "../utils/themeConfig";

const ThemeSelector = () => {

    const [theme, setTheme] = useTheme();

    const handleThemeClick = (selectedTheme) => {
        setTheme(selectedTheme);
    };

    return (
        <div>
            <label className="form-label">Theme</label>
            <div className="d-flex flex-wrap gap-2 mt-2">
                {getThemeKeys().map((themeKey) => (
                    <button
                        key={themeKey}
                        type="button"
                        className={`btn ${theme === themeKey ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => handleThemeClick(themeKey)}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                    >
                        {getThemeName(themeKey)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ThemeSelector;
