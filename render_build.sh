#!/usr/bin/env bash
# exit on error
set -o errexit

# Use npm ci for reproducible installs when a lockfile is present. Fall back to
# npm install otherwise. This is safe for local dev but will speed up CI and
# production builds when a package-lock.json is available.
if [ -f package-lock.json ]; then
	echo "Using npm ci because package-lock.json was found"
	npm ci
else
	echo "No package-lock.json found, falling back to npm install"
	npm install
fi

npm run build



# "pip install pipenv &&" was added because Render did NOT recognize the "pipenv" command,
# I suppose it was due to some update in the Render environment.

# pip install pipenv && pipenv install

# pipenv run upgrade


# For Python dependencies prefer deterministic installs. If Pipfile.lock exists
# use pipenv in deploy mode to skip re-resolution. If pipenv is not available,
# attempt to install it first. If no Pipfile.lock exists, fall back to pipenv
# install (legacy behavior).
if command -v pipenv >/dev/null 2>&1; then
	PIPENV_CMD="pipenv"
else
	echo "pipenv not found, installing pipenv globally"
	pip install pipenv
	PIPENV_CMD="pipenv"
fi

if [ -f Pipfile.lock ]; then
	echo "Using pipenv --deploy --ignore-pipfile (Pipfile.lock present)"
	$PIPENV_CMD install --deploy --ignore-pipfile
else
	echo "No Pipfile.lock found, running pipenv install"
	$PIPENV_CMD install
fi

# Run DB upgrade if provided by Pipfile scripts (keeps previous behavior)
if command -v $PIPENV_CMD >/dev/null 2>&1; then
	$PIPENV_CMD run upgrade || true
fi
