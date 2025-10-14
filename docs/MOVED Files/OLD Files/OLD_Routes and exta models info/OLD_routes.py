"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Recipe, RecipeImage, Follow, RecipeComment, CommentLike, RecipeLike, Collection, CollectionRecipe, Chat, Message
from api.utils import generate_sitemap, APIException

from api.websocket_events import emit_new_message, emit_messages_read, emit_chat_deleted

from flask_cors import CORS
from sqlalchemy import or_

import cloudinary
import cloudinary.uploader
import cloudinary.api


from datetime import datetime, date, timedelta
from decimal import Decimal

# JWT for authentication and werkzeug security for password hashing
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired


# Register the blueprint
api = Blueprint('api', __name__)
# app.register_blueprint(api, url_prefix='/api')  ---> THIS IS IN "app.py"


##################################################
### CORS implementation

CORS(api) # Allow CORS requests to this API


# Allow CORS requests from frontend domains

# frontend_origins = [
#     'https://turbo-giggle-wrxvxpjqvv7r3g49g-3000.app.github.dev',
#     'http://localhost:3000',
#     'https://localhost:3000'
# ]
# CORS(api, origins=frontend_origins, 
#      methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
#      allow_headers=['Content-Type', 'Authorization'])
##################################################

# Configure JWT ??? ---> this is configured in "app.py"


##################################################
##################################################
# Cloudinary configuration
cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key    = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET'),
    secure     = True
)
##################################################
##################################################

#############################################
## Example endpoint
@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "msg": "Hello! I'm a message from the backend. Check the network tab in Google Inspector and you'll see the GET request"
    }

    return jsonify(response_body), 200
#############################################

####################################################################################

############################################
#######     PRIVATE SITE TESTING     #######
############################################
""" How to add Access_Token in header in Postman:
    - Go to "Authorization" tab
    - Choose "Bearer Token" in dropdown
    - Paste token WITHOUT QUOTES
"""
@api.route('/testing-private', methods=['GET'])
@jwt_required()
def private_route():

    current_user_id = get_jwt_identity()

    user = User.query.get(current_user_id)

    if not user:
        return jsonify({ "msg": "User not found." }), 404
    
    return jsonify({
        "msg": f"Welcome {user.email}!",
        "user": user.serialize()
    }), 200

