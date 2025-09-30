"""
Recipe routes for TasteBook API.
Handles recipe CRUD operations and recipe-related functionality.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from decimal import Decimal

from api.models import db, User, Recipe, RecipeImage

# Create recipes blueprint
recipes_bp = Blueprint('recipes', __name__)


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

@recipes_bp.route('/new-recipe', methods=['POST'])
@recipes_bp.route('/recipe', methods=['POST'])  # Alternative endpoint for frontend
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


############################################
#######        GET SINGLE RECIPE     #######
############################################
@recipes_bp.route('/recipe/<int:recipe_id>', methods=['GET'])
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

@recipes_bp.route('/recipe/<int:recipe_id>', methods=['PUT'])
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
@recipes_bp.route('/recipes', methods=['GET'])
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