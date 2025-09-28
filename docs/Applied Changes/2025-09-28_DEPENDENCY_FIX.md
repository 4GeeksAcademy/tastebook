# Dependency fix: Vite / @vitejs/plugin-react peer dependency

Date: 2025-09-28

## Problem
While running `npm install` the project failed with an ERESOLVE peer dependency error. The error reported that `@vitejs/plugin-react@4.3.4` requires a peer of `vite@^4.2.0 || ^5.0.0 || ^6.0.0`, but the project uses `vite@7.1.7`.

This produced an install failure similar to:

```
npm ERR! While resolving: @vitejs/plugin-react@4.3.4
npm ERR! Found: vite@7.1.7
npm ERR! Could not resolve dependency:
npm ERR! peer vite@"^4.2.0 || ^5.0.0 || ^6.0.0" from @vitejs/plugin-react@4.3.4
```

## Changes made
- Updated `package.json` devDependency:
  - `@vitejs/plugin-react` changed from `^4.0.4` to `^5.0.0` (compatible with Vite 7).
- Fixed accidental typo introduced during edits:
  - Restored `@types/react` and `@types/react-dom` names (they must include the `@` scope and slash).

Files edited:

- `package.json` — bumped `@vitejs/plugin-react` and corrected `@types` entries.

## Commands run
- `npm install` — run after the edits.
  - First run failed due to an accidental package name typo; I corrected it and re-ran.
  - Second run completed successfully: packages updated/added/removed and no vulnerabilities found.

## Verification
- `npm install` completed successfully (added 8 packages, removed 6, changed 20).
- No ERESOLVE error remained after updating to `@vitejs/plugin-react@^5.0.0`.

## Notes and next steps
- If you want reproducible builds, consider committing `package-lock.json` after these changes.
- Optionally run the dev server to smoke-test the frontend:

```bash
npm run dev
```

- Optionally pin plugin and vite to specific patch versions rather than caret ranges.

If you want, I can open a PR with these changes and run the dev server to confirm the app starts cleanly.
