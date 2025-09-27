"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Recipe, RecipeImage, Follow
from api.utils import generate_sitemap, APIException
from flask_cors import CORS


# import datetime
from datetime import datetime, date, timedelta
from decimal import Decimal


from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired


# Register the blueprint
api = Blueprint('api', __name__)
# app.register_blueprint(api, url_prefix='/api')  ---> THIS IS IN "app.py"


##################################################
### CORS implementation
CORS(api) # Allow CORS requests to this API
##################################################

# Configure JWT ??? ---> this is configured in "app.py"


##################################################
# Cloudinary configuration

import cloudinary
import cloudinary.uploader
import cloudinary.api

cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key    = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET'),
    secure     = True
)
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


        # Generate access token (with expiration)
        access_token = create_access_token(
            identity=str(user.id),  # User identity (you can use ID or email)
            expires_delta=timedelta(hours=24)  # Token expiration
        )

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
        
        # Get recipe data with author info
        recipe_data = recipe.serialize()
        
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
        
        # Ensure reasonable limits
        limit = min(limit, 100)  # Max 100 recipes per request
        
        # Get recipes with pagination
        recipes_query = Recipe.query.order_by(Recipe.created_at.desc()).offset(offset).limit(limit)
        recipes = recipes_query.all()
        
        # Get total count for pagination
        total_count = Recipe.query.count()
        
        recipes_data = []
        for recipe in recipes:
            recipe_data = recipe.serialize()
            
            # Add author information
            author = User.query.get(recipe.author_id)
            if author:
                recipe_data['author'] = {
                    'user_id': author.id,
                    'username': author.username,
                    'full_name': author.full_name,
                    'cloudinary_url': author.cloudinary_url
                }
            
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