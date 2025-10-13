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

## Flash of unstyled content

https://en.wikipedia.org/wiki/Flash_of_unstyled_content

Bootstrap indicatons
https://getbootstrap.com/docs/5.3/customize/color-modes/#javascript


```
Here’s a look at the JavaScript that powers it. Feel free to inspect our own documentation navbar to see how it’s implemented using HTML and CSS from our own components. It is suggested to include the JavaScript at the top of your page to reduce potential screen flickering during reloading of your site. Note that if you decide to use media queries for your color modes, your JavaScript may need to be modified or removed if you prefer an implicit control.
```



---

Run `pipenv lock` to update pipfile.lock Python dependencies

---

Consider this for future projects with Flask backend:

3.  **`pkg_resources` Deprecation Warning:**
    *   **Problem:** A `UserWarning` indicated that `flask-admin`, a dependency for the admin interface, relies on `pkg_resources`. This is a legacy component of the `setuptools` library that is being deprecated and is scheduled for removal as early as November 2025. If left unaddressed, this would cause future deployments to fail.
    *   **Root Cause:** The `flask-admin` library is no longer actively maintained (last release in 2021), so it is not expected to be updated to remove this legacy dependency.
    *   **Solution (Workaround):** Pinned `setuptools = "<81"` in the `Pipfile`. This is the community-accepted workaround, which instructs the build process to use a version of `setuptools` that still includes `pkg_resources`. This is a safe, non-invasive fix that silences the warning and prevents future breakage without modifying the application's logic or the `flask-admin` library itself.
    *   **Long-Term Strategy:** For future projects, migrating to an actively maintained alternative like `Flask-AppBuilder` is recommended. For this project, the current workaround is the most stable and appropriate solution.

---

## Quickguide: Using Regex to Find Imports in Your Codebase

### Why Use Regex for Imports?
Regex (regular expressions) let you search for patterns icode, not just exact text. This is very useful for finding alimport statements, especially if you want to update or audidependencies.

---

### 1. Basic Regex for Import Statements

To find all ES6 import statements (single-line):

```
^import\s.+from\s+['"][^'"]+['"];
```

- `^import` — matches lines starting with `import`
- `\s` — matches whitespace
- `.+` — matches one or more characters (the imported items)
- `from\s+` — matches the word `from` and whitespace
- `['"][^'"]+['"]` — matches the module path in quotes
- `;` — matches the semicolon at the end

#### To match imports like `import "module";` (side-effecimports):

```
^import\s+['"][^'"]+['"];
```

#### To match both types at once:

```
^import\s.*from\s+['"][^'"]+['"]|^import\s+['"][^'"]+['"];
```

---

### 2. Find Imports of a Specific File

Replace `FILENAME` with your file name (e.g., `countriesDat.jsx`):

```
import\s.*['"][^'"]*FILENAME['"]
or
import\s.*['"][^'"]*FILENAME.FILETYPE['"]
```

---

### 3. Using Regex in VS Code

1. Press `Ctrl+Shift+F` to open global search.
2. Click the `.*` icon to enable regex mode.
3. Paste your regex pattern.
4. Replace `FILENAME` as needed.

---

### 4. Using Regex in the Terminal (grep)

```sh
grep -rE "import\\s.*['\"][^'\"]*FILENAME['\"]" .
```

---

### 5. What Does the `\` (Backslash) Mean in Regex?

- The backslash `\` is the **escape character** in regex.
- It gives special meaning to certain characters (e.g., `\dfor digit, `\w` for word character).
- It also lets you match special characters literally (e.g., `` matches a period, not any character).
- In many tools (like VS Code or grep), you need to double thbackslash (`\\`) to escape it for the search engine.

**Examples:**
- `\.` matches a literal dot (`.`)
- `\\` matches a literal backslash (`\`)
- `\d` matches any digit

---

**Tip:**
You can use these patterns to find, audit, or refactor imports across your project quickly!