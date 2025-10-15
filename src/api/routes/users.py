"""
User routes for TasteBook API.
Handles user profiles, settings, follow/unfollow functionality.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_

from api.models import db, User, Recipe, RecipeImage, Follow

from api.countries import REGIONS


users_bp = Blueprint('users', __name__)



#################################################################
#################################################################
#############                                       #############
#############               PUBLIC                  #############
#############              USER Info                #############
#############             and Profiles              #############
#############                                       #############
#################################################################
#################################################################


############################################
#######        GET ALL USERS         #######
############################################
@users_bp.route('/users', methods=['GET'])
def get_all_users():
    """
    Get all users with basic information and recipe counts.
    Supports pagination with limit and offset parameters.
    Supports search by username and sorting by recipe count.
    """
    try:
        # Get pagination parameters
        limit  = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Get search parameters
        search     = request.args.get('search',     '',           type=str).strip()
        country    = request.args.get('country',    '',           type=str).strip()
        region     = request.args.get('region',     '',           type=str).strip()
        sort_by    = request.args.get('sort_by',    'created_at', type=str)  # created_at, recipes_count, followers_count, username
        sort_order = request.args.get('sort_order', 'desc',       type=str)  # asc, desc
        
        # Ensure reasonable limits
        limit = min(limit, 100)  # Max 100 users per request
        
        # Start with base query for active users only
        query = User.query.filter(User.is_active == True)
        
        # Apply search filter if provided
        if search:
            query = query.filter(User.username.ilike(f'%{search}%'))
        
        # Apply country filter if provided
        if country:
            query = query.filter(User.country.op('->>')('code') == country)
            
        # Apply region filter if provided (requires importing the regions mapping)
        if region:
            # Get country codes for the specified region
            region_countries = [country['code'] for country in REGIONS.get(region, {}).get('countries', [])]
            
            if region_countries:
                query = query.filter(User.country.op('->>')('code').in_(region_countries))
        
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
                'id':              user.id,
                'username':        user.username,
                'full_name':       user.full_name,
                'country':         user.country,
                'cloudinary_url':  user.cloudinary_url,
                'created_at':      user.created_at.isoformat() if user.created_at else None,
                'recipes_count':   len(user.recipes),
                'followers_count': len(user.follower_relationships),
                'following_count': len(user.following_relationships)
            }
            users_data.append(user_data)
        
        return jsonify({
            "msg": "Users retrieved successfully",
            "users": users_data,
            "pagination": {
                "total":    total_count,
                "limit":    limit,
                "offset":   offset,
                "has_more": offset + limit < total_count
            },
            "filters": {
                "search":     search,
                "sort_by":    sort_by,
                "sort_order": sort_order
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Error fetching users", "details": str(e)}), 500



############################################
#######      USER PUBLIC PROFILE     #######
############################################
@users_bp.route('/user/<string:username>', methods=['GET'])
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
        limit  = request.args.get('limit', 12, type=int)
        offset = request.args.get('offset', 0, type=int)
        limit  = min(limit, 50)  # Max 50 recipes per request
        
        # Get recipes ordered by creation date (newest first)
        recipes_query = Recipe.query.filter_by(author_id=user.id).order_by(Recipe.created_at.desc())
        
        total_recipes = recipes_query.count()
        recipes       = recipes_query.offset(offset).limit(limit).all()
        
        # Serialize recipes with their primary images
        recipes_data = []
        for recipe in recipes:
            recipe_data = recipe.serialize()
            
            # Add primary image
            primary_image = RecipeImage.query.filter_by(
                recipe_id  = recipe.id, 
                is_primary = True
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
            'user_id':        user.id,  # Changed from 'id' to 'user_id' for consistency
            'username':       user.username,
            'full_name':      user.full_name,
            'description':    user.description,
            'country':        user.country,
            'cloudinary_url': user.cloudinary_url,
            'created_at':     user.created_at.isoformat() if user.created_at else None,
            'stats': {
                'recipes_count':   total_recipes,
                'followers_count': len(user.follower_relationships),
                'following_count': len(user.following_relationships),
                'total_likes':     0,   # TODO: Implement when like system is added
            },
            'recipes': recipes_data,
            'pagination': {
                'total':    total_recipes,
                'limit':    limit,
                'offset':   offset,
                'has_more': offset + limit < total_recipes
            }
        }
        
        return jsonify({
            "msg": "User profile retrieved successfully",
            "user": profile_data
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Error fetching user profile", "details": str(e)}), 500




#################################################################
#################################################################
#############                                       #############
#############               PRIVATE                 #############
#############             USER Profile              #############
#############             and Settings              #############
#############                                       #############
#################################################################
#################################################################


############################################
#######             USER             #######
#######        Private Profile       #######
#######           Settings           #######
#######        [GET] user data       #######
############################################
@users_bp.route('/settings', methods=['GET'])
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
@users_bp.route('/settings', methods=['PUT'])
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
            
            user.plain_psswrd  = data["password"]
            user.hashed_psswrd = generate_password_hash(data['password'])
        
        # Save changes to database
        db.session.commit()

        return jsonify({
            'msg':  'Profile updated successfully.',
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
@users_bp.route('/user/description', methods=['PUT'])
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

