"""Admin helper script for Tastebook.

Provides a tiny CLI to list users and toggle the is_admin flag.

Usage (from project root):
  python src/scripts.py list
  python src/scripts.py set-admin <username_or_id> true

This script ensures the project root is on PYTHONPATH so it can be run
directly (python src/scripts.py) or as a module (python -m src.scripts).
"""

import os
import sys
import argparse

# Ensure project root is on sys.path so `from src...` imports work when run directly
THIS_FILE = os.path.abspath(__file__)
PROJECT_ROOT = os.path.dirname(os.path.dirname(THIS_FILE))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

def list_users():
    from src.app import app
    from src.api.models import User

    with app.app_context():
        users = User.query.all()
        if not users:
            print("No users found")
            return
        for u in users:
            # Use __repr__ and also show is_admin explicitly for clarity
            print(repr(u))
            print("  is_admin:", u.is_admin)

def set_admin(identifier: str, is_admin: bool):
    """Set is_admin for a user. identifier can be numeric id or username."""
    from src.app import app
    from src.api.models import db, User

    with app.app_context():
        user = None
        # try by id first
        if identifier.isdigit():
            user = User.query.get(int(identifier))
        if user is None:
            user = User.query.filter_by(username=identifier).first()

        if not user:
            print(f"User '{identifier}' not found")
            return

        print("Before:", user.id, user.username, "is_admin=", user.is_admin)
        user.is_admin = bool(is_admin)
        db.session.commit()
        print("After:", user.id, user.username, "is_admin=", user.is_admin)


def parse_bool(s: str) -> bool:
    return s.lower() in ("1", "true", "yes", "y", "on")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Tastebook admin helper")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list", help="List all users")

    set_admin_p = sub.add_parser("set-admin", help="Set is_admin for a user by username or id")
    set_admin_p.add_argument("identifier", help="Username or numeric id of the user")
    set_admin_p.add_argument("is_admin", help="true/false (or 1/0)")

    args = parser.parse_args(argv)

    if args.command == "list":
        list_users()
    elif args.command == "set-admin":
        val = parse_bool(args.is_admin)
        set_admin(args.identifier, val)


if __name__ == "__main__":
    main()




# import sys
# import argparse
# from src.app import app
# from src.api.models import db, User

# def list_users():
#     users = User.query.all()
#     for user in users:
#         print(user)

# def set_admin(username, is_admin):
#     user = User.query.filter_by(username=username).first()
#     if not user:
#         print(f"User '{username}' not found.")
#         return
#     user.is_admin = is_admin
#     db.session.commit()
#     print(f"User '{username}' is_admin set to {is_admin}.")

# if __name__ == "__main__":
#     parser = argparse.ArgumentParser(description="Admin utility script for Tastebook.")
#     subparsers = parser.add_subparsers(dest="command")

#     # List users
#     subparsers.add_parser("list", help="List all users.")

#     # Set admin
#     admin_parser = subparsers.add_parser("set-admin", help="Set is_admin for a user.")
#     admin_parser.add_argument("username", type=str, help="Username of the user.")
#     admin_parser.add_argument("is_admin", type=str, help="Set to true or false.")

#     args = parser.parse_args()

#     with app.app_context():
#         if args.command == "list":
#             list_users()
#         elif args.command == "set-admin":
#             is_admin = args.is_admin.lower() in ("1", "true", "yes", "y")
#             set_admin(args.username, is_admin)
#         else:
#             parser.print_help()