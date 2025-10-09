"""
Standalone WebSocket server for TasteBook real-time messaging.
This server runs separately from the main Flask API.
"""
import os
import logging
import signal
import sys
from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import eventlet

# Basic logging
logging.basicConfig(level=logging.DEBUG if os.getenv("FLASK_DEBUG") == "1" else logging.INFO)
logger = logging.getLogger(__name__)

# Create minimal Flask app for SocketIO
socket_app = Flask(__name__)
CORS(socket_app, resources={r"/*": {"origins": "*"}})

# Initialize SocketIO
socketio = SocketIO(
    socket_app, 
    cors_allowed_origins="*", 
    async_mode='eventlet',
    logger=True,
    engineio_logger=True
)

# Graceful shutdown handler
def signal_handler(sig, frame):
    logger.info("🛑 Received shutdown signal (%s), shutting down gracefully...", sig)
    socketio.stop()
    sys.exit(0)

# Register signal handlers for graceful shutdown
signal.signal(signal.SIGINT, signal_handler)   # Ctrl+C
signal.signal(signal.SIGTERM, signal_handler)  # Kill/stop command

############################################################################
### WEBSOCKET EVENT HANDLERS ###

@socketio.on('connect')
def handle_connect():
    """Handle client connection to WebSocket"""
    logger.info("[SOCKETIO] Client connected: %s", request.sid)
    emit('connected', {'status': 'Connected to WebSocket server'})


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
        logger.info("[SOCKETIO] ✅ User %s joined chat room %s (Session: %s)", user_id, room_name, request.sid)
        emit('joined_chat', {'chat_id': chat_id, 'room': room_name, 'user_id': user_id})
    else:
        logger.warning("[SOCKETIO] ❌ Invalid join_chat data: %s", data)


@socketio.on('leave_chat')
def handle_leave_chat(data):
    """Handle user leaving a specific chat room"""
    chat_id = data.get('chat_id')
    user_id = data.get('user_id')
    
    if chat_id and user_id:
        room_name = f"chat_{chat_id}"
        leave_room(room_name)
        logger.info("[SOCKETIO] ✅ User %s left chat room %s (Session: %s)", user_id, room_name, request.sid)
        emit('left_chat', {'chat_id': chat_id, 'room': room_name, 'user_id': user_id})
    else:
        logger.warning("[SOCKETIO] ❌ Invalid leave_chat data: %s", data)


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

# HTTP endpoints for REST API to trigger WebSocket events
@socket_app.route('/emit/message_received', methods=['POST'])
def emit_message_received():
    """Endpoint for REST API to trigger message_received event"""
    data = request.get_json()
    chat_id = data.get('chat_id')
    message = data.get('message')
    
    if chat_id and message:
        room_name = f"chat_{chat_id}"
        
        # Broadcast to specific chat room
        socketio.emit('message_received', {'chat_id': chat_id, 'message': message}, room=room_name)
        logger.info("[HTTP->WS] Emitted message_received to room %s", room_name)
        
        # ALSO broadcast globally for unread count updates (Navbar, etc.)
        socketio.emit('global_message_received', {'chat_id': chat_id, 'message': message})
        logger.info("[HTTP->WS] Emitted global_message_received for unread count updates")
        
        return {'status': 'success'}, 200
    return {'status': 'error', 'message': 'Invalid data'}, 400


@socket_app.route('/emit/messages_read', methods=['POST'])
def emit_messages_read_endpoint():
    """Endpoint for REST API to trigger messages_read event"""
    data = request.get_json()
    chat_id = data.get('chat_id')
    user_id = data.get('user_id')
    
    if chat_id and user_id:
        room_name = f"chat_{chat_id}"
        
        # Broadcast to specific chat room
        socketio.emit('messages_marked_read', {'chat_id': chat_id, 'user_id': user_id}, room=room_name)
        logger.info("[HTTP->WS] Emitted messages_marked_read to room %s", room_name)
        
        # ALSO broadcast globally for unread count updates (Navbar, etc.)
        socketio.emit('global_messages_read', {'chat_id': chat_id, 'user_id': user_id})
        logger.info("[HTTP->WS] Emitted global_messages_read for unread count updates")
        
        return {'status': 'success'}, 200
    return {'status': 'error', 'message': 'Invalid data'}, 400


@socket_app.route('/emit/chat_deleted', methods=['POST'])
def emit_chat_deleted_endpoint():
    """Endpoint for REST API to trigger chat_deleted event"""
    data = request.get_json()
    chat_id = data.get('chat_id')
    deleted_by = data.get('deleted_by')
    
    if chat_id and deleted_by:
        room_name = f"chat_{chat_id}"
        
        # Broadcast to specific chat room
        socketio.emit('chat_was_deleted', {'chat_id': chat_id, 'deleted_by': deleted_by}, room=room_name)
        logger.info("[HTTP->WS] Emitted chat_was_deleted to room %s", room_name)
        
        # ALSO broadcast globally for unread count updates (Navbar, etc.)
        socketio.emit('global_chat_deleted', {'chat_id': chat_id, 'deleted_by': deleted_by})
        logger.info("[HTTP->WS] Emitted global_chat_deleted for unread count updates")
        
        return {'status': 'success'}, 200
    return {'status': 'error', 'message': 'Invalid data'}, 400


@socket_app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return {'status': 'healthy', 'service': 'websocket'}, 200

############################################################################


if __name__ == '__main__':
    PORT = int(os.environ.get('SOCKET_PORT', 3002))
    logger.info("🚀 Starting WebSocket server on port %s", PORT)
    socketio.run(socket_app, host='0.0.0.0', port=PORT, debug=os.getenv("FLASK_DEBUG") == "1")
