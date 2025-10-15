"""
Follow routes for TasteBook API.
Handles follow/unfollow functionality and follow status checks.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_

from api.models import db, User, Follow


follow_bp = Blueprint('follow', __name__)



############################################
#######            NEW               #######
#######         USER FOLLOW          #######
############################################
@follow_bp.route('/follow/<int:user_id>', methods=['POST'])
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
            follower_id = current_user_id,
            followed_id = user_id
        ).first()
        
        if existing_follow:
            return jsonify({"error": "You are already following this user"}), 400
        
        # Create new follow relationship
        new_follow = Follow(
            follower_id = current_user_id,
            followed_id = user_id
        )
        
        db.session.add(new_follow)
        db.session.commit()
        
        # Get updated counts
        followers_count = Follow.query.filter_by(followed_id=user_id).count()
        following_count = Follow.query.filter_by(follower_id=current_user_id).count()
        
        return jsonify({
            "msg":            f"You are now following {target_user.username}",
            "follow_id":       new_follow.id,
            "followers_count": followers_count,
            "following_count": following_count,
            "is_following":    True
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error following user", "details": str(e)}), 500



############################################
#######             CHECK            #######
#######         FOLLOW STATUS        #######
############################################
@follow_bp.route('/follow/status/<int:user_id>', methods=['GET'])
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
            follower_id = current_user_id,
            followed_id = user_id
        ).first() is not None
        
        # Get follow counts
        followers_count = Follow.query.filter_by(followed_id=user_id).count()
        following_count = Follow.query.filter_by(follower_id=user_id).count()
        
        return jsonify({
            "is_following":    is_following,
            "followers_count": followers_count,
            "following_count": following_count,
            "target_user": {
                "user_id":   target_user.id,
                "username":  target_user.username,
                "full_name": target_user.full_name
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Error checking follow status", "details": str(e)}), 500
    


   
############################################
#######           UNFOLLOW           #######
#######             USER             #######
############################################
@follow_bp.route('/follow/<int:user_id>', methods=['DELETE'])
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
            "msg":             f"You have unfollowed {target_user.username}",
            "followers_count": followers_count,
            "following_count": following_count,
            "is_following":    False
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error unfollowing user", "details": str(e)}), 500
