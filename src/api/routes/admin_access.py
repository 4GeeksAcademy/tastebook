from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, User
import os
import json

# Optional: load environment variables from a .env file when available (no-op if python-dotenv
# isn't installed). This keeps production deployments unaffected while allowing local dev to
# set ADMIN_PASSWORD in a .env file.
try:
	from dotenv import load_dotenv
	# load .env from project root if present
	load_dotenv()
except Exception:
	pass

admin_access_bp = Blueprint('admin_access', __name__)


#########################################
#######        Flask Admin        #######
#######    admin-user Creation    #######
#########################################
@admin_access_bp.route('/create-admin', methods=['POST'])
def create_admin():
	"""
    Checks if any admin users exist, if not, creates one.
	"""
	try:
		# Look for existing admin users
		admins = User.query.filter_by(is_admin=True).all()

		if admins:
			# Return found admin(s) without password
			return jsonify({
				"msg": "Admin user/s already  exist",
				"admins": [ {"id": a.id, "email": a.email, "username": a.username} for a in admins ]
			}), 200

		# No admin found -> create one from request body
		# data      = request.get_json() or {} # --> there is no request body
		email     = 'admin_user@flask.backpanel.com'
		username  = 'admin-user'
		# Read admin password from environment variable ADMIN_PASSWORD, fallback to
		# a default value if not set. Deployments should set ADMIN_PASSWORD securely.
		password  = os.environ.get('ADMIN_PASSWORD', 'Tastebook123!')
		full_name = 'Admin User'

		if not email or not username or not password:
			return jsonify({"msg": "Missing required fields: email, username and password are required to create an admin."}), 400

		# Ensure email/username not already taken
		existing = User.query.filter((User.email == email) | (User.username == username)).first()
		if existing:
			return jsonify({"msg": "User with that email or username already exists.", "email": existing.email, "username": existing.username}), 400

		# Create user with properly hashed password
		hashed_password = generate_password_hash(password)
		
		new_admin = User(
			email         = email,
			username      = username,
			full_name     = full_name,
			plain_psswrd  = password,
			hashed_psswrd = hashed_password,
			is_admin      = True,
			is_active     = True
		)

		db.session.add(new_admin)
		db.session.commit()

		return jsonify({
			"msg": "Admin user created",
			"admin": {"id": new_admin.id, "email": new_admin.email, "username": new_admin.username}
		}), 201

	except Exception as e:
		db.session.rollback()
		return jsonify({"msg": "Error creating admin", "error": str(e)}), 500


#########################################
#######        Flask Admin        #######
#######     admin-user Check      #######
#########################################
@admin_access_bp.route('/check-admin', methods=['GET'])
def check_admin():
	"""
	Checks if any admin users exists in the DB.
	"""
	try:
		admins = User.query.filter_by(is_admin=True).all()
		if not admins:
			return jsonify({"msg": "No admin users found"}), 200

		return jsonify({
			"msg": "Admin users found",
			"admins": [ {"id": a.id, "email": a.email, "username": a.username} for a in admins ]
		}), 200

	except Exception as e:
		return jsonify({"msg": "Error checking admin users", "error": str(e)}), 500



#########################################
#######          Showcase         #######
#######         Tests users       #######
#######          CREATION         #######
#########################################

@admin_access_bp.route('/populate-test-users', methods=['POST'])
@jwt_required()
def populate_test_users():
    """
    Populates the database with test users from showcase_test_users.json.
    Only accessible to admin users.
    """
    try:
        # Check if current user is admin
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user or not current_user.is_admin:
            return jsonify({"msg": "Admin access required"}), 403

        # Load the JSON data
        import os
        file_path = os.path.join(os.path.dirname(__file__), '..', 'test-users', 'showcase_test_users.json')
        with open(file_path, 'r') as f:
            test_users = json.load(f)

        created_users = []
        skipped_users = []

        for user_data in test_users:
            # Check if user already exists
            existing = User.query.filter(
                (User.email == user_data['email']) | (User.username == user_data['username'])
            ).first()
            if existing:
                skipped_users.append({
                    "username": user_data['username'],
                    "email": user_data['email'],
                    "reason": "User already exists"
                })
                continue

            # Hash the password
            hashed_password = generate_password_hash(user_data['plain_psswrd'])

            # Create new user
            new_user = User(
                email=user_data['email'],
                username=user_data['username'],
                full_name=user_data['full_name'],
                description=user_data.get('description'),
                is_active=user_data['is_active'],
                country=user_data['country'],
                is_admin=user_data['is_admin'],
                plain_psswrd=user_data['plain_psswrd'],
                hashed_psswrd=hashed_password,
                cloudinary_url=user_data.get('cloudinary_url'),
                cloudinary_img_id=user_data.get('cloudinary_img_id')
            )

            db.session.add(new_user)
            created_users.append({
                "id": new_user.id,  # Will be set after commit
                "username": new_user.username,
                "email": new_user.email
            })

        db.session.commit()

        # Update created_users with actual IDs
        for user in created_users:
            db_user = User.query.filter_by(username=user['username']).first()
            if db_user:
                user['id'] = db_user.id

        return jsonify({
            "msg": f"Created {len(created_users)} test users, skipped {len(skipped_users)}",
            "created_users": created_users,
            "skipped_users": skipped_users
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error in populate_test_users: {str(e)}")  # For debugging
        return jsonify({"msg": "Error populating test users", "error": str(e)}), 500