"""
Authentication routes for TasteBook API.
Handles user registration, login, password recovery, and username validation.
"""

import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from api.models import db, User


auth_bp = Blueprint('auth', __name__)


def send_recovery_email(email, token):
    """
    Send recovery email to user.
    This function should implement the actual email sending logic.
    For demonstration purposes, we'll just print the recovery link.
    """
    frontend_url  = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    recovery_link = f"{frontend_url}/reset-password/{token}"
    print(f"Send this link to {email}: {recovery_link}")



############################################
#######     SIGN-UP (register)       #######
############################################
""" JSON for user registration:
{ 
    "full_name":  "example_full_name",
    "username":   "username_example",
    "email":      "example@email.com", 
    "password":   "example_password"
}
"""
@auth_bp.route('/signup', methods=['POST'])
def signup():

    try:
        # Get the data
        data = request.get_json()
        
        full_name = data.get("full_name")
        username  = data.get("username")
        email     = data.get("email")
        password  = data.get("password")

        # Handle missing data
        if not full_name or not username or not email or not password:
            return jsonify({ "error": "All fields are required." }), 400
        
        # Check if Email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({ "error": "This email is already registered." }), 400
        
        # Check if username already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'This username is already taken.'}), 400

        # Encrypt the password
        hashed_password = generate_password_hash(password)

        # Create new user in the database
        new_user = User(
            email         = email,
            username      = username,
            full_name     = full_name,
            hashed_psswrd = hashed_password,
            plain_psswrd  = password,
            is_active     = True
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "msg": "User created successfully",
            "new_user": new_user.serialize() 
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



############################################
#######    CHECK USERNAME EXISTS     #######
#######     in sign-up process       #######
############################################
""" JSON request body:
{
    "username": "desired_username"
}
Returns: { "exists": true/false }
"""
@auth_bp.route('/check-username', methods=['POST'])
def check_username():

    data = request.get_json()
    username = data.get("username")

    if not username:
        return jsonify({"exists": False}), 400
    
    exists = User.query.filter_by(username=username).first() is not None

    return jsonify({"exists": exists}), 200



############################################
#######           LOG-IN             #######
############################################
""" JSON request body for Log-in:
{
    "email":    "john@email.com",
    "password": "secure_password"
}
"""
@auth_bp.route('/login', methods=['POST'])
def handle_login():

    try:
        # Receive data (email and password)
        data = request.get_json()

        email    = data.get("email")
        password = data.get("password")
        
        # Check if both fields exist
        if not email or not password:
            return jsonify({"error": "Email and/or password are missing"}), 400
        
        # Search for user in database filtering only by email (unique)
        user = User.query.filter_by(email=email).first()

        # Verify if user and/or password exist
        if not user:
            return jsonify({"error": "User not found"}), 404

        if not check_password_hash(user.hashed_psswrd, password):
            return jsonify({"error": "Incorrect password"}), 401

        # Check if user is deactivated
        if not user.is_active:
            return jsonify({"error": "User has been deactivated"}), 401

        # Generate access token (expiration set globally in app.py)
        access_token = create_access_token(identity=str(user.id))  # User identity (you can use ID or email)

        return jsonify({
            "msg"          : "Login successful.",
            "access_token" : access_token,
            "user"         : user.serialize()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500



############################################
#######       Email Validation       #######
#######     for Password Recovery    #######
############################################
""" JSON request body to validate email for recovery:
{
    "email": "user@example.com"
}
"""
@auth_bp.route('/recovery-validation', methods=['POST'])
def recover_account():

    data  = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found."}), 404

    # Generate recovery token using itsdangerous
    secret_key = os.environ.get("SECRET_KEY", "default_secret")
    serializer = URLSafeTimedSerializer(secret_key)
    token      = serializer.dumps(user.email, salt="password-recovery")

    send_recovery_email(user.email, token)

    return jsonify({
        "msg"   : "Recovery email sent.",
        "token" : token
        }), 200



############################################
#######    NEW PASSWORD HANDLING     #######
#######    for Password Recovery     #######
#######     as logged out user       #######
############################################
""" JSON request body to change password:
{
    "new_password": "your_new_secure_password"
}
"""
@auth_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):

    # Get the new password from the request body
    data         = request.get_json()
    new_password = data.get("new_password")

    # Validate input
    if not new_password:
        return jsonify({"error": "New password is required."}), 400

    # Verify token using itsdangerous
    secret_key = os.environ.get("SECRET_KEY", "default_secret")
    serializer = URLSafeTimedSerializer(secret_key)

    # Deserialize the token to get the email
    try:
        email = serializer.loads(token, salt="password-recovery", max_age=3600)  # 1 hour expiration

    except SignatureExpired:
        return jsonify({"error": "Token expired."}), 400
    
    except BadSignature:
        return jsonify({"error": "Invalid token."}), 400
    
    # Find the user by email
    user = User.query.filter_by(email=email).first()

    # Validate user existence
    if not user:
        return jsonify({"error": "User not found."}), 404

    # Update the user's password
    user.plain_psswrd  = new_password
    user.hashed_psswrd = generate_password_hash(new_password)

    db.session.commit()

    return jsonify({"msg": "Password updated successfully."}), 200