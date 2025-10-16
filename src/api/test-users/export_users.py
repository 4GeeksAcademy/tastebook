
# RUN command with:
# pipenv run python /workspaces/tastebook/src/api/test-users/export_users.py

import os
import sys
import json
from datetime import datetime, date

# Ensure the repository `src` directory is on sys.path so imports work
# when this script is executed directly (for example via pipenv run python ...)
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.abspath(os.path.join(THIS_DIR, '..', '..'))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from api.models import db, User
from app import app


def convert(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

with app.app_context():
    users = User.query.all()
    data = [u.__dict__.copy() for u in users]
    for d in data:
        d.pop('_sa_instance_state', None)
    with open('users_export.json', 'w') as f:
        json.dump(data, f, indent=2, default=convert)
print("User data exported to users_export.json")

