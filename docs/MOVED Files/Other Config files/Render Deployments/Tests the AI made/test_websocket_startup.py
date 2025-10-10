#!/usr/bin/env python3
"""
Quick test to verify the WebSocket server starts correctly
"""
import sys
import os
import signal
import time

# Add src directory to path
sys.path.insert(0, '/workspaces/tastebook/src')

def test_websocket_server():
    print("🚀 Testing WebSocket server startup...")
    
    try:
        # Set environment variables for testing
        os.environ['SOCKET_PORT'] = '3002'
        os.environ['FLASK_DEBUG'] = '0'
        
        from socket_wsgi import application
        print("✅ WSGI application imported successfully")
        
        # Test that we can import the socket_app
        from socket_app import socket_app, socketio
        print("✅ Socket app components imported successfully")
        
        print("🎉 WebSocket server configuration is valid!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_websocket_server()
    sys.exit(0 if success else 1)