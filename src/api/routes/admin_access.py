
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from api.models import db, User

admin_access_bp = Blueprint('admin_access', __name__)


#########################################
#######     Flask Admin Check     #######
#######       and Creation        #######
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
		password  = '9xJ*JSp#i$^W%5YTsyebFO'
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
#######     Flask Admin Check     #######
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

