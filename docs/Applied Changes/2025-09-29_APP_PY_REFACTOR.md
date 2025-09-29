# 2025-09-29 — Small refactor to `src/app.py`

This file documents a small, low-risk refactor applied to `src/app.py`.

Summary of changes

- Added basic logging and startup log message.
- Made JWT secret handling explicit:
  - In *production* the app will raise an error if `JWT_SECRET_KEY` is missing (fail-fast).
  - In *development* a fallback insecure secret is used and a warning is logged.
- Moved `db.init_app(app)` before creating the `Migrate` object so the migration extension is initialized after the database extension.
- Replaced manual `os.path` manipulations for the static frontend `dist/` path with `pathlib.Path` for clarity.
- Removed unused imports and cleaned up the file header and comments.

Why this change

- Fail-fast behavior for missing secrets reduces the chance of accidentally deploying an app with an insecure JWT secret.
- Ensuring `db` is initialized before `Migrate` avoids subtle initialization ordering issues.
- Logging helps during development and early startup troubleshooting.
- Minor readability and maintainability improvements.

Notes and follow-ups

- The linter/editor may report missing flask-related imports if the Python environment for the editor/analysis doesn't have the project's dependencies installed.
- Consider adding a short unit test to import the Flask app and verify the app object is created.
- Consider switching to an application-factory pattern for easier testing and multiple configurations in the future.

Files touched

- `src/app.py` — refactor applied

Author

- Automated change recorded on 2025-09-29

