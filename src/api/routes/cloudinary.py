"""
Cloudinary routes for TasteBook API.
Handles image upload, deletion, and management for users and recipes.
"""

import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

import cloudinary
import cloudinary.uploader
import cloudinary.api

from api.models import db, User, Recipe, RecipeImage

# Configure Cloudinary
cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key    = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET'),
    secure     = True
)

# Create cloudinary blueprint
cloudinary_bp = Blueprint('cloudinary', __name__)


# =============================
#   USER PROFILE IMAGE UPLOAD
# =============================
@cloudinary_bp.route('/user/upload-image', methods=['POST'])
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
@cloudinary_bp.route('/user/delete-image', methods=['DELETE'])
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
@cloudinary_bp.route('/recipe/<int:recipe_id>/upload-image', methods=['POST'])
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
@cloudinary_bp.route('/recipe/temp/upload-image', methods=['POST'])
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
@cloudinary_bp.route('/recipe/<int:recipe_id>/associate-temp-images', methods=['POST'])
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
@cloudinary_bp.route('/recipe/<int:recipe_id>/image/<int:image_id>/set-primary', methods=['PUT'])
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
@cloudinary_bp.route('/recipe/<int:recipe_id>/image/<int:image_id>', methods=['DELETE'])
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
@cloudinary_bp.route('/recipe/<int:recipe_id>/reorder-images', methods=['PUT'])
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
@cloudinary_bp.route('/recipe/<int:recipe_id>/images', methods=['GET'])
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