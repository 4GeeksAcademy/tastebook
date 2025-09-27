#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build

# "pip install pipenv &&" fue añadido porque Render NO reconocía el comando "pipenv",
# supongo que fue por alguna actualización del entorno de Render.
pip install pipenv && pipenv install

pipenv run upgrade