####################################################################################



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
#######   CHECK USERNAME EXISTS      #######
############################################
""" JSON request body:
{
    "username": "desired_username"
}
Returns: { "exists": true/false }
"""
@api.route('/check-username', methods=['POST'])
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


        # Generate access token (expiration set globally in app.py)
        access_token = create_access_token(identity=str(user.id))  # User identity (you can use ID or email)


        return jsonify({
            "msg": "Login successful.",
            "access_token": access_token,
            "user": user.serialize()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    





############################################
#######             USER             #######
#######        Private Profile       #######
#######        [GET] user data       #######
############################################
@api.route('/settings', methods=['GET'])
@jwt_required()
def get_user_private_profile():
    
    try:

        # Get authenticated user ID
        current_user_id = get_jwt_identity()

        # Search for user in database
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({"msg": "User not found"}), 404


        # Included additional information for private user profile
        profile_data = current_user.serialize()

        profile_data.update({
            'recipes_count': len(current_user.recipes),
            'recipes':       [recipe.serialize() for recipe in current_user.recipes]
        })
        
        
        # return jsonify(current_user=profile_data), 200
    
        return jsonify({
            "message":      "User data found successfully",
            "current_user":  profile_data
        }), 200


    except Exception as e:
        return jsonify({"msg": "Error fetching profile", "error": str(e)}), 500
    


############################################
#######             USER             #######
#######        Private Profile       #######
#######            Settings          #######
#######       MODIFY user data       #######
############################################
""" JSON request body to update profile:
{
    "full_name":   "New Full Name",       // optional
    "username":    "new_username",        // optional
    "email":       "new@email.com",       // optional

    "current_password": "old_password",   // optional
    "password":         "new_password"    // optional
}
"""

@api.route('/settings', methods=['PUT'])
@jwt_required()
def update_user_private_profile():


    # Get authenticated user ID from token
    user_id = get_jwt_identity()

    # Search for user in database
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    

    # Get request data
    data = request.get_json()


    try:  

        if "full_name" in data:
            user.full_name = data["full_name"]
        
        if "username" in data:
            # Check that username is not in use
            existing_user = User.query.filter(User.username == data["username"], User.id != user.id).first()
            if existing_user:
                return jsonify({"msg": "This username is already taken."}), 400
            user.username = data["username"]
        
        if "email" in data:
            # Check that email is not in use
            existing_user = User.query.filter(User.email == data["email"], User.id != user.id).first()
            if existing_user:
                return jsonify({"msg": "This email is already registered."}), 400
            user.email = data["email"]
        
        if "country" in data:
            user.country = data["country"]

        # Password change handling
        if 'password' in data:
            if 'current_password' not in data:
                return jsonify({'error': 'Current password is needed to change to new password.'}), 400
            
            if not check_password_hash(user.hashed_psswrd, data['current_password']):
                return jsonify({'error': 'Current password is incorrect.'}), 400
            
            user.hashed_psswrd = generate_password_hash(data['password'])
        
        
        # Save changes to database
        db.session.commit()


        return jsonify({
            'msg':   'Profile updated successfully.',
            'user':  user.serialize()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating profile.", 'error': str(e)}), 500


############################################
#######   UPDATE USER DESCRIPTION    #######
############################################
""" JSON request body to update user description:
{
    "description": "Your new description text here"
}
"""
@api.route('/user/description', methods=['PUT'])
@jwt_required()
def update_user_description():
    """
    Update the description for the authenticated user.
    """
    try:
        # Get authenticated user ID from token
        user_id = get_jwt_identity()
        
        # Find user in database
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get request data
        data = request.get_json()
        if not data or 'description' not in data:
            return jsonify({"error": "Description field is required"}), 400
        
        # Update description (can be empty string to clear it)
        new_description = data['description'].strip() if data['description'] else None

        # Validate description length
        if new_description and len(new_description) > 500:
            return jsonify({"error": "Description must not exceed 500 characters."}), 400

        user.description = new_description
        
        # Save to database
        db.session.commit()
        
        return jsonify({
            "msg": "Description updated successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "description": user.description
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error updating description", "details": str(e)}), 500


    
######################################################################################################


############################################
#######        GET ALL USERS         #######
############################################
@api.route('/users', methods=['GET'])
def get_all_users():
    """
    Get all users with basic information and recipe counts.
    Supports pagination with limit and offset parameters.
    Supports search by username and sorting by recipe count.
    """
    try:
        # Get pagination parameters
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Get search parameters
        search = request.args.get('search', '', type=str).strip()
        country = request.args.get('country', '', type=str).strip()
        region = request.args.get('region', '', type=str).strip()
        sort_by = request.args.get('sort_by', 'created_at', type=str)  # created_at, recipes_count, followers_count, username
        sort_order = request.args.get('sort_order', 'desc', type=str)  # asc, desc
        
        # Ensure reasonable limits
        limit = min(limit, 100)  # Max 100 users per request
        
        # Start with base query for active users only
        query = User.query.filter(User.is_active == True)
        
        # Apply search filter if provided
        if search:
            query = query.filter(User.username.ilike(f'%{search}%'))
        
        # Apply country filter if provided
        if country:
            query = query.filter(User.country == country)
            
        # Apply region filter if provided (requires importing the regions mapping)
        if region:
            # Define region to countries mapping (simplified version for backend)
            region_countries = {
                'north_america': ['US', 'CA', 'MX', 'GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA'],
                'south_america': ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'],
                'europe': ['AD', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'MC', 'NL', 'NO', 'PL', 'PT', 'RO', 'SM', 'SK', 'SI', 'ES', 'SE', 'CH', 'GB', 'VA'],
                'asia': ['AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'GE', 'IN', 'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KW', 'KG', 'LA', 'LB', 'MY', 'MV', 'MN', 'MM', 'NP', 'KP', 'OM', 'PK', 'PS', 'PH', 'QA', 'SA', 'SG', 'KR', 'LK', 'SY', 'TW', 'TJ', 'TH', 'TL', 'TR', 'TM', 'AE', 'UZ', 'VN', 'YE'],
                'africa': ['DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'CI', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'],
                'oceania': ['AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'WS', 'SB', 'TO', 'TV', 'VU']
            }
            
            if region in region_countries:
                query = query.filter(User.country.in_(region_countries[region]))
        
        # Apply sorting
        if sort_by == 'recipes_count':
            # Count recipes for each user and sort by count
            query = query.outerjoin(Recipe).group_by(User.id)
            if sort_order == 'desc':
                query = query.order_by(db.func.count(Recipe.id).desc())
            else:
                query = query.order_by(db.func.count(Recipe.id).asc())
        elif sort_by == 'followers_count':
            # Count followers for each user and sort by count
            query = query.outerjoin(Follow, User.id == Follow.followed_id).group_by(User.id)
            if sort_order == 'desc':
                query = query.order_by(db.func.count(Follow.id).desc())
            else:
                query = query.order_by(db.func.count(Follow.id).asc())
        elif sort_by == 'username':
            if sort_order == 'desc':
                query = query.order_by(User.username.desc())
            else:
                query = query.order_by(User.username.asc())
        else:  # default to created_at
            if sort_order == 'desc':
                query = query.order_by(User.created_at.desc())
            else:
                query = query.order_by(User.created_at.asc())
        
        # Get total count for pagination (before applying limit/offset)
        total_count = query.count()
        
        # Apply pagination
        users = query.offset(offset).limit(limit).all()
        
        users_data = []
        for user in users:
            user_data = {
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'country': user.country,
                'cloudinary_url': user.cloudinary_url,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'recipes_count': len(user.recipes),
                'followers_count': len(user.follower_relationships),
                'following_count': len(user.following_relationships)
            }
            users_data.append(user_data)
        
        return jsonify({
            "msg": "Users retrieved successfully",
            "users": users_data,
            "pagination": {
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count
            },
            "filters": {
                "search": search,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Error fetching users", "details": str(e)}), 500


############################################
#######      USER PUBLIC PROFILE    #######
############################################
@api.route('/user/<string:username>', methods=['GET'])
def get_user_public_profile(username):
    """
    Get public profile information for a specific user by username.
    Returns user details, stats, and their recipes.
    """
    try:
        # Find user by username
        user = User.query.filter_by(username=username, is_active=True).first()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get user's recipes with pagination
        limit = request.args.get('limit', 12, type=int)
        offset = request.args.get('offset', 0, type=int)
        limit = min(limit, 50)  # Max 50 recipes per request
        
        # Get recipes ordered by creation date (newest first)
        recipes_query = Recipe.query.filter_by(author_id=user.id).order_by(Recipe.created_at.desc())
        total_recipes = recipes_query.count()
        recipes = recipes_query.offset(offset).limit(limit).all()
        
        # Serialize recipes with their primary images
        recipes_data = []
        for recipe in recipes:
            recipe_data = recipe.serialize()
            
            # Add primary image
            primary_image = RecipeImage.query.filter_by(
                recipe_id=recipe.id, 
                is_primary=True
            ).first()
            
            if not primary_image:
                # If no primary image, get the first image
                primary_image = RecipeImage.query.filter_by(
                    recipe_id=recipe.id
                ).order_by(RecipeImage.display_order).first()
            
            recipe_data['primary_image'] = primary_image.serialize() if primary_image else None
            recipes_data.append(recipe_data)
        
        # Build user profile data
        profile_data = {
            'user_id': user.id,  # Changed from 'id' to 'user_id' for consistency
            'username': user.username,
            'full_name': user.full_name,
            'description': user.description,
            'country': user.country,
            'cloudinary_url': user.cloudinary_url,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'stats': {
                'recipes_count': total_recipes,
                'followers_count': len(user.follower_relationships),
                'following_count': len(user.following_relationships),
                'total_likes': 0,      # TODO: Implement when like system is added
            },
            'recipes': recipes_data,
            'pagination': {
                'total': total_recipes,
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < total_recipes
            }
        }
        
        return jsonify({
            "msg": "User profile retrieved successfully",
            "user": profile_data
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Error fetching user profile", "details": str(e)}), 500


######################################################################################################


############################################
#######         FOLLOW USER          #######
############################################
@api.route('/follow/<int:user_id>', methods=['POST'])
@jwt_required()
def follow_user(user_id):
    """
    Follow a user. Creates a new follow relationship.
    """
    try:
        # Get current user ID from token
        current_user_id = get_jwt_identity()
        
        # Prevent users from following themselves
        if current_user_id == user_id:
            return jsonify({"error": "You cannot follow yourself"}), 400
        
        # Check if target user exists
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({"error": "User not found"}), 404
        
        # Check if already following
        existing_follow = Follow.query.filter_by(
            follower_id=current_user_id,
            followed_id=user_id
        ).first()
        
        if existing_follow:
            return jsonify({"error": "You are already following this user"}), 400
        
        # Create new follow relationship
        new_follow = Follow(
            follower_id=current_user_id,
            followed_id=user_id
        )
        
        db.session.add(new_follow)
        db.session.commit()
        
        # Get updated counts
        followers_count = Follow.query.filter_by(followed_id=user_id).count()
        following_count = Follow.query.filter_by(follower_id=current_user_id).count()
        
        return jsonify({
            "msg": f"You are now following {target_user.username}",
            "follow_id": new_follow.id,
            "followers_count": followers_count,
            "following_count": following_count,
            "is_following": True
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error following user", "details": str(e)}), 500


############################################
#######       UNFOLLOW USER          #######
############################################
@api.route('/follow/<int:user_id>', methods=['DELETE'])
@jwt_required()
def unfollow_user(user_id):
    """
    Unfollow a user. Removes the follow relationship.
    """
    try:
        # Get current user ID from token
        current_user_id = get_jwt_identity()
        
        # Check if target user exists
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({"error": "User not found"}), 404
        
        # Find the follow relationship
        follow_relationship = Follow.query.filter_by(
            follower_id=current_user_id,
            followed_id=user_id
        ).first()
        
        if not follow_relationship:
            return jsonify({"error": "You are not following this user"}), 400
        
        # Remove the follow relationship
        db.session.delete(follow_relationship)
        db.session.commit()
        
        # Get updated counts
        followers_count = Follow.query.filter_by(followed_id=user_id).count()
        following_count = Follow.query.filter_by(follower_id=current_user_id).count()
        
        return jsonify({
            "msg": f"You have unfollowed {target_user.username}",
            "followers_count": followers_count,
            "following_count": following_count,
            "is_following": False
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error unfollowing user", "details": str(e)}), 500


############################################
#######      CHECK FOLLOW STATUS     #######
############################################
@api.route('/follow/status/<int:user_id>', methods=['GET'])
@jwt_required()
def get_follow_status(user_id):
    """
    Check if the current user is following a specific user.
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Check if target user exists
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({"error": "User not found"}), 404
        
        # Check follow status
        is_following = Follow.query.filter_by(
            follower_id=current_user_id,
            followed_id=user_id
        ).first() is not None
        
        # Get follow counts
        followers_count = Follow.query.filter_by(followed_id=user_id).count()
        following_count = Follow.query.filter_by(follower_id=user_id).count()
        
        return jsonify({
            "is_following": is_following,
            "followers_count": followers_count,
            "following_count": following_count,
            "target_user": {
                "user_id": target_user.id,
                "username": target_user.username,
                "full_name": target_user.full_name
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Error checking follow status", "details": str(e)}), 500


######################################################################################################


############################################
#######       CREATE NEW RECIPE      #######
############################################
"""JSON request body to CREATE NEW RECIPE:
{
    "title":       "Classic Chocolate Chip Cookies",
    "description": "Delicious homemade cookies perfect for any occasion",
    "ingredients": [
        {
            "quantity":    2.25,
            "unit":       "cups",
            "ingredient": "all-purpose flour"
        },
        {
            "quantity":    1,
            "unit":       "tsp",
            "ingredient": "baking soda"
        },
        {
            "quantity":    2,
            "unit":       "large",
            "ingredient": "eggs"
        }
    ],
    "instructions": [
        "Preheat oven to 375°F (190°C)",
        "In a medium bowl, whisk together flour, baking soda, and salt",
        "In a large bowl, cream together butter and both sugars until light and fluffy",
        "Beat in eggs one at a time, then add vanilla",
        "Gradually blend in flour mixture",
        "Stir in chocolate chips",
        "Drop rounded tablespoons of dough onto ungreased cookie sheets",
        "Bake 9-11 minutes or until golden brown",
        "Cool on baking sheet for 2 minutes, then transfer to wire rack"
    ]
}
"""

@api.route('/new-recipe', methods=['POST'])
@api.route('/recipe', methods=['POST'])  # Alternative endpoint for frontend
@jwt_required()
def create_new_recipe():

    try: 
        # Get authenticated user ID (recipe author)
        current_user_id = get_jwt_identity()
        
        # Verify that user exists and is active
        user = User.query.get(current_user_id)
        if not user or not user.is_active:
            return jsonify({"error": "Invalid user."}), 401
        

        # Get request data
        data = request.get_json()
        

        # Validate required fields
        required_fields = ["title", "ingredients", "instructions"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"msg": f"The field '{field}' is required."}), 400
    

        # Validate ingredients structure
        ingredients = data.get('ingredients')
        if not isinstance(ingredients, list) or len(ingredients) == 0:
            return jsonify({"error": "Ingredients must be a non-empty array."}), 400
        
        for i, ingredient in enumerate(ingredients):
            if not isinstance(ingredient, dict):
                return jsonify({"error": f"Ingredient {i+1} must be an object."}), 400
            
            required_ingredient_fields = ["quantity", "unit", "ingredient"]
            for field in required_ingredient_fields:
                if field not in ingredient:
                    return jsonify({"error": f"Ingredient {i+1} is missing field '{field}'."}), 400
            
            try:
                # Validate quantity is a number
                float(ingredient['quantity'])
            except (ValueError, TypeError):
                return jsonify({"error": f"Ingredient {i+1} quantity must be a number."}), 400


        # Validate instructions structure
        instructions = data.get('instructions')
        if not isinstance(instructions, list) or len(instructions) == 0:
            return jsonify({"error": "Instructions must be a non-empty array."}), 400
        
        for i, instruction in enumerate(instructions):
            if not isinstance(instruction, str) or not instruction.strip():
                return jsonify({"error": f"Instruction {i+1} must be a non-empty string."}), 400

        # Create new recipe
        new_recipe = Recipe(
            author_id    = current_user_id,
            title        = data["title"][:100],  # Ensure maximum length
            description  = data.get("description", ""),  # Optional field
            ingredients  = ingredients,
            instructions = instructions
        )
        
        # Save to database
        db.session.add(new_recipe)
        db.session.commit()
        

        # Prepare response with author info
        recipe_response = new_recipe.serialize()

        recipe_response['author'] = {
            'user_id':     user.id,
            'username':    user.username,
            'full_name':   user.full_name,
            'cloudinary_url': user.cloudinary_url
        }
        
        return jsonify({
            "msg":    "Recipe created successfully.",
            "recipe": recipe_response
        }), 201
    
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error creating recipe.", "error": str(e)}), 500

#######################################################################################


############################################
#######        GET SINGLE RECIPE     #######
############################################
@api.route('/recipe/<int:recipe_id>', methods=['GET'])
def get_single_recipe(recipe_id):
    """
    Get a single recipe by ID with author information and images.
    """
    try:
        # Find the recipe
        recipe = Recipe.query.get(recipe_id)
        
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404
        
        # Get current user if authenticated (for like information)
        current_user_id = None
        try:
            current_user_id = get_jwt_identity()
        except:
            # User is not authenticated, which is fine
            pass
        
        # Get recipe data with like info
        recipe_data = recipe.serialize(current_user_id=current_user_id)
        
        # Add author information
        author = User.query.get(recipe.author_id)
        if author:
            recipe_data['author'] = {
                'user_id': author.id,
                'username': author.username,
                'full_name': author.full_name,
                'cloudinary_url': author.cloudinary_url
            }
        else:
            # Fallback if author is somehow missing
            recipe_data['author'] = {
                'user_id': recipe.author_id,
                'username': 'Unknown',
                'full_name': 'Unknown User',
                'cloudinary_url': None
            }
        
        # Add images
        images = RecipeImage.query.filter_by(recipe_id=recipe_id).order_by(RecipeImage.display_order).all()
        recipe_data['images'] = [img.serialize() for img in images]
        
        return jsonify({
            "msg": "Recipe found successfully",
            "recipe": recipe_data
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Error fetching recipe", "details": str(e)}), 500


############################################
#######       UPDATE RECIPE          #######
############################################
""" JSON request body to UPDATE RECIPE:
{
    "title":       "Updated Recipe Title",
    "description": "Updated description",
    "ingredients": [
        {
            "quantity":    2.5,
            "unit":       "cups",
            "ingredient": "updated ingredient"
        }
    ],
    "instructions": [
        "Updated instruction 1",
        "Updated instruction 2"
    ]
}
"""

@api.route('/recipe/<int:recipe_id>', methods=['PUT'])
@jwt_required()
def update_recipe(recipe_id):
    """
    Update an existing recipe. Only the recipe author can update their recipe.
    """
    try:
        # Get authenticated user ID
        current_user_id = get_jwt_identity()
        
        # Find the recipe
        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404
        
        # Check if user is the author of the recipe
        if recipe.author_id != int(current_user_id):
            return jsonify({"error": "You are not authorized to update this recipe"}), 403
        
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["title", "ingredients", "instructions"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"The field '{field}' is required."}), 400
        
        # Validate ingredients structure
        ingredients = data.get('ingredients')
        if not isinstance(ingredients, list) or len(ingredients) == 0:
            return jsonify({"error": "Ingredients must be a non-empty array."}), 400
        
        for i, ingredient in enumerate(ingredients):
            if not isinstance(ingredient, dict):
                return jsonify({"error": f"Ingredient {i+1} must be an object."}), 400
            
            required_ingredient_fields = ["quantity", "unit", "ingredient"]
            for field in required_ingredient_fields:
                if field not in ingredient:
                    return jsonify({"error": f"Ingredient {i+1} is missing field '{field}'."}), 400
            
            try:
                # Validate quantity is a number
                float(ingredient['quantity'])
            except (ValueError, TypeError):
                return jsonify({"error": f"Ingredient {i+1} quantity must be a number."}), 400

        # Validate instructions structure
        instructions = data.get('instructions')
        if not isinstance(instructions, list) or len(instructions) == 0:
            return jsonify({"error": "Instructions must be a non-empty array."}), 400
        
        for i, instruction in enumerate(instructions):
            if not isinstance(instruction, str) or not instruction.strip():
                return jsonify({"error": f"Instruction {i+1} must be a non-empty string."}), 400

        # Update recipe fields
        recipe.title = data["title"][:100]  # Ensure maximum length
        recipe.description = data.get("description", "")  # Optional field
        recipe.ingredients = ingredients
        recipe.instructions = instructions
        
        # Save to database
        db.session.commit()
        
        # Prepare response with author info
        recipe_response = recipe.serialize()
        
        # Get author information
        author = User.query.get(recipe.author_id)
        if author:
            recipe_response['author'] = {
                'user_id': author.id,
                'username': author.username,
                'full_name': author.full_name,
                'cloudinary_url': author.cloudinary_url
            }
        
        return jsonify({
            "msg": "Recipe updated successfully.",
            "recipe": recipe_response
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error updating recipe.", "details": str(e)}), 500


############################################
#######        GET ALL RECIPES       #######
############################################
@api.route('/recipes', methods=['GET'])
def get_all_recipes():
    """
    Get all recipes with basic information, author details, and primary images.
    Supports pagination with limit and offset parameters.
    """
    try:
        # Get pagination parameters
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        limit = min(limit, 100)

        # Future-proof filter parameters
        category = request.args.get('category')
        dietary = request.args.get('dietary')
        max_cooking_time = request.args.get('max_cooking_time', type=int)
        min_likes = request.args.get('min_likes', type=int)
        search = request.args.get('search')

        # Start query
        query = Recipe.query

        # Example: Add filters (expand as models support these fields)
        # if category:
        #     query = query.filter(Recipe.category == category)
        # if dietary:
        #     query = query.filter(Recipe.dietary == dietary)
        # if max_cooking_time:
        #     query = query.filter(Recipe.cooking_time <= max_cooking_time)
        # if min_likes:
        #     query = query.filter(Recipe.likes >= min_likes)
        if search:
            query = query.filter(Recipe.title.ilike(f"%{search}%"))

        # Order and paginate
        query = query.order_by(Recipe.created_at.desc())
        total_count = query.count()
        recipes = query.offset(offset).limit(limit).all()

        # Get current user if authenticated (for like information)
        current_user_id = None
        try:
            current_user_id = get_jwt_identity()
        except:
            # User is not authenticated, which is fine
            pass

        recipes_data = []
        for recipe in recipes:
            recipe_data = recipe.serialize(current_user_id=current_user_id)
            author = User.query.get(recipe.author_id)
            if author:
                recipe_data['author'] = {
                    'user_id': author.id,
                    'username': author.username,
                    'full_name': author.full_name,
                    'cloudinary_url': author.cloudinary_url
                }
            primary_image = RecipeImage.query.filter_by(
                recipe_id=recipe.id, 
                is_primary=True
            ).first()
            if not primary_image:
                primary_image = RecipeImage.query.filter_by(
                    recipe_id=recipe.id
                ).order_by(RecipeImage.display_order).first()
            recipe_data['primary_image'] = primary_image.serialize() if primary_image else None
            recipes_data.append(recipe_data)

        return jsonify({
            "msg": "Recipes retrieved successfully",
            "recipes": recipes_data,
            "pagination": {
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count
            }
        }), 200
    except Exception as e:
        return jsonify({"error": "Error fetching recipes", "details": str(e)}), 500


#######################################################
########            PASSWORD                   ########
########            RECOVERY                   ########
#######################################################


############################################
#######       Email Validation       #######
############################################
def send_recovery_email(email, token):
    # This function should implement the actual email sending logic
    # For demonstration purposes, we'll just print the recovery link
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    recovery_link = f"{frontend_url}/reset-password/{token}"
    print(f"Send this link to {email}: {recovery_link}")

""" JSON request body to validate email for recovery:
{
    "email": "user@example.com"
}
"""
@api.route('/recovery-validation', methods=['POST'])
def recover_account():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found."}), 404

    # Generate recovery token using itsdangerous


    secret_key = os.environ.get("SECRET_KEY", "default_secret")
    serializer = URLSafeTimedSerializer(secret_key)
    token = serializer.dumps(user.email, salt="password-recovery")
    send_recovery_email(user.email, token)

    return jsonify({"msg": "Recovery email sent.", "token": token}), 200


############################################
#######     Change Password          #######
#######     as logged out user     #######
############################################
""" JSON request body to change password:
{
    "new_password": "your_new_secure_password"
}
"""
@api.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):

    data = request.get_json()
    new_password = data.get("new_password")

    if not new_password:
        return jsonify({"error": "New password is required."}), 400

    # Verify token using itsdangerous

    secret_key = os.environ.get("SECRET_KEY", "default_secret")
    serializer = URLSafeTimedSerializer(secret_key)
    try:
        email = serializer.loads(token, salt="password-recovery", max_age=3600)  # 1 hour expiration
    except SignatureExpired:
        return jsonify({"error": "Token expired."}), 400
    except BadSignature:
        return jsonify({"error": "Invalid token."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found."}), 404


    user.plain_psswrd = new_password
    user.hashed_psswrd = generate_password_hash(new_password)


    db.session.commit()

    return jsonify({"msg": "Password updated successfully."}), 200




######################################################################################################




#######################################################
#######################################################
########              CLOUDINARY               ########
#######################################################
#######################################################


# =============================
#   USER PROFILE IMAGE UPLOAD
# =============================
@api.route('/user/upload-image', methods=['POST'])
@jwt_required()
def upload_user_image():
    """
    Uploads a user profile image to Cloudinary and saves the URL/image_id in the User model.
    Expects a multipart/form-data POST with 'image' field.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided.'}), 400
    image_file = request.files['image']

    # Validate file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    filename = image_file.filename.lower()
    if not any(filename.endswith('.' + ext) for ext in allowed_extensions):
        return jsonify({'error': 'Invalid file type. Only images are allowed.'}), 400

    try:
        # Delete old image if exists
        if user.cloudinary_img_id:
            try:
                cloudinary.uploader.destroy(user.cloudinary_img_id)
            except:
                pass  # Continue even if deletion fails
        
        # Upload new image with transformation for profile pictures
        upload_result = cloudinary.uploader.upload(
            image_file, 
            folder=f"tastebook/users/{user_id}",
            transformation=[
                {'width': 400, 'height': 400, 'crop': 'fill', 'gravity': 'face'},
                {'quality': 'auto:good'},
                {'format': 'auto'}
            ]
        )
        
        user.cloudinary_url = upload_result['secure_url']
        user.cloudinary_img_id = upload_result['public_id']
        db.session.commit()
        
        return jsonify({
            'msg': 'Profile image uploaded successfully.',
            'user': user.serialize()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =============================
#   DELETE USER PROFILE IMAGE
# =============================
@api.route('/user/delete-image', methods=['DELETE'])
@jwt_required()
def delete_user_image():
    """
    Deletes a user's profile image from Cloudinary and removes URL/image_id from User model.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if not user.cloudinary_img_id:
        return jsonify({'error': 'No profile image to delete'}), 404

    try:
        # Delete from Cloudinary
        cloudinary.uploader.destroy(user.cloudinary_img_id)
        
        # Clear from database
        user.cloudinary_url = None
        user.cloudinary_img_id = None
        db.session.commit()
        
        return jsonify({
            'msg': 'Profile image deleted successfully.',
            'user': user.serialize()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =============================
#   RECIPE IMAGE UPLOAD
# =============================
@api.route('/recipe/<int:recipe_id>/upload-image', methods=['POST'])
@jwt_required()
def upload_recipe_image(recipe_id):
    """
    Uploads an image for a recipe to Cloudinary, saves to RecipeImage table.
    Expects a multipart/form-data POST with 'image' field and optional 'is_primary' boolean.
    """
    user_id = get_jwt_identity()
    recipe = Recipe.query.get(recipe_id)
    
    if not recipe:
        return jsonify({'error': 'Recipe not found.'}), 404
    
    if recipe.author_id != int(user_id):
        return jsonify({'error': 'Recipe not found or unauthorized.'}), 404

    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided.'}), 400
    image_file = request.files['image']
    is_primary = request.form.get('is_primary', 'false').lower() == 'true'

    try:
        upload_result = cloudinary.uploader.upload(image_file, folder=f"tastebook/recipes/{recipe_id}")
        
        # Get the next display order
        max_order = db.session.query(db.func.max(RecipeImage.display_order)).filter_by(recipe_id=recipe_id).scalar()
        next_order = (max_order or -1) + 1
        
        # If is_primary, unset previous primary
        if is_primary:
            RecipeImage.query.filter_by(recipe_id=recipe_id, is_primary=True).update({'is_primary': False})
        
        new_image = RecipeImage(
            recipe_id=recipe_id,
            url=upload_result['secure_url'],
            image_id=upload_result['public_id'],
            is_primary=is_primary,
            display_order=next_order
        )
        db.session.add(new_image)
        db.session.commit()
        return jsonify({'msg': 'Recipe image uploaded.', 'image': new_image.serialize()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =============================
#   TEMPORARY IMAGE UPLOAD
# =============================
@api.route('/recipe/temp/upload-image', methods=['POST'])
@jwt_required()
def upload_temp_recipe_image():
    """
    Temporarily uploads an image to Cloudinary for recipes being created.
    The image will be moved to the proper recipe folder after recipe creation.
    """
    user_id = get_jwt_identity()

    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided.'}), 400
    image_file = request.files['image']
    is_primary = request.form.get('is_primary', 'false').lower() == 'true'

    try:
        # Upload to a temporary folder
        upload_result = cloudinary.uploader.upload(
            image_file, 
            folder=f"tastebook/temp/{user_id}",
            # Add transformation for optimization
            transformation=[
                {'width': 800, 'height': 800, 'crop': 'limit'},
                {'quality': 'auto'},
                {'format': 'auto'}
            ]
        )
        
        # Return the image data in the same format as regular uploads
        temp_image = {
            'id': f"temp_{upload_result['public_id']}",
            'url': upload_result['secure_url'],
            'image_id': upload_result['public_id'],
            'is_primary': is_primary,
            'display_order': 0,  # Will be set properly when recipe is created
            'uploaded_at': datetime.now().isoformat()
        }
        
        return jsonify({'msg': 'Temporary image uploaded.', 'image': temp_image}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =============================
#   ASSOCIATE TEMP IMAGES WITH RECIPE
# =============================
@api.route('/recipe/<int:recipe_id>/associate-temp-images', methods=['POST'])
@jwt_required()
def associate_temp_images_with_recipe(recipe_id):
    """
    Associates temporary images with a recipe by creating RecipeImage records.
    Expects JSON with 'temp_images' array containing temp image data.
    """
    user_id = get_jwt_identity()
    recipe = Recipe.query.get(recipe_id)
    if not recipe or recipe.author_id != user_id:
        return jsonify({'error': 'Recipe not found or unauthorized.'}), 404

    data = request.get_json()
    if not data or 'temp_images' not in data:
        return jsonify({'error': 'Missing temp_images array.'}), 400

    temp_images = data['temp_images']
    
    # Debug logging
    print(f"🔄 Associating {len(temp_images)} temp images with recipe {recipe_id}")
    for i, img in enumerate(temp_images):
        print(f"  Image {i}: url={img.get('url', 'missing')[:50]}..., image_id={img.get('image_id', 'missing')}, is_primary={img.get('is_primary', False)}")
    
    try:
        created_images = []
        
        for idx, temp_img in enumerate(temp_images):
            # Validate required fields
            if not temp_img.get('url'):
                raise ValueError(f"Missing 'url' for image {idx}")
            if not temp_img.get('image_id'):
                raise ValueError(f"Missing 'image_id' for image {idx}")
            
            # Create RecipeImage record
            new_image = RecipeImage(
                recipe_id=recipe_id,
                url=temp_img['url'],
                image_id=temp_img['image_id'],
                is_primary=temp_img.get('is_primary', False),
                display_order=idx
            )
            db.session.add(new_image)
            created_images.append(new_image)
            print(f"✅ Created RecipeImage for image {idx}: {new_image}")
        
        db.session.commit()
        
        return jsonify({
            'msg': 'Temporary images associated with recipe successfully.',
            'images': [img.serialize() for img in created_images]
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =============================
#   SET PRIMARY RECIPE IMAGE
# =============================
@api.route('/recipe/<int:recipe_id>/image/<int:image_id>/set-primary', methods=['PUT'])
@jwt_required()
def set_primary_recipe_image(recipe_id, image_id):
    """
    Sets a recipe image as primary, unsets previous primary.
    """
    user_id = get_jwt_identity()
    recipe = Recipe.query.get(recipe_id)
    if not recipe or recipe.author_id != user_id:
        return jsonify({'error': 'Recipe not found or unauthorized.'}), 404
    image = RecipeImage.query.get(image_id)
    if not image or image.recipe_id != recipe_id:
        return jsonify({'error': 'Image not found.'}), 404
    try:
        RecipeImage.query.filter_by(recipe_id=recipe_id, is_primary=True).update({'is_primary': False})
        image.is_primary = True
        db.session.commit()
        return jsonify({'msg': 'Primary image set.', 'image': image.serialize()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =============================
#   DELETE RECIPE IMAGE
# =============================
@api.route('/recipe/<int:recipe_id>/image/<int:image_id>', methods=['DELETE'])
@jwt_required()
def delete_recipe_image(recipe_id, image_id):
    """
    Deletes a recipe image from Cloudinary and DB.
    """
    user_id = get_jwt_identity()
    recipe = Recipe.query.get(recipe_id)
    if not recipe or recipe.author_id != user_id:
        return jsonify({'error': 'Recipe not found or unauthorized.'}), 404
    image = RecipeImage.query.get(image_id)
    if not image or image.recipe_id != recipe_id:
        return jsonify({'error': 'Image not found.'}), 404
    try:
        cloudinary.uploader.destroy(image.image_id)
        db.session.delete(image)
        db.session.commit()
        return jsonify({'msg': 'Image deleted.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =============================
#   REORDER RECIPE IMAGES
# =============================
@api.route('/recipe/<int:recipe_id>/reorder-images', methods=['PUT'])
@jwt_required()
def reorder_recipe_images(recipe_id):
    """
    Reorders recipe images. Expects JSON with 'image_ids' array in desired order.
    """
    user_id = get_jwt_identity()
    recipe = Recipe.query.get(recipe_id)
    if not recipe or recipe.author_id != user_id:
        return jsonify({'error': 'Recipe not found or unauthorized.'}), 404
    
    data = request.get_json()
    if not data or 'image_ids' not in data:
        return jsonify({'error': 'Missing image_ids array.'}), 400
    
    image_ids = data['image_ids']
    
    try:
        # Update display order for each image
        for index, image_id in enumerate(image_ids):
            image = RecipeImage.query.filter_by(id=image_id, recipe_id=recipe_id).first()
            if image:
                image.display_order = index
        
        db.session.commit()
        
        # Return updated images
        updated_images = RecipeImage.query.filter_by(recipe_id=recipe_id).order_by(RecipeImage.display_order).all()
        return jsonify({
            'msg': 'Images reordered successfully.',
            'images': [img.serialize() for img in updated_images]
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =============================
#   GET RECIPE IMAGES
# =============================
@api.route('/recipe/<int:recipe_id>/images', methods=['GET'])
def get_recipe_images(recipe_id):
    """
    Gets all images for a recipe, ordered by display_order.
    """
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({'error': 'Recipe not found.'}), 404
    
    images = RecipeImage.query.filter_by(recipe_id=recipe_id).order_by(RecipeImage.display_order).all()
    return jsonify({
        'images': [img.serialize() for img in images]
    }), 200


#########################################################################################
#########################################################################################
#############                        COMMENTS                               #############
#############                    FEATURE ENDPOINTS                          #############
#########################################################################################
#########################################################################################


############################################
#######    GET COMMENTS FOR RECIPE   #######
############################################
@api.route('/recipe/<int:recipe_id>/comments', methods=['GET'])
def get_recipe_comments(recipe_id):
    """
    Get all comments for a specific recipe, organized hierarchically.
    Returns main comments with their nested replies (only one level deep).
    Supports pagination and sorting.
    """
    try:
        # Check if recipe exists
        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404

        # Get pagination parameters
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        sort_by = request.args.get('sort_by', 'date', type=str)  # date, likes
        sort_order = request.args.get('sort_order', 'desc', type=str)  # asc, desc
        
        # Ensure reasonable limits
        limit = min(limit, 100)  # Max 100 comments per request
        
        # Get current user ID if authenticated (for like status)
        current_user_id = None
        try:
            from flask_jwt_extended import get_jwt_identity
            current_user_id = get_jwt_identity()
        except:
            pass  # User not authenticated
        
        # Build query for main comments only (no parent_comment_id)
        query = RecipeComment.query.filter_by(recipe_id=recipe_id, parent_comment_id=None)
        
        # Handle pinned comments - always show pinned comment first
        pinned_comment = query.filter_by(is_pinned=True).first()
        
        # Get non-pinned comments with sorting
        non_pinned_query = query.filter_by(is_pinned=False)
        
        if sort_by == 'likes':
            # Sort by like count (using the relationship)
            non_pinned_query = non_pinned_query.outerjoin(CommentLike).group_by(RecipeComment.id)
            if sort_order == 'desc':
                non_pinned_query = non_pinned_query.order_by(db.func.count(CommentLike.id).desc(), RecipeComment.date_created.desc())
            else:
                non_pinned_query = non_pinned_query.order_by(db.func.count(CommentLike.id).asc(), RecipeComment.date_created.asc())
        else:  # default to date
            if sort_order == 'desc':
                non_pinned_query = non_pinned_query.order_by(RecipeComment.date_created.desc())
            else:
                non_pinned_query = non_pinned_query.order_by(RecipeComment.date_created.asc())
        
        # Get total count for pagination (excluding pinned from count since it's always shown)
        total_non_pinned = non_pinned_query.count()
        
        # Apply pagination to non-pinned comments
        non_pinned_comments = non_pinned_query.offset(offset).limit(limit).all()
        
        # Combine pinned and non-pinned comments
        comments = []
        if pinned_comment and offset == 0:  # Only show pinned on first page
            comments.append(pinned_comment)
        comments.extend(non_pinned_comments)
        
        # Serialize comments with their replies
        comments_data = []
        for comment in comments:
            comment_data = comment.serialize(include_replies=True, current_user_id=current_user_id)
            comments_data.append(comment_data)
        
        return jsonify({
            "msg": "Comments retrieved successfully",
            "comments": comments_data,
            "pagination": {
                "total": total_non_pinned + (1 if pinned_comment else 0),
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_non_pinned
            },
            "stats": {
                "total_comments": RecipeComment.query.filter_by(recipe_id=recipe_id).count(),
                "main_comments": RecipeComment.query.filter_by(recipe_id=recipe_id, parent_comment_id=None).count(),
                "has_pinned": pinned_comment is not None
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Error fetching comments", "details": str(e)}), 500


############################################
#######       CREATE NEW COMMENT     #######
############################################
""" JSON request body to CREATE NEW COMMENT:
{
    "content": "This recipe looks amazing! Can't wait to try it.",
    "parent_comment_id": null  // optional, for replies
}
"""

@api.route('/recipe/<int:recipe_id>/comments', methods=['POST'])
@jwt_required()
def create_comment(recipe_id):
    """
    Create a new comment for a recipe.
    Can be a main comment or a reply to another comment (only one level deep).
    """
    try:
        # Get authenticated user ID
        current_user_id = get_jwt_identity()
        
        # Check if user exists and is active
        user = User.query.get(current_user_id)
        if not user or not user.is_active:
            return jsonify({"error": "Invalid user"}), 401
        
        # Check if recipe exists
        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404
        
        # Get request data
        data = request.get_json()
        content = data.get("content", "").strip()
        parent_comment_id = data.get("parent_comment_id")
        
        # Validate content
        if not content:
            return jsonify({"error": "Comment content is required"}), 400
        
        if len(content) > 1000:  # Set reasonable limit
            return jsonify({"error": "Comment content must not exceed 1000 characters"}), 400
        
        # If this is a reply, validate parent comment
        parent_comment = None
        if parent_comment_id:
            parent_comment = RecipeComment.query.get(parent_comment_id)
            if not parent_comment:
                return jsonify({"error": "Parent comment not found"}), 404
            
            if parent_comment.recipe_id != recipe_id:
                return jsonify({"error": "Parent comment does not belong to this recipe"}), 400
            
            # Prevent nested replies (only one level deep)
            if parent_comment.parent_comment_id is not None:
                return jsonify({"error": "Cannot reply to a reply. Only one level of nesting allowed"}), 400
        
        # Create new comment
        new_comment = RecipeComment(
            user_id=current_user_id,
            recipe_id=recipe_id,
            parent_comment_id=parent_comment_id,
            content=content,
            is_edited=False,
            is_pinned=False
        )
        
        # Save to database
        db.session.add(new_comment)
        db.session.commit()
        
        # Return the created comment with full serialization
        comment_data = new_comment.serialize(include_replies=False, current_user_id=current_user_id)
        
        return jsonify({
            "msg": "Comment created successfully",
            "comment": comment_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error creating comment", "details": str(e)}), 500


############################################
#######       UPDATE COMMENT         #######
############################################
""" JSON request body to UPDATE COMMENT:
{
    "content": "Updated comment content here"
}
"""

@api.route('/comment/<int:comment_id>', methods=['PUT'])
@jwt_required()
def update_comment(comment_id):
    """
    Update an existing comment. Only the comment author can edit their comment.
    """
    try:
        # Get authenticated user ID
        current_user_id = get_jwt_identity()
        
        # Find the comment
        comment = RecipeComment.query.get(comment_id)
        if not comment:
            return jsonify({"error": "Comment not found"}), 404
        
        # Check if user is the author of the comment
        if comment.user_id != int(current_user_id):
            return jsonify({"error": "You are not authorized to edit this comment"}), 403
        
        # Get request data
        data = request.get_json()
        new_content = data.get("content", "").strip()
        
        # Validate content
        if not new_content:
            return jsonify({"error": "Comment content is required"}), 400
        
        if len(new_content) > 1000:
            return jsonify({"error": "Comment content must not exceed 1000 characters"}), 400
        
        # Update comment
        comment.content = new_content
        comment.is_edited = True
        
        # Save to database
        db.session.commit()
        
        # Return updated comment
        comment_data = comment.serialize(include_replies=False, current_user_id=current_user_id)
        
        return jsonify({
            "msg": "Comment updated successfully",
            "comment": comment_data
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error updating comment", "details": str(e)}), 500


############################################
#######       DELETE COMMENT         #######
############################################
@api.route('/comment/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    """
    Delete a comment. Only the comment author can delete their comment.
    This will also delete all replies to this comment.
    """
    try:
        # Get authenticated user ID
        current_user_id = get_jwt_identity()
        
        # Find the comment
        comment = RecipeComment.query.get(comment_id)
        if not comment:
            return jsonify({"error": "Comment not found"}), 404
        
        # Check if user is the author of the comment
        if comment.user_id != int(current_user_id):
            return jsonify({"error": "You are not authorized to delete this comment"}), 403
        
        # Get counts before deletion for response
        replies_count = len(comment.replies)
        
        # Delete the comment (cascade will handle replies and likes)
        db.session.delete(comment)
        db.session.commit()
        
        return jsonify({
            "msg": "Comment deleted successfully",
            "deleted_comment_id": comment_id,
            "deleted_replies_count": replies_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error deleting comment", "details": str(e)}), 500


############################################
#######       LIKE/UNLIKE COMMENT    #######
############################################
@api.route('/comment/<int:comment_id>/like', methods=['POST'])
@jwt_required()
def toggle_comment_like(comment_id):
    """
    Toggle like status for a comment. If user has liked it, unlike it. If not liked, like it.
    """
    try:
        # Get authenticated user ID
        current_user_id = get_jwt_identity()
        
        # Check if user exists and is active
        user = User.query.get(current_user_id)
        if not user or not user.is_active:
            return jsonify({"error": "Invalid user"}), 401
        
        # Find the comment
        comment = RecipeComment.query.get(comment_id)
        if not comment:
            return jsonify({"error": "Comment not found"}), 404
        
        # Check if user has already liked this comment
        existing_like = CommentLike.query.filter_by(
            user_id=current_user_id,
            comment_id=comment_id
        ).first()
        
        if existing_like:
            # Unlike the comment
            db.session.delete(existing_like)
            db.session.commit()
            
            action = "unliked"
            is_liked = False
        else:
            # Like the comment
            new_like = CommentLike(
                user_id=current_user_id,
                comment_id=comment_id
            )
            db.session.add(new_like)
            db.session.commit()
            
            action = "liked"
            is_liked = True
        
        # Get updated like count
        like_count = CommentLike.query.filter_by(comment_id=comment_id).count()
        
        return jsonify({
            "msg": f"Comment {action} successfully",
            "is_liked": is_liked,
            "like_count": like_count,
            "comment_id": comment_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error toggling comment like", "details": str(e)}), 500


############################################
#######      PIN/UNPIN COMMENT       #######
############################################
@api.route('/comment/<int:comment_id>/pin', methods=['PUT'])
@jwt_required()
def toggle_comment_pin(comment_id):
    """
    Toggle pin status for a comment. Only the recipe owner can pin/unpin comments.
    Only one comment can be pinned per recipe.
    """
    try:
        # Get authenticated user ID
        current_user_id = get_jwt_identity()
        
        # Find the comment
        comment = RecipeComment.query.get(comment_id)
        if not comment:
            return jsonify({"error": "Comment not found"}), 404
        
        # Check if current user is the recipe owner
        recipe = Recipe.query.get(comment.recipe_id)
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404
        
        if recipe.author_id != int(current_user_id):
            return jsonify({"error": "Only the recipe owner can pin/unpin comments"}), 403
        
        # Only main comments can be pinned (not replies)
        if comment.parent_comment_id is not None:
            return jsonify({"error": "Only main comments can be pinned, not replies"}), 400
        
        if comment.is_pinned:
            # Unpin the comment
            comment.is_pinned = False
            action = "unpinned"
        else:
            # Unpin any currently pinned comment for this recipe
            current_pinned = RecipeComment.query.filter_by(
                recipe_id=comment.recipe_id,
                is_pinned=True,
                parent_comment_id=None
            ).first()
            
            if current_pinned:
                current_pinned.is_pinned = False
            
            # Pin this comment
            comment.is_pinned = True
            action = "pinned"
        
        # Save to database
        db.session.commit()
        
        # Return updated comment
        comment_data = comment.serialize(include_replies=False, current_user_id=current_user_id)
        
        return jsonify({
            "msg": f"Comment {action} successfully",
            "comment": comment_data,
            "is_pinned": comment.is_pinned
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error toggling comment pin", "details": str(e)}), 500



##################################################
##################################################
#############                         ############
#############      RECIPE LIKES       ############
#############                         ############
##################################################
##################################################


##############################################
### Toggle like/unlike for a recipe
##############################################

@api.route('/recipe/<int:recipe_id>/like', methods=['POST'])
@jwt_required()
def toggle_recipe_like(recipe_id):
    """
    Toggle like/unlike status for a recipe
    If user hasn't liked the recipe, it will be liked
    If user has already liked the recipe, it will be unliked
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        
        # Verify recipe exists
        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404
        
        # Check if user has already liked this recipe
        existing_like = RecipeLike.query.filter_by(
            user_id=current_user_id,
            recipe_id=recipe_id
        ).first()
        
        if existing_like:
            # Unlike the recipe (remove the like)
            db.session.delete(existing_like)
            action = "unliked"
            is_liked = False
        else:
            # Like the recipe (add new like)
            new_like = RecipeLike(
                user_id=current_user_id,
                recipe_id=recipe_id
            )
            db.session.add(new_like)
            action = "liked"
            is_liked = True
        
        # Save to database
        db.session.commit()
        
        # Get updated like count
        updated_recipe = Recipe.query.get(recipe_id)
        like_count = updated_recipe.like_count
        
        return jsonify({
            "msg": f"Recipe {action} successfully",
            "is_liked": is_liked,
            "like_count": like_count,
            "recipe_id": recipe_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error toggling recipe like", "details": str(e)}), 500


##############################################
### Get liked recipes for current user
##############################################

@api.route('/user/liked-recipes', methods=['GET'])
@jwt_required()
def get_user_liked_recipes():
    """
    Get all recipes liked by the current user
    Supports pagination, search, and sorting
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 12, type=int), 50)  # Max 50 per page
        search = request.args.get('search', '', type=str).strip()
        sort_by = request.args.get('sort_by', 'liked_date', type=str)  # liked_date, recipe_name, author_name
        order = request.args.get('order', 'desc', type=str)  # asc or desc
        
        # Base query for liked recipes
        query = db.session.query(Recipe).join(RecipeLike).filter(RecipeLike.user_id == current_user_id)
        
        # Apply search filter if provided
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Recipe.title.ilike(search_filter),
                    Recipe.description.ilike(search_filter)
                )
            )
        
        # Apply sorting
        if sort_by == 'liked_date':
            # Sort by when the user liked the recipe (Like table already joined)
            query = query.order_by(
                RecipeLike.created_at.desc() if order == 'desc' else RecipeLike.created_at.asc()
            )
        elif sort_by == 'recipe_name':
            query = query.order_by(
                Recipe.title.desc() if order == 'desc' else Recipe.title.asc()
            )
        elif sort_by == 'author_name':
            query = query.join(User, Recipe.author_id == User.id).order_by(
                User.full_name.desc() if order == 'desc' else User.full_name.asc()
            )
        else:
            # Default to liked date descending (Like table already joined)
            query = query.order_by(RecipeLike.created_at.desc())
        
        # Paginate results
        paginated_recipes = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Serialize recipes with like information
        recipes_data = []
        for recipe in paginated_recipes.items:
            # Get the like date for this user
            like = RecipeLike.query.filter_by(user_id=current_user_id, recipe_id=recipe.id).first()
            
            recipe_data = recipe.serialize(current_user_id=current_user_id)
            recipe_data['liked_at'] = like.created_at.isoformat() if like else None
            
            # Add author information
            recipe_data['author'] = {
                'user_id': recipe.author.id,
                'username': recipe.author.username,
                'full_name': recipe.author.full_name,
                'cloudinary_url': recipe.author.cloudinary_url
            }
            
            # Add primary image if available
            primary_image = next((img for img in recipe.images if img.is_primary), None)
            if not primary_image and recipe.images:
                primary_image = recipe.images[0]  # Use first image if no primary
            
            recipe_data['primary_image'] = primary_image.serialize() if primary_image else None
            
            recipes_data.append(recipe_data)
        
        return jsonify({
            "msg": "Liked recipes retrieved successfully",
            "recipes": recipes_data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": paginated_recipes.total,
                "pages": paginated_recipes.pages,
                "has_prev": paginated_recipes.has_prev,
                "has_next": paginated_recipes.has_next,
                "prev_num": paginated_recipes.prev_num,
                "next_num": paginated_recipes.next_num
            },
            "search": search,
            "sort_by": sort_by,
            "order": order
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Error retrieving liked recipes", "details": str(e)}), 500


##############################################
### Get like status and count for a recipe
##############################################

@api.route('/recipe/<int:recipe_id>/like-info', methods=['GET'])
def get_recipe_like_info(recipe_id):
    """
    Get like count and like status for a recipe
    If user is authenticated, also returns whether they liked it
    """
    try:
        # Verify recipe exists
        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404
        
        # Get like count
        like_count = recipe.like_count
        
        # Check if current user (if authenticated) has liked this recipe
        is_liked_by_user = False
        try:
            current_user_id = get_jwt_identity()
            if current_user_id:
                is_liked_by_user = recipe.is_liked_by(current_user_id)
        except:
            # User is not authenticated, which is fine
            pass
        
        return jsonify({
            "recipe_id": recipe_id,
            "like_count": like_count,
            "is_liked_by_user": is_liked_by_user
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Error retrieving recipe like info", "details": str(e)}), 500


#########################################################################################
#########################################################################################
#############                         COLLECTIONS                           #############
#############                     TasteBook Collections                     #############
#############                   Create, Read, Update, Delete                #############
#########################################################################################
#########################################################################################


############################################
#######      CREATE COLLECTION       #######
############################################
""" JSON request body to create a collection:
{
    "title":       "My Collection Name",    // required
    "description": "Collection description", // optional
    "is_public":   true                     // optional, default: false
}
"""
@api.route('/collection', methods=['POST'])
@jwt_required()
def create_collection():
    """Create a new collection for the authenticated user."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json() or {}
        title = data.get('title')
        description = data.get('description')
        is_public = data.get('is_public', False)

        if not title:
            return jsonify({"error": "Title is required"}), 400

        collection = Collection(
            owner_id = user.id,
            title = title,
            description = description,
            is_public = bool(is_public)
        )

        db.session.add(collection)
        db.session.commit()

        return jsonify({"msg": "Collection created successfully", "collection": collection.serialize()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create collection", "details": str(e)}), 500


############################################
#######   GET USER'S COLLECTIONS     #######
############################################
@api.route('/user/collections', methods=['GET'])
@jwt_required()
def get_user_collections():
    """Get all collections for the authenticated user (private + public).
    
    Query parameters:
    - public_only: true/false (default: false)
    - private_only: true/false (default: false)
    - search: search by title
    - sort_by: created_at/title (default: created_at)
    - order: asc/desc (default: desc)
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Optional query params: public_only, private_only, search, sort_by
        public_only = request.args.get('public_only')
        private_only = request.args.get('private_only')
        search = request.args.get('search')
        sort_by = request.args.get('sort_by', 'created_at')
        order = request.args.get('order', 'desc')

        query = Collection.query.filter_by(owner_id=user.id)

        # Handle visibility filters (public_only takes precedence if both are set)
        if public_only and public_only.lower() == 'true':
            query = query.filter_by(is_public=True)
        elif private_only and private_only.lower() == 'true':
            query = query.filter_by(is_public=False)

        if search:
            query = query.filter(Collection.title.ilike(f"%{search}%"))

        # Simple sorting
        if sort_by == 'title':
            sort_col = Collection.title
        else:
            sort_col = Collection.created_at

        if order.lower() == 'asc':
            query = query.order_by(sort_col.asc())
        else:
            query = query.order_by(sort_col.desc())

        collections = query.all()

        return jsonify({"collections": [c.serialize() for c in collections]}), 200

    except Exception as e:
        return jsonify({"error": "Failed to retrieve collections", "details": str(e)}), 500


############################################
#######   GET PUBLIC USER COLLECTIONS #######
############################################
@api.route('/user/<string:username>/collections', methods=['GET'])
def get_public_collections_for_user(username):
    """Get all public collections for a given user (for public profile pages)."""
    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        collections = Collection.query.filter_by(
            owner_id=user.id, 
            is_public=True
        ).order_by(Collection.created_at.desc()).all()

        return jsonify({"collections": [c.serialize() for c in collections]}), 200

    except Exception as e:
        return jsonify({"error": "Failed to retrieve public collections", "details": str(e)}), 500


############################################
#######      GET SINGLE COLLECTION   #######
############################################
@api.route('/collection/<int:collection_id>', methods=['GET'])
def get_collection(collection_id):
    """Get a single collection. If private, only owner may access.
    
    Query parameters:
    - include_recipes: true/false (default: false)
    """
    try:
        collection = Collection.query.get(collection_id)
        if not collection:
            return jsonify({"error": "Collection not found"}), 404

        # DEBUG: Print collection info
        print(f"🔍 DEBUG: Collection ID: {collection_id}")
        print(f"🔍 DEBUG: Collection title: {collection.title}")
        print(f"🔍 DEBUG: Collection owner_id: {collection.owner_id} (type: {type(collection.owner_id)})")
        print(f"🔍 DEBUG: Collection is_public: {collection.is_public}")

        # If private, require owner or jwt
        if not collection.is_public:
            print(f"🔍 DEBUG: Collection is private, checking authentication...")
            
            # Get current user ID from JWT if available
            current_user_id = None
            try:
                # Import JWT functions at the call site to avoid issues
                from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
                
                # Check if JWT is present in request
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                print(f"🔍 DEBUG: JWT verification successful, current_user_id: {current_user_id} (type: {type(current_user_id)})")
                
            except Exception as jwt_error:
                print(f"🔍 DEBUG: JWT Exception: {jwt_error}")
                print(f"🔍 DEBUG: Exception type: {type(jwt_error)}")
                return jsonify({"error": "Authentication required for private collection"}), 401
            
            if not current_user_id:
                print(f"🔍 DEBUG: No current_user_id from JWT")
                return jsonify({"error": "Collection is private"}), 403
                
            # Convert both to int for comparison
            try:
                collection_owner_int = int(collection.owner_id)
                current_user_int = int(current_user_id)
                
                print(f"🔍 DEBUG: Comparison - collection.owner_id as int: {collection_owner_int}")
                print(f"🔍 DEBUG: Comparison - current_user_id as int: {current_user_int}")
                print(f"🔍 DEBUG: Are they equal? {collection_owner_int == current_user_int}")
                
                if collection_owner_int != current_user_int:
                    print(f"🔍 DEBUG: User {current_user_int} is not owner {collection_owner_int}")
                    return jsonify({"error": "Collection is private"}), 403
                else:
                    print(f"🔍 DEBUG: ✅ User {current_user_int} IS the owner!")
                    
            except (ValueError, TypeError) as convert_error:
                print(f"🔍 DEBUG: Error converting IDs to int: {convert_error}")
                return jsonify({"error": "Authentication error"}), 403

        print(f"🔍 DEBUG: ✅ Access granted to collection {collection_id}")
        
        include_recipes = request.args.get('include_recipes', 'false').lower() == 'true'
        
        # Get current user ID for serialization (if available)
        current_user_id = None
        try:
            from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
            verify_jwt_in_request(optional=True)  # Optional check
            current_user_id = get_jwt_identity()
        except:
            pass  # No JWT token is fine for public collections

        return jsonify({
            "collection": collection.serialize(
                include_recipes=include_recipes, 
                current_user_id=current_user_id
            )
        }), 200

    except Exception as e:
        print(f"🔍 DEBUG: Outer exception in get_collection: {e}")
        return jsonify({"error": "Failed to retrieve collection", "details": str(e)}), 500


############################################
#######     UPDATE COLLECTION        #######
############################################
""" JSON request body to update a collection:
{
    "title":       "Updated Collection Name", // optional
    "description": "Updated description",     // optional
    "is_public":   false                      // optional
}
"""
@api.route('/collection/<int:collection_id>', methods=['PUT'])
@jwt_required()
def update_collection(collection_id):
    """Update collection metadata (title, description, is_public). Owner only."""
    try:
        user_id = get_jwt_identity()
        collection = Collection.query.get(collection_id)
        if not collection:
            return jsonify({"error": "Collection not found"}), 404

        if str(collection.owner_id) != str(user_id):
            return jsonify({"error": "Not authorized to modify this collection"}), 403

        data = request.get_json() or {}
        
        if 'title' in data:
            if not data['title']:
                return jsonify({"error": "Title cannot be empty"}), 400
            collection.title = data['title']
            
        if 'description' in data:
            collection.description = data['description']
            
        if 'is_public' in data:
            collection.is_public = bool(data['is_public'])

        db.session.commit()

        return jsonify({
            "msg": "Collection updated successfully", 
            "collection": collection.serialize()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update collection", "details": str(e)}), 500


############################################
#######     DELETE COLLECTION        #######
############################################
@api.route('/collection/<int:collection_id>', methods=['DELETE'])
@jwt_required()
def delete_collection(collection_id):
    """Delete a collection. Owner only."""
    try:
        user_id = get_jwt_identity()
        collection = Collection.query.get(collection_id)
        if not collection:
            return jsonify({"error": "Collection not found"}), 404

        if str(collection.owner_id) != str(user_id):
            return jsonify({"error": "Not authorized to delete this collection"}), 403

        db.session.delete(collection)
        db.session.commit()

        return jsonify({"msg": "Collection deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete collection", "details": str(e)}), 500


############################################
#######   ADD RECIPE TO COLLECTION   #######
############################################
""" JSON request body to add recipe to collection:
{
    "recipe_id":     123,    // required
    "display_order": 5       // optional, default: 0
}
"""
@api.route('/collection/<int:collection_id>/add-recipe', methods=['POST'])
@jwt_required()
def add_recipe_to_collection(collection_id):
    """Add a recipe to a collection. Owner only."""
    try:
        user_id = get_jwt_identity()
        collection = Collection.query.get(collection_id)
        if not collection:
            return jsonify({"error": "Collection not found"}), 404

        if str(collection.owner_id) != str(user_id):
            return jsonify({"error": "Not authorized to modify this collection"}), 403

        data = request.get_json() or {}
        recipe_id = data.get('recipe_id')
        display_order = data.get('display_order', 0)

        if not recipe_id:
            return jsonify({"error": "recipe_id is required"}), 400

        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404

        # Prevent duplicates via unique constraint; check first
        existing = CollectionRecipe.query.filter_by(
            collection_id=collection.id, 
            recipe_id=recipe.id
        ).first()
        
        if existing:
            return jsonify({"msg": "Recipe already in collection"}), 200

        assoc = CollectionRecipe(
            collection_id=collection.id, 
            recipe_id=recipe.id, 
            display_order=display_order
        )
        
        db.session.add(assoc)
        db.session.commit()

        return jsonify({
            "msg": "Recipe added to collection successfully", 
            "association": assoc.serialize()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to add recipe to collection", "details": str(e)}), 500


############################################
####### REMOVE RECIPE FROM COLLECTION #######
############################################
""" JSON request body to remove recipe from collection:
{
    "recipe_id": 123    // required
}
"""
@api.route('/collection/<int:collection_id>/remove-recipe', methods=['POST'])
@jwt_required()
def remove_recipe_from_collection(collection_id):
    """Remove a recipe from a collection. Owner only."""
    try:
        user_id = get_jwt_identity()
        collection = Collection.query.get(collection_id)
        if not collection:
            return jsonify({"error": "Collection not found"}), 404

        if str(collection.owner_id) != str(user_id):
            return jsonify({"error": "Not authorized to modify this collection"}), 403

        data = request.get_json() or {}
        recipe_id = data.get('recipe_id')

        if not recipe_id:
            return jsonify({"error": "recipe_id is required"}), 400

        assoc = CollectionRecipe.query.filter_by(
            collection_id=collection.id, 
            recipe_id=recipe_id
        ).first()
        
        if not assoc:
            return jsonify({"error": "Recipe not found in collection"}), 404

        db.session.delete(assoc)
        db.session.commit()

        return jsonify({"msg": "Recipe removed from collection successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to remove recipe from collection", "details": str(e)}), 500


############################################
#######   REORDER COLLECTION RECIPES #######
############################################
""" JSON request body to reorder recipes in collection:
{
    "order": [
        {"association_id": 1, "display_order": 0},
        {"association_id": 3, "display_order": 1},
        {"association_id": 2, "display_order": 2}
    ]
}
"""
@api.route('/collection/<int:collection_id>/reorder', methods=['PUT'])
@jwt_required()
def reorder_collection_recipes(collection_id):
    """Reorder recipes inside a collection."""
    try:
        user_id = get_jwt_identity()
        collection = Collection.query.get(collection_id)
        if not collection:
            return jsonify({"error": "Collection not found"}), 404

        if str(collection.owner_id) != str(user_id):
            return jsonify({"error": "Not authorized to modify this collection"}), 403

        data = request.get_json() or {}
        order_list = data.get('order') or []

        for item in order_list:
            assoc_id = item.get('association_id')
            display_order = item.get('display_order')
            if assoc_id is None or display_order is None:
                continue
                
            assoc = CollectionRecipe.query.get(assoc_id)
            if assoc and assoc.collection_id == collection.id:
                assoc.display_order = int(display_order)

        db.session.commit()

        return jsonify({"msg": "Collection reordered successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to reorder collection", "details": str(e)}), 500


############################################
#######   LIST PUBLIC COLLECTIONS    #######
############################################
@api.route('/collections/public', methods=['GET'])
def list_public_collections():
    """List public collections across the platform. Supports pagination, search, sort.
    
    Query parameters:
    - page: page number (default: 1)
    - per_page: items per page (default: 20)
    - search: search by title
    """
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search')

        query = Collection.query.filter_by(is_public=True)
        
        if search:
            query = query.filter(Collection.title.ilike(f"%{search}%"))

        paginated = query.order_by(Collection.created_at.desc()).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )

        collections = [c.serialize() for c in paginated.items]

        return jsonify({
            "collections": collections, 
            "pagination": {
                "page": page, 
                "per_page": per_page, 
                "total": paginated.total, 
                "pages": paginated.pages
            }
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to retrieve public collections", "details": str(e)}), 500


#########################################################################################
#########################################################################################
#############                      DIRECT MESSAGES                          #############
#############                     Chat & Messaging                          #############
#############                   Create, Read, Update, Delete                #############
#########################################################################################
#########################################################################################


############################################
#######       GET ALL USER CHATS     #######
############################################
@api.route('/chats', methods=['GET'])
@jwt_required()
def get_user_chats():
    """Get all chats for the current user with latest message info and unread counts."""
    
    try:
        current_user_id = get_jwt_identity()
        print(f"[DEBUG CHATS] ============ Starting get_user_chats ============")
        print(f"[DEBUG CHATS] Current user ID: {current_user_id}")
        
        # Convert to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG CHATS] Current user ID after conversion: {current_user_id}")
        
        user = User.query.get(current_user_id)
        print(f"[DEBUG CHATS] User found: {user}")
        
        if not user:
            print(f"[DEBUG CHATS] ERROR: User not found")
            return jsonify({"error": "User not found"}), 404
        
        # Get all chats for the user (both as user1 and user2)
        all_chats = user.get_all_chats()
        print(f"[DEBUG CHATS] Total chats found: {len(all_chats)}")
        
        # Include ALL chats, not just those with messages
        chats_with_info = []
        for i, chat in enumerate(all_chats):
            print(f"[DEBUG CHATS] Chat {i}: ID={chat.id}, has_messages={len(chat.messages) > 0}")
            chats_with_info.append(chat)
        
        # Sort by updated_at (most recent first)
        chats_with_info.sort(key=lambda c: c.updated_at, reverse=True)
        print(f"[DEBUG CHATS] Chats after sorting: {len(chats_with_info)}")
        
        print(f"[DEBUG CHATS] Serializing chats...")
        serialized_chats = [chat.serialize(current_user_id=current_user_id) for chat in chats_with_info]
        print(f"[DEBUG CHATS] Serialized {len(serialized_chats)} chats")
        
        total_unread = user.get_total_unread_messages()
        print(f"[DEBUG CHATS] Total unread messages: {total_unread}")
        
        response_data = {
            "chats": serialized_chats,
            "total_unread": total_unread
        }
        print(f"[DEBUG CHATS] Final response: {response_data}")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"[ERROR CHATS] Exception in get_user_chats: {str(e)}")
        import traceback
        print(f"[ERROR CHATS] Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to retrieve chats", "details": str(e)}), 500


############################################
#######      GET OR CREATE CHAT      #######
############################################
@api.route('/chat/with/<int:other_user_id>', methods=['GET'])
@jwt_required()
def get_or_create_chat(other_user_id):
    """Get existing chat with another user or create one if it doesn't exist."""
    
    try:
        current_user_id = get_jwt_identity()
        print(f"[DEBUG CHAT] ============ Starting get_or_create_chat ============")
        print(f"[DEBUG CHAT] JWT Identity: {current_user_id} (type: {type(current_user_id)})")
        print(f"[DEBUG CHAT] Other user ID: {other_user_id} (type: {type(other_user_id)})")
        
        # Convert current_user_id to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG CHAT] Current user ID after conversion: {current_user_id}")
        
        if current_user_id == other_user_id:
            print(f"[DEBUG CHAT] ERROR: User trying to chat with themselves")
            return jsonify({"error": "Cannot create chat with yourself"}), 400
        
        # Check if users exist
        current_user = User.query.get(current_user_id)
        other_user = User.query.get(other_user_id)
        
        print(f"[DEBUG CHAT] Current user query result: {current_user}")
        print(f"[DEBUG CHAT] Other user query result: {other_user}")
        print(f"[DEBUG CHAT] Current user exists: {current_user is not None}")
        print(f"[DEBUG CHAT] Other user exists: {other_user is not None}")
        
        if current_user:
            print(f"[DEBUG CHAT] Current user details: ID={current_user.id}, username={current_user.username}")
        if other_user:
            print(f"[DEBUG CHAT] Other user details: ID={other_user.id}, username={other_user.username}")
        
        if not current_user or not other_user:
            print(f"[DEBUG CHAT] ERROR: One or both users not found")
            return jsonify({"error": "User not found"}), 404
        
        # Try to find existing chat
        print(f"[DEBUG CHAT] Checking for existing chat...")
        existing_chat = current_user.get_chat_with_user(other_user_id)
        print(f"[DEBUG CHAT] Existing chat result: {existing_chat}")
        print(f"[DEBUG CHAT] Existing chat found: {existing_chat is not None}")
        
        if existing_chat:
            print(f"[DEBUG CHAT] Found existing chat with ID: {existing_chat.id}")
            print(f"[DEBUG CHAT] Chat participants: user1_id={existing_chat.user1_id}, user2_id={existing_chat.user2_id}")
            serialized_chat = existing_chat.serialize(current_user_id=current_user_id, include_messages=True)
            print(f"[DEBUG CHAT] Serialized existing chat: {serialized_chat}")
            return jsonify({
                "chat": serialized_chat
            }), 200
        
        # Create new chat if none exists
        # Always put the smaller user ID as user1 to maintain consistency
        user1_id = min(current_user_id, other_user_id)
        user2_id = max(current_user_id, other_user_id)
        
        print(f"[DEBUG CHAT] No existing chat found. Creating new chat...")
        print(f"[DEBUG CHAT] New chat participants: user1_id={user1_id}, user2_id={user2_id}")
        
        new_chat = Chat(
            user1_id=user1_id,
            user2_id=user2_id
        )
        
        print(f"[DEBUG CHAT] Chat object created: {new_chat}")
        print(f"[DEBUG CHAT] Adding to database session...")
        
        db.session.add(new_chat)
        
        print(f"[DEBUG CHAT] Committing to database...")
        db.session.commit()
        
        print(f"[DEBUG CHAT] SUCCESS: New chat created with ID: {new_chat.id}")
        print(f"[DEBUG CHAT] New chat details: user1_id={new_chat.user1_id}, user2_id={new_chat.user2_id}")
        
        serialized_new_chat = new_chat.serialize(current_user_id=current_user_id, include_messages=True)
        print(f"[DEBUG CHAT] Serialized new chat: {serialized_new_chat}")
        
        return jsonify({
            "chat": serialized_new_chat
        }), 201
        
    except Exception as e:
        print(f"[ERROR CHAT] Exception in get_or_create_chat: {str(e)}")
        print(f"[ERROR CHAT] Exception type: {type(e)}")
        import traceback
        print(f"[ERROR CHAT] Full traceback:")
        print(traceback.format_exc())
        print(f"[DEBUG CHAT] Rolling back database session...")
        db.session.rollback()
        return jsonify({"error": "Failed to get or create chat", "details": str(e)}), 500


############################################
#######      GET SINGLE CHAT         #######
############################################
@api.route('/chat/<int:chat_id>', methods=['GET'])
@jwt_required()
def get_chat(chat_id):
    """Get a specific chat with all its messages."""
    
    try:
        current_user_id = get_jwt_identity()
        print(f"[DEBUG GET_CHAT] ============ Starting get_chat ============")
        print(f"[DEBUG GET_CHAT] Chat ID: {chat_id}")
        print(f"[DEBUG GET_CHAT] Current user ID: {current_user_id} (type: {type(current_user_id)})")
        
        # Convert to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG GET_CHAT] Current user ID after conversion: {current_user_id}")
        
        chat = Chat.query.get(chat_id)
        print(f"[DEBUG GET_CHAT] Chat query result: {chat}")
        
        if not chat:
            print(f"[DEBUG GET_CHAT] ERROR: Chat not found")
            return jsonify({"error": "Chat not found"}), 404
        
        print(f"[DEBUG GET_CHAT] Chat found: ID={chat.id}, user1_id={chat.user1_id}, user2_id={chat.user2_id}")
        
        # Verify user is a participant in this chat
        is_participant_result = chat.is_participant(current_user_id)
        print(f"[DEBUG GET_CHAT] is_participant result: {is_participant_result}")
        
        if not is_participant_result:
            print(f"[DEBUG GET_CHAT] ERROR: Access denied - user {current_user_id} is not a participant")
            return jsonify({"error": "Access denied"}), 403
        
        print(f"[DEBUG GET_CHAT] SUCCESS: User is a participant, serializing chat...")
        serialized_chat = chat.serialize(current_user_id=current_user_id, include_messages=True)
        print(f"[DEBUG GET_CHAT] Serialized chat: {serialized_chat}")
        
        return jsonify({
            "chat": serialized_chat
        }), 200
        
    except Exception as e:
        print(f"[ERROR GET_CHAT] Exception in get_chat: {str(e)}")
        import traceback
        print(f"[ERROR GET_CHAT] Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to retrieve chat", "details": str(e)}), 500


############################################
#######       SEND MESSAGE           #######
############################################
""" JSON request body to send a message:
{
    "content": "Hello! How are you doing?"
}
"""
@api.route('/chat/<int:chat_id>/message', methods=['POST'])
@jwt_required()
def send_message(chat_id):
    """Send a new message in a chat."""
    
    try:
        current_user_id = get_jwt_identity()
        print(f"[DEBUG SEND_MSG] ============ Starting send_message ============")
        print(f"[DEBUG SEND_MSG] Chat ID: {chat_id}")
        print(f"[DEBUG SEND_MSG] Current user ID: {current_user_id} (type: {type(current_user_id)})")
        
        # Convert to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG SEND_MSG] Current user ID after conversion: {current_user_id}")
        
        data = request.get_json()
        print(f"[DEBUG SEND_MSG] Request data: {data}")
        
        if not data or 'content' not in data:
            print(f"[DEBUG SEND_MSG] ERROR: Missing content in request data")
            return jsonify({"error": "Message content is required"}), 400
        
        content = data.get('content', '').strip()
        print(f"[DEBUG SEND_MSG] Message content: '{content}'")
        print(f"[DEBUG SEND_MSG] Content length: {len(content)}")
        
        if not content:
            print(f"[DEBUG SEND_MSG] ERROR: Empty content after strip")
            return jsonify({"error": "Message content cannot be empty"}), 400
        
        chat = Chat.query.get(chat_id)
        print(f"[DEBUG SEND_MSG] Chat query result: {chat}")
        
        if not chat:
            print(f"[DEBUG SEND_MSG] ERROR: Chat not found")
            return jsonify({"error": "Chat not found"}), 404
        
        print(f"[DEBUG SEND_MSG] Chat found: ID={chat.id}, user1_id={chat.user1_id}, user2_id={chat.user2_id}")
        
        # Verify user is a participant in this chat
        is_participant_result = chat.is_participant(current_user_id)
        print(f"[DEBUG SEND_MSG] is_participant result: {is_participant_result}")
        
        if not is_participant_result:
            print(f"[DEBUG SEND_MSG] ERROR: Access denied - user not a participant")
            return jsonify({"error": "Access denied"}), 403
        
        print(f"[DEBUG SEND_MSG] Creating new message...")
        
        # Create new message
        new_message = Message(
            chat_id=chat_id,
            sender_id=current_user_id,
            content=content
        )
        
        print(f"[DEBUG SEND_MSG] Message object created: {new_message}")
        print(f"[DEBUG SEND_MSG] Adding message to session...")
        
        db.session.add(new_message)
        
        print(f"[DEBUG SEND_MSG] Updating chat timestamp...")
        
        # Update chat's updated_at timestamp
        chat.updated_at = datetime.now()
        
        print(f"[DEBUG SEND_MSG] Committing to database...")
        
        db.session.commit()
        
        print(f"[DEBUG SEND_MSG] SUCCESS: Message saved with ID: {new_message.id}")
        print(f"[DEBUG SEND_MSG] Serializing message...")
        
        serialized_message = new_message.serialize()
        print(f"[DEBUG SEND_MSG] Serialized message: {serialized_message}")
        
        # Emit WebSocket event to notify other users in the chat
        print(f"[DEBUG SEND_MSG] Emitting WebSocket event for new message...")
        emit_new_message(chat_id, serialized_message)
        
        return jsonify({
            "message": serialized_message
        }), 201
        
    except Exception as e:
        print(f"[ERROR SEND_MSG] Exception in send_message: {str(e)}")
        print(f"[ERROR SEND_MSG] Exception type: {type(e)}")
        import traceback
        print(f"[ERROR SEND_MSG] Full traceback:")
        print(traceback.format_exc())
        print(f"[DEBUG SEND_MSG] Rolling back database session...")
        db.session.rollback()
        return jsonify({"error": "Failed to send message", "details": str(e)}), 500


############################################
#######      MARK MESSAGES AS READ   #######
############################################
@api.route('/chat/<int:chat_id>/mark-read', methods=['PUT'])
@jwt_required()
def mark_messages_as_read(chat_id):
    """Mark all unread messages in a chat as read for the current user."""
    
    try:
        current_user_id = get_jwt_identity()
        print(f"[DEBUG MARK_READ] ============ Starting mark_messages_as_read ============")
        print(f"[DEBUG MARK_READ] Chat ID: {chat_id}")
        print(f"[DEBUG MARK_READ] Current user ID: {current_user_id}")
        
        # Convert to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG MARK_READ] Current user ID after conversion: {current_user_id}")
        
        chat = Chat.query.get(chat_id)
        print(f"[DEBUG MARK_READ] Chat found: {chat}")
        
        if not chat:
            print(f"[DEBUG MARK_READ] ERROR: Chat not found")
            return jsonify({"error": "Chat not found"}), 404
        
        # Verify user is a participant in this chat
        is_participant_result = chat.is_participant(current_user_id)
        print(f"[DEBUG MARK_READ] is_participant result: {is_participant_result}")
        
        if not is_participant_result:
            print(f"[DEBUG MARK_READ] ERROR: Access denied")
            return jsonify({"error": "Access denied"}), 403
        
        # Find all unread messages in this chat that were not sent by current user
        unread_messages = Message.query.filter(
            Message.chat_id == chat_id,
            Message.sender_id != current_user_id,
            Message.is_read == False
        ).all()
        
        print(f"[DEBUG MARK_READ] Found {len(unread_messages)} unread messages")
        for i, msg in enumerate(unread_messages):
            print(f"[DEBUG MARK_READ] Message {i}: ID={msg.id}, sender_id={msg.sender_id}, is_read={msg.is_read}")
        
        # Mark all as read
        for message in unread_messages:
            print(f"[DEBUG MARK_READ] Marking message {message.id} as read")
            message.mark_as_read()
        
        print(f"[DEBUG MARK_READ] Committing changes...")
        db.session.commit()
        print(f"[DEBUG MARK_READ] SUCCESS: Marked {len(unread_messages)} messages as read")
        
        # Emit WebSocket event to notify other users that messages have been read
        if len(unread_messages) > 0:
            print(f"[DEBUG MARK_READ] Emitting WebSocket event for messages read...")
            emit_messages_read(chat_id, current_user_id)
        
        return jsonify({
            "message": f"Marked {len(unread_messages)} messages as read",
            "marked_count": len(unread_messages)
        }), 200
        
    except Exception as e:
        print(f"[ERROR MARK_READ] Exception in mark_messages_as_read: {str(e)}")
        import traceback
        print(f"[ERROR MARK_READ] Traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({"error": "Failed to mark messages as read", "details": str(e)}), 500


############################################
#######      UPDATE MESSAGE          #######
############################################
""" JSON request body to update a message:
{
    "content": "Updated message content here"
}
"""
@api.route('/message/<int:message_id>', methods=['PUT'])
@jwt_required()
def update_message(message_id):
    """Update a message (only the sender can edit their own messages)."""
    
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({"error": "Message content is required"}), 400
        
        content = data.get('content', '').strip()
        if not content:
            return jsonify({"error": "Message content cannot be empty"}), 400
        
        message = Message.query.get(message_id)
        if not message:
            return jsonify({"error": "Message not found"}), 404
        
        # Only the sender can edit their message
        if message.sender_id != current_user_id:
            return jsonify({"error": "You can only edit your own messages"}), 403
        
        # Update message content
        message.content = content
        message.mark_as_edited()
        
        db.session.commit()
        
        return jsonify({
            "message": message.serialize()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update message", "details": str(e)}), 500


############################################
#######      DELETE MESSAGE          #######
############################################
@api.route('/message/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """Delete a message (only the sender can delete their own messages)."""
    
    try:
        current_user_id = get_jwt_identity()
        
        message = Message.query.get(message_id)
        if not message:
            return jsonify({"error": "Message not found"}), 404
        
        # Only the sender can delete their message
        if message.sender_id != current_user_id:
            return jsonify({"error": "You can only delete your own messages"}), 403
        
        chat_id = message.chat_id
        
        db.session.delete(message)
        db.session.commit()
        
        return jsonify({"message": "Message deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete message", "details": str(e)}), 500


############################################
#######   GET UNREAD MESSAGE COUNT   #######
############################################
@api.route('/messages/unread-count', methods=['GET'])
@jwt_required()
def get_unread_message_count():
    """Get the total count of unread messages for the current user."""
    
    try:
        current_user_id = get_jwt_identity()
        print(f"[DEBUG UNREAD_COUNT] ============ Starting get_unread_message_count ============")
        print(f"[DEBUG UNREAD_COUNT] Current user ID: {current_user_id}")
        
        # Convert to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG UNREAD_COUNT] Current user ID after conversion: {current_user_id}")
        
        user = User.query.get(current_user_id)
        print(f"[DEBUG UNREAD_COUNT] User found: {user}")
        
        if not user:
            print(f"[DEBUG UNREAD_COUNT] ERROR: User not found")
            return jsonify({"error": "User not found"}), 404
        
        total_unread = user.get_total_unread_messages()
        print(f"[DEBUG UNREAD_COUNT] Total unread messages: {total_unread}")
        
        return jsonify({
            "unread_count": total_unread
        }), 200
        
    except Exception as e:
        print(f"[ERROR UNREAD_COUNT] Exception in get_unread_message_count: {str(e)}")
        import traceback
        print(f"[ERROR UNREAD_COUNT] Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to get unread message count", "details": str(e)}), 500


############################################
#######      DELETE CHAT             #######
############################################
@api.route('/chat/<int:chat_id>', methods=['DELETE'])
@jwt_required()
def delete_chat(chat_id):
    """Delete a chat (only participants can delete)."""
    
    try:
        current_user_id = get_jwt_identity()
        print(f"[DEBUG DELETE_CHAT] ============ Starting delete_chat ============")
        print(f"[DEBUG DELETE_CHAT] Chat ID: {chat_id}")
        print(f"[DEBUG DELETE_CHAT] Current user ID: {current_user_id}")
        
        # Convert to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG DELETE_CHAT] Current user ID after conversion: {current_user_id}")
        
        chat = Chat.query.get(chat_id)
        print(f"[DEBUG DELETE_CHAT] Chat found: {chat}")
        
        if not chat:
            print(f"[DEBUG DELETE_CHAT] ERROR: Chat not found")
            return jsonify({"error": "Chat not found"}), 404
        
        print(f"[DEBUG DELETE_CHAT] Chat details: ID={chat.id}, user1_id={chat.user1_id}, user2_id={chat.user2_id}")
        
        # Verify user is a participant in this chat
        is_participant_result = chat.is_participant(current_user_id)
        print(f"[DEBUG DELETE_CHAT] is_participant result: {is_participant_result}")
        
        if not is_participant_result:
            print(f"[DEBUG DELETE_CHAT] ERROR: Access denied")
            return jsonify({"error": "Access denied"}), 403
        
        print(f"[DEBUG DELETE_CHAT] Deleting chat from database...")
        db.session.delete(chat)
        
        print(f"[DEBUG DELETE_CHAT] Committing changes...")
        db.session.commit()
        
        print(f"[DEBUG DELETE_CHAT] SUCCESS: Chat deleted successfully")
        
        # Emit WebSocket event to notify other users that the chat has been deleted
        print(f"[DEBUG DELETE_CHAT] Emitting WebSocket event for chat deletion...")
        emit_chat_deleted(chat_id, current_user_id)
        
        return jsonify({"message": "Chat deleted successfully"}), 200
        
    except Exception as e:
        print(f"[ERROR DELETE_CHAT] Exception in delete_chat: {str(e)}")
        import traceback
        print(f"[ERROR DELETE_CHAT] Traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({"error": "Failed to delete chat", "details": str(e)}), 500