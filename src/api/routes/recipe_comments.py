"""
Comment routes for TasteBook API.
Handles comment CRUD operations and comment likes/pins.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from api.models import db, User, Recipe, RecipeComment, CommentLike


recipe_comments_bp = Blueprint('recipe_comments', __name__)



############################################
#######   GET COMMENTS FOR RECIPE    #######
############################################
@recipe_comments_bp.route('/recipe/<int:recipe_id>/comments', methods=['GET'])
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
        limit      = request.args.get('limit',       20,    type=int)
        offset     = request.args.get('offset',      0,     type=int)
        sort_by    = request.args.get('sort_by',    'date', type=str)  # date, likes
        sort_order = request.args.get('sort_order', 'desc', type=str)  # asc, desc
        
        # Ensure reasonable limits
        limit = min(limit, 100)  # Max 100 comments per request
        
        # Get current user ID if authenticated (for like status)
        current_user_id = None
        try:
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
                non_pinned_query = non_pinned_query.order_by(db.func.count(CommentLike.id).desc(), RecipeComment.created_at.desc())
            else:
                non_pinned_query = non_pinned_query.order_by(db.func.count(CommentLike.id).asc(), RecipeComment.created_at.asc())
        else:  # default to date
            if sort_order == 'desc':
                non_pinned_query = non_pinned_query.order_by(RecipeComment.created_at.desc())
            else:
                non_pinned_query = non_pinned_query.order_by(RecipeComment.created_at.asc())
        
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
                "total":    total_non_pinned + (1 if pinned_comment else 0),
                "limit":    limit,
                "offset":   offset,
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
    "content": "This recipe looks amazing!",
    "parent_comment_id": null                  // optional, for replies
}
"""
@recipe_comments_bp.route('/recipe/<int:recipe_id>/comments', methods=['POST'])
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
        data              = request.get_json()
        content           = data.get("content", "").strip()
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
            
            # Prevent nested replies (only one level of nesting allowed)
            if parent_comment.parent_comment_id is not None:
                return jsonify({"error": "Cannot reply to a reply. Only one level of nesting allowed"}), 400
        
        # Create new comment
        new_comment = RecipeComment(
            user_id           = current_user_id,
            recipe_id         = recipe_id,
            parent_comment_id = parent_comment_id,
            content           = content,
            is_edited         = False,
            is_pinned         = False
        )
        
        # Save to database
        db.session.add(new_comment)
        db.session.commit()
        
        # Return the created comment with full serialization
        comment_data = new_comment.serialize(include_replies=False, current_user_id=current_user_id)
        
        return jsonify({
            "msg":    "Comment created successfully",
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
@recipe_comments_bp.route('/comment/<int:comment_id>', methods=['PUT'])
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
            "msg":    "Comment updated successfully",
            "comment": comment_data
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error updating comment", "details": str(e)}), 500



############################################
#######       DELETE COMMENT         #######
############################################
@recipe_comments_bp.route('/comment/<int:comment_id>', methods=['DELETE'])
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
            "msg":                  "Comment deleted successfully",
            "deleted_comment_id":    comment_id,
            "deleted_replies_count": replies_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error deleting comment", "details": str(e)}), 500



############################################
#######       LIKE/UNLIKE COMMENT    #######
############################################
@recipe_comments_bp.route('/comment/<int:comment_id>/like', methods=['POST'])
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
            
            action   = "unliked"
            is_liked = False
        else:
            # Like the comment
            new_like = CommentLike(
                user_id    = current_user_id,
                comment_id = comment_id
            )
            db.session.add(new_like)
            db.session.commit()
            
            action   = "liked"
            is_liked = True
        
        # Get updated like count
        like_count = CommentLike.query.filter_by(comment_id=comment_id).count()
        
        return jsonify({
            "msg":        f"Comment {action} successfully",
            "is_liked":   is_liked,
            "like_count": like_count,
            "comment_id": comment_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error toggling comment like", "details": str(e)}), 500



############################################
#######      PIN/UNPIN COMMENT       #######
############################################
@recipe_comments_bp.route('/comment/<int:comment_id>/pin', methods=['PUT'])
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
                recipe_id         = comment.recipe_id,
                is_pinned         = True,
                parent_comment_id = None
            ).first()
            
            if current_pinned:
                current_pinned.is_pinned = False
            
            # Pin this comment
            comment.is_pinned = True
            action            = "pinned"
        
        # Save to database
        db.session.commit()
        
        # Return updated comment
        comment_data = comment.serialize(include_replies=False, current_user_id=current_user_id)
        
        return jsonify({
            "msg":     f"Comment {action} successfully",
            "comment":   comment_data,
            "is_pinned": comment.is_pinned
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error toggling comment pin", "details": str(e)}), 500