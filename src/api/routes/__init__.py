"""
Routes module initialization.
This module sets up all the route blueprints and handles CORS configuration.
"""

from flask import Blueprint, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import User

# Import all route modules

from .admin_access     import admin_access_bp
# --
from .auth             import auth_bp
# --
from .users            import users_bp
from .follow           import follow_bp
# --
from .cloudinary       import cloudinary_bp
# --
from .recipe_likes     import recipe_likes_bp
from .recipe_comments  import recipe_comments_bp
# --
from .collections      import collections_bp
# --
from .messaging        import messaging_bp
# --
from .recipes          import recipes_bp
# ------------- END OF IMPORTS --------------



# Create the main API blueprint
api = Blueprint('api', __name__)

# Enable CORS for the API
CORS(api)

# Register all sub-blueprints
api.register_blueprint( admin_access_bp    )

api.register_blueprint( auth_bp            )
api.register_blueprint( users_bp           )
api.register_blueprint( follow_bp          )

api.register_blueprint( cloudinary_bp      )

api.register_blueprint( recipes_bp         )
api.register_blueprint( recipe_comments_bp )
api.register_blueprint( recipe_likes_bp    )

api.register_blueprint( collections_bp     )

api.register_blueprint( messaging_bp       )



# ----------------------------------------------------------



############################################
#######       EXAMPLE ENDPOINT       #######
############################################
@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    response_body = {
        "msg": "Hello! I'm a message from the backend. Check the network tab in Google Inspector and you'll see the GET request"
    }
    return jsonify(response_body), 200


############################################
#######     PRIVATE SITE TESTING     #######
#######   with Postman (or similar)  #######
############################################
"""
How to add the Access_Token in the header in Postman:
    - Go to the "Authorization" tab
    - Choose "Bearer Token" from the dropdown
    - Paste the token WITHOUT QUOTES
"""
@api.route('/testing-private', methods=['GET'])
@jwt_required() # use of JWT is required
def private_route():

    current_user_id = get_jwt_identity()

    user = User.query.get(current_user_id)

    if not user:
        return jsonify({ "msg": "Usuario no encontrado." }), 404
    
    return jsonify({
        "msg": f"Welcome {user.email}!",
        "user": user.serialize()
    }), 200