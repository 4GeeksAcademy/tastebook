"""
Root-level WSGI entry point for the WebSocket server.
This imports the SocketIO application from the src directory.
"""
import eventlet
# CRITICAL: Monkey patch MUST be first thing, before any other imports
eventlet.monkey_patch()

import sys
import os
from pathlib import Path

# Add src directory to Python path so imports work correctly
src_dir = Path(__file__).parent / 'src'
sys.path.insert(0, str(src_dir))

# Import the socket app components directly
from socket_app import socket_app, socketio

# For gunicorn with Flask-SocketIO and eventlet worker
# The socketio instance should be used as the WSGI application
application = socketio