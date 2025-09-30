"""src.app
Application factory / runtime for the Tastebook API server.

Small, safe cleanups applied:
- removed unused imports
- added basic logging
- require JWT secret in production (fail fast)
- initialize the database before creating the Migrate object
"""
from __future__ import annotations

import os
import logging
from pathlib import Path

from flask import Flask, request, jsonify, url_for, send_from_directory
from flask_migrate import Migrate
# from flask_swagger import swagger # (not used) Normally used to provide a /swagger.json (or /openapi.json) endpoint so Swagger UI or Redoc can render interactive API docs.
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO, emit, join_room, leave_room
import eventlet

from datetime import timedelta

from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from api.websocket_events import init_socketio



ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"

# Static files (frontend build) directory
# static_file_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../dist/')
static_file_dir = str(Path(__file__).resolve().parent.joinpath('..', 'dist'))

app = Flask(__name__)

app.url_map.strict_slashes = False

# Initialize SocketIO with CORS support for frontend
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Initialize websocket events with the socketio instance
init_socketio(socketio)

# Basic logging
logging.basicConfig(level=logging.DEBUG if ENV == "development" else logging.INFO)
logger = logging.getLogger(__name__)



############################################################################
### JWT (JSON Web Token) CONFIGURATION

# Configuration for JWT secret
jwt_secret = os.getenv("JWT_SECRET_KEY")
if not jwt_secret:
    if ENV == "production":
        # Fail fast in production: JWT_SECRET_KEY must be provided
        logger.error("JWT_SECRET_KEY is not set in production environment")
        raise RuntimeError("JWT_SECRET_KEY environment variable is required in production")
    # In development, allow a default but log a warning
    logger.warning("JWT_SECRET_KEY not set; using default insecure development key")
    jwt_secret = "dev-secret-not-for-production"

app.config["JWT_SECRET_KEY"] = jwt_secret

"""
Run this in a Python shell to generate a new key:

python3 -c "import secrets; print(secrets.token_hex(32))"

And set it in the .env file as JWT_SECRET_KEY,
or use in your Render dashboard for the JWT_SECRET_KEY
environment variable instead of using the same one from
your development environment.
"""

# Access token expiry
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize JWT manager
jwt = JWTManager(app)
############################################################################



############################################################################
### DATABASE CONFIGURATION ###

db_url = os.getenv("DATABASE_URL")

if db_url is not None:
    # Heroku-style DATABASE_URL sometimes starts with postgres:// which SQLAlchemy
    # prefers to see as postgresql://
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace("postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions that need the app first
db.init_app(app)

# Create the migration object after db has been initialized with the app
MIGRATE = Migrate(app, db, compare_type=True)
############################################################################


# Admin panel and custom CLI commands
# Add the Admin Panel from "api/app.py"
setup_admin(app)

# Add the Commands from "api/commands.py"
setup_commands(app)

# Register API blueprint
# Add all endpoints form the API with a "api" prefix
app.register_blueprint(api, url_prefix='/api')


# Handle/serialize errors like a JSON object
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code


# Generate sitemap or serve frontend index
@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')


# Any other endpoint will try to serve it like a static file (frontend routing)
@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    file_path = Path(static_file_dir) / path
    if not file_path.is_file():
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    # Avoid cached responses during development / deployments
    response.cache_control.max_age = 0
    return response


############################################################################
### WEBSOCKET EVENT HANDLERS ###

@socketio.on('connect')
def handle_connect():
    """Handle client connection to WebSocket"""
    logger.info("[SOCKETIO] Client connected: %s", request.sid)
    emit('connected', {'status': 'Connected to server'})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection from WebSocket"""
    logger.info("[SOCKETIO] Client disconnected: %s", request.sid)


@socketio.on('join_chat')
def handle_join_chat(data):
    """Handle user joining a specific chat room"""
    chat_id = data.get('chat_id')
    user_id = data.get('user_id')
    
    if chat_id and user_id:
        room_name = f"chat_{chat_id}"
        join_room(room_name)
        logger.info("[SOCKETIO] User %s joined chat room %s", user_id, room_name)
        emit('joined_chat', {'chat_id': chat_id, 'room': room_name})


@socketio.on('leave_chat')
def handle_leave_chat(data):
    """Handle user leaving a specific chat room"""
    chat_id = data.get('chat_id')
    user_id = data.get('user_id')
    
    if chat_id and user_id:
        room_name = f"chat_{chat_id}"
        leave_room(room_name)
        logger.info("[SOCKETIO] User %s left chat room %s", user_id, room_name)
        emit('left_chat', {'chat_id': chat_id, 'room': room_name})


@socketio.on('new_message')
def handle_new_message(data):
    """Broadcast new message to all users in the chat"""
    chat_id = data.get('chat_id')
    message_data = data.get('message')
    
    if chat_id and message_data:
        room_name = f"chat_{chat_id}"
        logger.info("[SOCKETIO] Broadcasting message to room %s: %s", room_name, message_data.get('id'))
        
        # Broadcast to all users in the chat room
        emit('message_received', {
            'chat_id': chat_id,
            'message': message_data
        }, room=room_name)


@socketio.on('messages_read')
def handle_messages_read(data):
    """Broadcast that messages have been read to update UI"""
    chat_id = data.get('chat_id')
    user_id = data.get('user_id')
    
    if chat_id and user_id:
        room_name = f"chat_{chat_id}"
        logger.info("[SOCKETIO] Broadcasting messages read for chat %s by user %s", chat_id, user_id)
        
        # Broadcast to all users in the chat room
        emit('messages_marked_read', {
            'chat_id': chat_id,
            'user_id': user_id
        }, room=room_name)


@socketio.on('chat_deleted')
def handle_chat_deleted(data):
    """Broadcast that a chat has been deleted"""
    chat_id = data.get('chat_id')
    deleted_by = data.get('deleted_by')
    
    if chat_id and deleted_by:
        room_name = f"chat_{chat_id}"
        logger.info("[SOCKETIO] Broadcasting chat deletion for chat %s", chat_id)
        
        # Broadcast to all users in the chat room
        emit('chat_was_deleted', {
            'chat_id': chat_id,
            'deleted_by': deleted_by
        }, room=room_name)

############################################################################


# This only runs if `$ python src/main.py` is executed
# Run the development server when executed directly
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    DEBUG_MODE = ENV == "development"
    logger.info("Starting app on port %s (debug=%s)", PORT, DEBUG_MODE)
    # Use SocketIO.run instead of app.run for WebSocket support
    socketio.run(app, host='0.0.0.0', port=PORT, debug=DEBUG_MODE)