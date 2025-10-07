import os
from flask_admin import Admin
from .models import db, User, Recipe, RecipeImage, Follow, Comment, Like, CommentLike
from flask_admin.contrib.sqla import ModelView

"""
Check the "FLASK_ADMIN_SWATCH" themes at https://bootswatch.com/3/ 
    
All available themes:
    cerulean
    cosmo
    cyborg
    darkly
    flatly
    journal
    lumen
    paper
    readable
    sandstone
    simplex
    slate
    spacelab
    superhero
    united
    yeti

Dark ones:
    'darkly'    - Clean dark theme
    'cyborg'    - Dark with cyan accents
    'slate'     - Dark gray theme
    'superhero' - Dark blue theme
"""


def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    app.config['FLASK_ADMIN_SWATCH'] = 'cyborg' # Choose your theme here
    admin = Admin(app, name='TasteBook Admin', template_mode='bootstrap3')

    
    # Custom ModelView for User
    class UserAdmin(ModelView):
        column_list  = ['id', 'email', 'username', 'full_name', 'plain_psswrd', 'hashed_psswrd', 'description', 'country', 'is_active', 'cloudinary_url', 'cloudinary_img_id', 'created_at']
        form_columns = [      'email', 'username', 'full_name', 'plain_psswrd', 'hashed_psswrd', 'description', 'country', 'is_active', 'cloudinary_url', 'cloudinary_img_id']
        
        column_searchable_list = ['email', 'username', 'full_name', 'country']
        column_filters = ['is_active', 'country', 'created_at']


    # Custom ModelView for Recipe
    class RecipeAdmin(ModelView):
        column_list  = ['id', 'author_id', 'title', 'description', 'ingredients', 'instructions', 'created_at']
        form_columns = [      'author_id', 'title', 'description', 'ingredients', 'instructions']

        column_searchable_list = ['title', 'description']
        column_filters = ['author_id', 'created_at']


    # Custom ModelView for RecipeImage
    class RecipeImageAdmin(ModelView):
        column_list  = ['id', 'recipe_id', 'url', 'image_id', 'is_primary', 'display_order', 'uploaded_at']
        form_columns = [      'recipe_id', 'url', 'image_id', 'is_primary', 'display_order']

        column_searchable_list = ['image_id']
        column_filters = ['recipe_id', 'is_primary', 'uploaded_at']


    # Custom ModelView for Follow
    class FollowAdmin(ModelView):
        column_list  = ['id', 'follower_id', 'followed_id', 'created_at']
        form_columns = [      'follower_id', 'followed_id']

        column_filters = ['follower_id', 'followed_id', 'created_at']


    # Custom ModelView for Comment
    class CommentAdmin(ModelView):
        column_list  = ['id', 'user_id', 'recipe_id', 'parent_comment_id', 'content', 'created_at', 'is_edited', 'is_pinned']
        form_columns = [      'user_id', 'recipe_id', 'parent_comment_id', 'content', 'is_edited',  'is_pinned']

        column_searchable_list = ['content']
        column_filters = ['user_id', 'recipe_id', 'parent_comment_id', 'created_at', 'is_edited', 'is_pinned']


    # Custom ModelView for Recipe Like
    class LikeAdmin(ModelView):
        column_list  = ['id', 'user_id', 'recipe_id', 'created_at']
        form_columns = [      'user_id', 'recipe_id']

        column_filters = ['user_id', 'recipe_id', 'created_at']


    # Custom ModelView for Comment Like
    class CommentLikeAdmin(ModelView):
        column_list  = ['id', 'user_id', 'comment_id', 'created_at']
        form_columns = [      'user_id', 'comment_id']

        column_filters = ['user_id', 'comment_id', 'created_at']


    # Add all views to admin
    admin.add_view( UserAdmin        ( User,        db.session))
    admin.add_view( RecipeAdmin      ( Recipe,      db.session))
    admin.add_view( RecipeImageAdmin ( RecipeImage, db.session))
    admin.add_view( FollowAdmin      ( Follow,      db.session))
    admin.add_view( CommentAdmin     ( Comment,     db.session))
    admin.add_view( LikeAdmin        ( Like,        db.session))
    admin.add_view( CommentLikeAdmin ( CommentLike, db.session))

