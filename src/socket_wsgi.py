"""
WSGI entry point for the WebSocket server.
This is used by gunicorn in production with eventlet worker.
"""
import eventlet
# CRITICAL: Monkey patch MUST be first thing, before any other imports
eventlet.monkey_patch()

# Import the Flask app and SocketIO instance
from socket_app import socket_app, socketio

# For gunicorn with Flask-SocketIO and eventlet worker
# The socketio instance should be used as the WSGI application
application = socketio