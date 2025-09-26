import os
from flask_admin import Admin
from .models import db, User, Recipe
from flask_admin.contrib.sqla import ModelView


def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'
    admin = Admin(app, name='TasteBook', template_mode='bootstrap3')

    
    # Custom ModelView for User to show plain password
    class UserAdmin(ModelView):
        column_list = [
            'id', 'email', 'username', 'full_name', 'plain_psswrd', 'profile_url', 'is_active', 'created_at', 'cloudinary_url', 'cloudinary_img_id'
        ]
        column_searchable_list = [
                  'email', 'username', 'full_name']
        
        column_filters = ['is_active']

    admin.add_view(UserAdmin(User, db.session))
    admin.add_view(ModelView(Recipe, db.session))


    # You can duplicate that line to add mew models
    # admin.add_view(ModelView(YourModelName, db.session))