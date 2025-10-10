#!/usr/bin/env bash
# Build script for the WebSocket service
# exit on error
set -o errexit

echo "🔧 Building WebSocket Service..."

# WebSocket service doesn't need frontend build, but we need Python dependencies

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

# WebSocket service does NOT need database migrations
echo "⚡ WebSocket service build completed - no database operations needed!"