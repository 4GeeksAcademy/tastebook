"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Recipe
from api.utils import generate_sitemap, APIException
from flask_cors import CORS

import datetime
from decimal import Decimal

from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash


# Register the blueprint
api = Blueprint('api', __name__)
# app.register_blueprint(api, url_prefix='/api')  ---> THIS IS IN "app.py"


##################################################
### CORS implementation
CORS(api) # Allow CORS requests to this API
##################################################

# Configure JWT ??? ---> this is configured in "app.py"

#############################################
## Example endpoint
@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "msg": "Hello! I'm a message from the backend. Check the network tab in Google Inspector and you'll see the GET request"
    }

    return jsonify(response_body), 200
#############################################




#########################################################################################
#########################################################################################
#############                        TasteBook                              #############
#############                         REST API                              #############
#############                        Endpoints                              #############
#########################################################################################
#########################################################################################




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
@api.route('/signup', methods=['POST'])
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
#######           LOG-IN             #######
############################################
""" JSON request body for Log-in:
{
    "email":    "john@email.com",
    "password": "secure_password"
}
"""
@api.route('/login', methods=['POST'])
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


        # Generate access token (with expiration)
        access_token = create_access_token(
            identity=str(user.id),  # User identity (you can use ID or email)
            expires_delta=datetime.timedelta(hours=24)  # Token expiration
        )

        return jsonify({
            "msg": "Login successful.",
            "access_token": access_token,
            "user": user.serialize()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    