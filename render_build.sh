#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build

# "pip install pipenv &&" was added because Render did NOT recognize the "pipenv" command,
# I suppose it was due to some update in the Render environment.
pip install pipenv && pipenv install

pipenv run upgrade
