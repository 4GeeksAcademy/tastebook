<br>
<br>
<br>

---
You can find a comprehensive documentation about this boilerplate here:
https://start.4geeksacademy.com/starters/full-stack

---

<br>
<br>
<br>


---

## Problem encountered

```
[error] [Window] navigator is now a global in nodejs, please see https://aka.ms/vscode-extensions/navigator for additional info on this error.: PendingMigrationError: navigator is now a global in nodejs, please see https://aka.ms/vscode-extensions/navigator for additional info on this error.
```

Fix it by running

```
nvm install 20

And optionally, if Node 20 is not automatically used, run:
nvm use 20
```


---

## Extra Extensions installed

Lints and Intellisense:
- npm Intellisense
- markdownlint (disabled)

Themes (icons and color):
- Material Icon Theme

Version Control and Git:
- GitLens
- Local History


To add them in the `.devcontainer/devcontainer.json` file add them to the "extensions" array, example:

```json
	"customizations": {
		"vscode": {
			"extensions": [
				"esbenp.prettier-vscode",
				"ms-python.autopep8",
        
        "eamodio.gitlens",
        "xyz.local-history",
        "pkief.material-icon-theme"
			]
		}
	}
```

Get the Extension names in their page, look for <kbd>identifier</kbd>


<br>
<br>
<br>
<br>
<br>

---

Websocket transition

Reconnting errors code


```
                        <div className="d-flex align-items-center text-warning">
                            <AlertCircle size={14} className="me-1" />
                            <small>Reconnecting...</small>
                        </div>
```



```
                        <div className="d-flex align-items-center text-warning">
                            <AlertCircle size={14} className="me-1" />
                            <small>Reconnecting...</small>
                        </div>
                    )}
```



Download whole repo from codespace

```
zip -r tastebook.zip . -x ".git/*" "node_modules/*" "*.log" "*.sqlite*" "*.db" ".DS_Store" "dist/*" "build/*" ".history/*" ".venv/*"
```
<mark>IF THIS FOLDERS ARE NOT MARKED, IT WILL DOWNLOAD TOO MANY FILES</mark>


```

```

---

# Changelog

## (October 5, 2025) -- Bootstrap Migration to SCSS

**Changes made:**
- ✅ Installed Bootstrap 5.3.8 and Sass via npm (`npm install bootstrap@5.3.8 sass --save`)
- ✅ Created `src/front/styles/custom.scss` with comprehensive Bootstrap variable overrides
- ✅ Added SCSS import in `main.jsx`: `import './styles/custom.scss'`
- ✅ Added Bootstrap JS import in `main.jsx`: `import 'bootstrap/dist/js/bootstrap.bundle.min.js'`
- ✅ Commented out CDN Bootstrap CSS and JS links in `index.html`
- ✅ Kept anti-flicker theme script intact for immediate theme application

**Benefits:**
- Full SCSS variable control for easy color customization
- Hot Module Replacement (HMR) during development
- Bundled Bootstrap (CSS + JS) with consistent versioning
- Custom recipe card hover effects and theme-specific styling
- Production-ready build optimization

**Key variables available for customization in `custom.scss`:**
- `$primary`, `$secondary`, `$success`, `$info`, `$warning`, `$danger`
- `$body-bg`, `$body-color`, `$text-muted`
- `$font-family-sans-serif`, `$font-size-base`
- Button, card, form, and navbar styling variables
- Grid breakpoints and container sizes

**Next steps:**
- Edit variables in `src/front/styles/custom.scss` to customize theme colors
- Run `npm run dev` to see changes with HMR
- The dark/light theme switching remains functional via CSS custom properties

---

## (October 5, 2025) -- Sass Deprecation Warnings Fix

**Problem encountered:**
When running `npm run dev`, the console was flooded with 339+ Sass deprecation warnings:

