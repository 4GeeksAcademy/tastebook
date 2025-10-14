"""
Like routes for TasteBook API.
Handles recipe like/unlike functionality.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_

from api.models import db, User, Recipe, RecipeLike

# Create likes blueprint
likes_bp = Blueprint('likes', __name__)


##############################################
### Toggle like/unlike for a recipe
##############################################

@likes_bp.route('/recipe/<int:recipe_id>/like', methods=['POST'])
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
            new_like = RecipeLike()
            new_like.user_id = current_user_id
            new_like.recipe_id = recipe_id
            db.session.add(new_like)
            action = "liked"
            is_liked = True
            
        
        # Save to database
        db.session.commit()
        
        # Get updated like count
        updated_recipe = Recipe.query.get(recipe_id)
        like_count = updated_recipe.like_count if updated_recipe else 0
        
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

@likes_bp.route('/user/liked-recipes', methods=['GET'])
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
        paginated_recipes = query.paginate(  # type: ignore
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

@likes_bp.route('/recipe/<int:recipe_id>/like-info', methods=['GET'])
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