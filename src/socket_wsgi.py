"""
WSGI entry point for the WebSocket server.
This is used by gunicorn in production.
"""
from socket_app import socket_app, socketio

# This is what gunicorn will import
application = socketio