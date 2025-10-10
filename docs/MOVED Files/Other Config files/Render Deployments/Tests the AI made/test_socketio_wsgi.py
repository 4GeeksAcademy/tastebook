#!/usr/bin/env python3
"""
Test to check SocketIO WSGI interface
"""
import sys
import os

# Add src directory to path
sys.path.insert(0, '/workspaces/tastebook/src')

try:
    from socket_app import socketio
    
    print(f"SocketIO instance: {type(socketio)}")
    print(f"Has wsgi_app attribute: {hasattr(socketio, 'wsgi_app')}")
    
    if hasattr(socketio, 'wsgi_app'):
        print(f"wsgi_app type: {type(socketio.wsgi_app)}")
        print(f"wsgi_app callable: {callable(socketio.wsgi_app)}")
    
    # Check if socketio itself is callable
    print(f"SocketIO callable: {callable(socketio)}")
    
    # Check Flask-SocketIO version
    import flask_socketio
    print(f"Flask-SocketIO version: {flask_socketio.__version__}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()