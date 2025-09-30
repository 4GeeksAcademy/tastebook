"""
WebSocket events for real-time messaging functionality.
This module handles SocketIO events and provides utilities for emitting to specific rooms.
"""

import logging
from flask_socketio import emit

logger = logging.getLogger(__name__)

# Global variable to store the socketio instance
socketio_instance = None

def init_socketio(socketio):
    """Initialize the global socketio instance"""
    global socketio_instance
    socketio_instance = socketio
    logger.info("[SOCKETIO] WebSocket instance initialized")

def emit_new_message(chat_id, message_data):
    """Emit new message to all users in a chat room"""
    if socketio_instance is None:
        logger.warning("[SOCKETIO] Cannot emit - socketio not initialized")
        return
    
    room_name = f"chat_{chat_id}"
    logger.info("[SOCKETIO] Emitting new message to room %s: message ID %s", room_name, message_data.get('id'))
    
    # Emit to specific room (normal behavior)
    socketio_instance.emit('message_received', {
        'chat_id': chat_id,
        'message': message_data
    }, room=room_name)

def emit_messages_read(chat_id, user_id):
    """Emit that messages have been read to all users in a chat room"""
    if socketio_instance is None:
        logger.warning("[SOCKETIO] Cannot emit - socketio not initialized")
        return
    
    room_name = f"chat_{chat_id}"
    logger.info("[SOCKETIO] Emitting messages read to room %s: user %s", room_name, user_id)
    
    socketio_instance.emit('messages_marked_read', {
        'chat_id': chat_id,
        'user_id': user_id
    }, room=room_name)

def emit_chat_deleted(chat_id, deleted_by):
    """Emit that a chat has been deleted to all users in the chat room"""
    if socketio_instance is None:
        logger.warning("[SOCKETIO] Cannot emit - socketio not initialized")
        return
    
    room_name = f"chat_{chat_id}"
    logger.info("[SOCKETIO] Emitting chat deleted to room %s: deleted by user %s", room_name, deleted_by)
    
    socketio_instance.emit('chat_was_deleted', {
        'chat_id': chat_id,
        'deleted_by': deleted_by
    }, room=room_name)