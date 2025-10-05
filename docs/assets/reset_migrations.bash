#!/bin/bash

# TasteBook Database Reset Script
# This script resets the database and migrations for fresh development setup

echo "🗑️  Removing existing migrations..."
rm -R -f ./migrations

echo "🔧 Initializing Flask-Migrate..."
pipenv run init

echo "🗃️  Dropping existing database (if exists)..."
dropdb -h localhost -U postgres tastebook || true

echo "🆕 Creating fresh database..."
createdb -h localhost -U postgres tastebook || true

echo "🔌 Installing unaccent extension..."
psql -h localhost tastebook -U postgres -c 'CREATE EXTENSION IF NOT EXISTS unaccent;' || true

echo "📝 Generating new migration..."
pipenv run migrate

echo "⬆️  Applying migration to database..."
pipenv run upgrade

echo "✅ Database reset complete! Ready for development."
