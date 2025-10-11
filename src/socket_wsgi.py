"""
WSGI entry point for the WebSocket server.
This is used by gunicorn in production with eventlet worker.
"""
import eventlet
# CRITICAL: Monkey patch MUST be first thing, before any other imports.
# Exclude os module to avoid gunicorn wakeup RuntimeError on Render/eventlet.
eventlet.monkey_patch(os=False)

# Import the Flask app and SocketIO instance
from socket_app import socket_app, socketio

# For gunicorn with Flask-SocketIO and eventlet worker
# When using eventlet worker, gunicorn needs the Flask app, and Flask-SocketIO
# will automatically handle WebSocket connections through the app
application = socket_app