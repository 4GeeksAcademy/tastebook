# Old CSS Styling Implementation - Deactivation Guide

## Current Theme System Analysis

The current styling implementation uses a custom theme system with the following components:

### 1. Theme Files Location
- **Location**: `/workspaces/tastebook/public/themes/`
- **Files**: `dark.css`, `light.css`, `main.css`, `gradients.css`, `original.css`, `professional.css`, `recipes.css`

### 2. Theme Configuration
- **File**: `/workspaces/tastebook/src/front/utils/themeConfig.js`
- **Purpose**: Manages theme switching by changing CSS file links

### 3. Theme Components
- **ThemeSelector**: `/workspaces/tastebook/src/front/components/ThemeSelector.jsx`
- **Navbar Dark Mode Toggle**: Custom dark mode implementation in Navbar.jsx

### 4. HTML Theme Link
- **Location**: `index.html`
- **Element**: `<link id="theme-link" rel="stylesheet" href="/themes/light.css" />`

---

## Step-by-Step Deactivation Guide

### Step 1: Remove Theme Link from index.html
**File**: `/workspaces/tastebook/index.html`
**Action**: Remove or comment out the line:
```html
<!-- <link id="theme-link" rel="stylesheet" href="/themes/light.css" /> -->
```

### Step 2: Remove Custom Dark Mode Toggle from Navbar
**File**: `/workspaces/tastebook/src/front/components/Navbar.jsx`
**Actions**:
1. Remove dark mode state: `const [darkMode, setDarkMode] = useState(false);`
2. Remove dark mode effects (localStorage, document class manipulation)
3. Remove the dark mode toggle button (Sun/Moon icons)
4. Remove `toggleDarkMode` function

### Step 3: Disable ThemeSelector Component Usage
**Files**: Any file that imports/uses `ThemeSelector.jsx`
**Action**: Remove or comment out ThemeSelector component usage

### Step 4: Stop Theme Configuration Loading
**File**: `/workspaces/tastebook/src/front/utils/themeConfig.js`
**Action**: The `useTheme` hook can be left as-is (won't be used) or commented out

### Step 5: Optional - Rename Theme Files
**Location**: `/workspaces/tastebook/public/themes/`
**Action**: Rename files to `.old` extension to prevent accidental loading:
- `dark.css` → `dark.css.old`
- `light.css` → `light.css.old`
- etc.

---

## Important Notes

1. **Don't delete files yet** - Keep them as backup in case rollback is needed
2. **Test after each step** - Ensure the app still loads without errors
3. **Bootstrap CSS will handle styling** - The custom theme variables will be replaced by Bootstrap's built-in dark mode
4. **Component styles** - Some components may need minor adjustments after removing custom CSS variables

---

## Expected Results After Deactivation

- No custom theme switching functionality
- Default Bootstrap styling will be visible
- Ready for Bootstrap 5.3 dark mode implementation
- Cleaner, simpler theme management
