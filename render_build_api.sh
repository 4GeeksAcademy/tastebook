#!/usr/bin/env bash
# Build script for the REST API service
# exit on error
set -o errexit

echo "🔧 Building REST API Service..."

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

# Run DB upgrade for API service (this service handles the database)
if command -v $PIPENV_CMD >/dev/null 2>&1; then
	# Check if Flask-Migrate is available
	if $PIPENV_CMD run python -c "import flask_migrate" 2>/dev/null; then
		echo "Flask-Migrate detected, running database upgrade for API service..."
		export FLASK_APP=src/app.py
		$PIPENV_CMD run upgrade || true
	else
		echo "No Flask-Migrate found, skipping database upgrade"
	fi
fi

echo "✅ REST API build completed successfully!"