"""
WSGI entry point for the WebSocket server.
This is used by gunicorn in production with eventlet worker.
"""
import eventlet
eventlet.monkey_patch()

from socket_app import socket_app, socketio

# For gunicorn with eventlet worker, export the SocketIO-wrapped Flask app
application = socketio