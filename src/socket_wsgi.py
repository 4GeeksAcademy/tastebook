"""
WSGI entry point for the WebSocket server.
This is used by gunicorn in production with eventlet worker.
"""
import eventlet
# Monkey patch must be first thing, before any other imports
eventlet.monkey_patch()

from socket_app import socket_app, socketio

# For Flask-SocketIO with gunicorn eventlet worker
# Export the SocketIO instance which wraps the Flask app
application = socketio