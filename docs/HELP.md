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
