#!/usr/bin/env python3
"""
Clean startup script for WebSocket server to avoid import issues
"""
import eventlet
# MUST be first - monkey patch before ANY other imports
eventlet.monkey_patch()

import os
import sys

# Add the src directory to Python path
sys.path.insert(0, '/workspaces/tastebook/src')

# Set environment for better logging
os.environ['FLASK_DEBUG'] = '0'
os.environ['SOCKET_PORT'] = '3002'

# Now import our socket app
from socket_app import socket_app, socketio
import logging

if __name__ == '__main__':
    print("🚀 Starting WebSocket server with clean environment...")
    
    # Set logging level
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    )
    
    try:
        socketio.run(
            socket_app, 
            host='0.0.0.0', 
            port=3002, 
            debug=False,
            use_reloader=False,  # Prevent double imports
            log_output=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)