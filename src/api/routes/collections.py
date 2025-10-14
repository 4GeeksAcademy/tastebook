"""
Collection routes for TasteBook API.
Handles collection CRUD operations and recipe management within collections.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from api.models import db, User, Recipe, Collection, CollectionRecipe


collections_bp = Blueprint('collections', __name__)


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
@collections_bp.route('/collection', methods=['POST'])
@jwt_required()
def create_collection():
    """Create a new collection for the authenticated user."""

    try:
        user_id = get_jwt_identity()
        user    = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json() or {}

        title       = data.get('title')
        description = data.get('description')
        is_public   = data.get('is_public', False)

        if not title:
            return jsonify({"error": "Title is required"}), 400

        collection = Collection(
            owner_id    = user.id,
            title       = title,
            description = description,
            is_public   = bool(is_public)
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
@collections_bp.route('/user/collections', methods=['GET'])
@jwt_required()
def get_user_collections():
    """Get all collections for the authenticated user (private + public).
    
    Query parameters:
    - public_only:   true/false (default: false)
    - private_only:  true/false (default: false)
    - search:        search by title
    - sort_by:       created_at/title (default: created_at)
    - order:         asc/desc (default: desc)
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Optional query params: public_only, private_only, search, sort_by
        public_only  = request.args.get('public_only')
        private_only = request.args.get('private_only')
        search       = request.args.get('search')
        sort_by      = request.args.get('sort_by', 'created_at')
        order        = request.args.get('order', 'desc')

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



###############################################
#######   GET PUBLIC USER COLLECTIONS   #######
###############################################
@collections_bp.route('/user/<string:username>/collections', methods=['GET'])
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



###############################################
#######       GET SINGLE COLLECTION     #######
###############################################
@collections_bp.route('/collection/<int:collection_id>', methods=['GET'])
def get_collection(collection_id):
    """Get a single collection. If private, only owner may access.
    
    Query parameters:
    - include_recipes: true/false (default: false)
    """
    try:
        collection = Collection.query.get(collection_id)
        if not collection:
            return jsonify({"error": "Collection not found"}), 404

        # If private, require owner or jwt
        if not collection.is_public:
            # Get current user ID from JWT if available
            current_user_id = None
            try:
                # Import JWT functions at the call site to avoid issues
                from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
                
                # Check if JWT is present in request
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                
            except Exception as jwt_error:
                return jsonify({"error": "Authentication required for private collection"}), 401
            
            if not current_user_id:
                return jsonify({"error": "Collection is private"}), 403
                
            # Convert both to int for comparison
            try:
                collection_owner_int = int(collection.owner_id)
                current_user_int = int(current_user_id)
                
                if collection_owner_int != current_user_int:
                    return jsonify({"error": "Collection is private"}), 403
                    
            except (ValueError, TypeError) as convert_error:
                return jsonify({"error": "Authentication error"}), 403
        
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
                include_recipes = include_recipes, 
                current_user_id = current_user_id
            )
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to retrieve collection", "details": str(e)}), 500



############################################
#######     UPDATE COLLECTION        #######
############################################
""" JSON request body to update a collection:
{
    "title":       "Updated Collection Name",  // optional
    "description": "Updated description",      // optional
    "is_public":    false                      // optional
}
"""
@collections_bp.route('/collection/<int:collection_id>', methods=['PUT'])
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
@collections_bp.route('/collection/<int:collection_id>', methods=['DELETE'])
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
@collections_bp.route('/collection/<int:collection_id>/add-recipe', methods=['POST'])
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
            collection_id = collection.id, 
            recipe_id     = recipe.id
        ).first()
        
        if existing:
            return jsonify({"msg": "Recipe already in collection"}), 200

        assoc = CollectionRecipe(
            collection_id = collection.id, 
            recipe_id     = recipe.id, 
            display_order = display_order
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
@collections_bp.route('/collection/<int:collection_id>/remove-recipe', methods=['POST'])
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
#######  REORDER COLLECTION RECIPES  #######
############################################
""" JSON request body to reorder recipes in collection:
{
    "order": [
        {"association_id": 1,  "display_order": 0},
        {"association_id": 3,  "display_order": 1},
        {"association_id": 2,  "display_order": 2}
    ]
}
"""
@collections_bp.route('/collection/<int:collection_id>/reorder', methods=['PUT'])
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
@collections_bp.route('/collections/public', methods=['GET'])
def list_public_collections():
    """List public collections across the platform. Supports pagination, search, sort.
    
    Query parameters:
    - page:      page number (default: 1)
    - per_page:  items per page (default: 20)
    - search:    search by title
    """
    try:
        page     = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search   = request.args.get('search')

        query = Collection.query.filter_by(is_public=True)
        
        if search:
            query = query.filter(Collection.title.ilike(f"%{search}%"))

        paginated = query.order_by(Collection.created_at.desc()).paginate(
            page      = page, 
            per_page  = per_page, 
            error_out = False
        )

        collections = [c.serialize() for c in paginated.items]

        return jsonify({
            "collections": collections, 
            "pagination": {
                "page":     page, 
                "per_page": per_page, 
                "total":    paginated.total, 
                "pages":    paginated.pages
            }
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to retrieve public collections", "details": str(e)}), 500