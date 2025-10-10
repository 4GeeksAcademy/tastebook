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

# Upgrade pip to latest version for better package management and security
echo "Upgrading pip to latest version..."
pip install --upgrade pip

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

# Run DB upgrade if provided by Pipfile scripts and if Flask app with migrations exists
# Only run this for services that have database functionality (main API, not WebSocket)
if command -v $PIPENV_CMD >/dev/null 2>&1; then
	# Check if this is the main API service by looking for Flask-Migrate
	if $PIPENV_CMD run python -c "import flask_migrate" 2>/dev/null; then
		echo "Flask-Migrate detected, running database upgrade..."
		$PIPENV_CMD run upgrade || true
	else
		echo "No Flask-Migrate found, skipping database upgrade (likely WebSocket service)"
	fi
fi
