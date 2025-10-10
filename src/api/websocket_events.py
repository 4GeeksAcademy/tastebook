"""
WebSocket event emitters - sends HTTP requests to the WebSocket server.
The WebSocket server will then broadcast to connected clients.
"""

import logging
import os
import requests

logger = logging.getLogger(__name__)

# WebSocket server URL
SOCKET_SERVER_URL = os.getenv("SOCKET_SERVER_URL", "http://localhost:3002")

def emit_new_message(chat_id, message_data):
    """Send new message event to WebSocket server via HTTP"""
    try:
        response = requests.post(
            f"{SOCKET_SERVER_URL}/emit/message_received",
            json={'chat_id': chat_id, 'message': message_data},
            timeout=2
        )
        logger.info("[SOCKETIO] Message emission request sent: %s", response.status_code)
    except Exception as e:
        logger.warning("[SOCKETIO] Failed to emit message: %s", str(e))

def emit_messages_read(chat_id, user_id):
    """Send messages read event to WebSocket server via HTTP"""
    try:
        response = requests.post(
            f"{SOCKET_SERVER_URL}/emit/messages_read",
            json={'chat_id': chat_id, 'user_id': user_id},
            timeout=2
        )
        logger.info("[SOCKETIO] Messages read emission sent: %s", response.status_code)
    except Exception as e:
        logger.warning("[SOCKETIO] Failed to emit messages read: %s", str(e))

def emit_chat_deleted(chat_id, deleted_by):
    """Send chat deleted event to WebSocket server via HTTP"""
    try:
        response = requests.post(
            f"{SOCKET_SERVER_URL}/emit/chat_deleted",
            json={'chat_id': chat_id, 'deleted_by': deleted_by},
            timeout=2
        )
        logger.info("[SOCKETIO] Chat deleted emission sent: %s", response.status_code)
    except Exception as e:
        logger.warning("[SOCKETIO] Failed to emit chat deleted: %s", str(e))


