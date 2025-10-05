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

## Changelog

### Bootstrap Migration to SCSS (October 5, 2025)

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
