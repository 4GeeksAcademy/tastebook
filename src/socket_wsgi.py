"""
WSGI entry point for the WebSocket server.
This is used by gunicorn in production with eventlet worker.
"""
import eventlet
# Monkey patch must be first thing, before any other imports
eventlet.monkey_patch()

# Import the Flask app and SocketIO instance
from socket_app import socket_app, socketio

# For gunicorn with Flask-SocketIO and eventlet worker
# In newer Flask-SocketIO versions, we need to use the Flask app as the WSGI application
# and the SocketIO instance will handle WebSocket upgrade requests automatically
application = socket_app