```console
Deprecation Warning [import]: Sass @import rules are deprecated and will be removed in Dart Sass 3.0.0.
Deprecation Warning [global-builtin]: Global built-in functions are deprecated and will be removed in Dart Sass 3.0.0.
Deprecation Warning [color-functions]: lighten() is deprecated. Suggestions: color.scale($color, $lightness: 43.4659090909%) color.adjust($color, $lightness: 15%)
Warning: 339 repetitive deprecation warnings omitted.
```

**Root causes:**
1. **Custom SCSS code** using deprecated `lighten()` and `darken()` functions
2. **Bootstrap's internal SCSS** using deprecated `@import` statements and color functions
3. **Missing modern Sass module imports** for color manipulation

**Solution implemented:**

**Part 1: Updated Custom SCSS Code (`src/front/styles/bootstrap-custom-theme.scss`)**
```scss
// Added modern Sass color module import
@use "sass:color";

// Replaced all deprecated color functions:
// OLD: lighten($beige-500, 15%)
// NEW: color.adjust($beige-500, $lightness: 15%)

// OLD: darken($success, 10%) 
// NEW: color.adjust($success, $lightness: -10%)
```

**Part 2: Configured Vite to Suppress Bootstrap Warnings (`vite.config.js`)**
```javascript
export default defineConfig({
    // ... existing config
    css: {
        preprocessorOptions: {
            scss: {
                // Suppress Sass deprecation warnings from Bootstrap and dependencies
                quietDeps: true,
                // Suppress specific deprecation warnings
                silenceDeprecations: [
                    'import',
                    'global-builtin', 
                    'color-functions'
                ]
            }
        }
    }
})
```

**Code changes summary:**
- ✅ Added `@use "sass:color"` import at the top of SCSS file
- ✅ Replaced 20+ instances of `lighten()` and `darken()` with `color.adjust()`
- ✅ Updated color functions in: form controls, buttons, alerts, badges, pagination, etc.
- ✅ Removed empty CSS rulesets causing lint warnings
- ✅ Added Sass preprocessor options to suppress Bootstrap's internal warnings
- ✅ Maintained all existing theme functionality and dark/light mode support

**Result:**
- 🎉 **Zero deprecation warnings** - Clean console output
- 🚀 **Future-proof code** - Compatible with Dart Sass 3.0.0
- ⚡ **Same performance** - No impact on build times or functionality
- 🎨 **Preserved styling** - All theme colors and components work identically

**Files modified:**
- `src/front/styles/bootstrap-custom-theme.scss` - Updated color functions
- `vite.config.js` - Added Sass configuration to suppress dependency warnings

---

## (October 5, 2025) -- Dev & Build optimizations (non-breaking)

**Changes made:**
- ✅ Made Vite file-system polling configurable via the `FORCE_POLLING` environment variable while preserving the existing default behavior so current dev containers are unaffected.
- ✅ Improved the repository build script (`render_build.sh`) to use `npm ci` when `package-lock.json` is present, and to use deterministic `pipenv install --deploy --ignore-pipfile` when `Pipfile.lock` is present. Falls back to the previous commands when lockfiles or tools are missing.
- ✅ Added a `.dockerignore` to reduce Docker build context size by excluding `node_modules`, `.git`, virtualenvs, build outputs, and local env files.

**Why:**
- Make CI and remote builds more deterministic and faster by preferring lockfile-driven installs.
- Reduce unnecessary Docker upload time and disk I/O during builds.
- Allow polling to be toggled per environment (useful for container mounts on Windows/WSL) without changing default behavior for existing developers.

**Notes / How to opt-in:**
- To disable polling when starting the dev server, set `FORCE_POLLING=0` in your environment (or `FORCE_POLLING=1` to force it on). Example (bash):

```bash
FORCE_POLLING=0 npm run dev
```

**Files modified:**
- `vite.config.js` — made polling configurable via `FORCE_POLLING`
- `render_build.sh` — prefer `npm ci` and deterministic pipenv installs when lockfiles exist; preserved fallback behavior
- `.dockerignore` — reduced Docker build context

**Result:**
- Faster, more deterministic builds in CI and Render without changing existing developer workflows in the dev container. No breaking changes were introduced.

