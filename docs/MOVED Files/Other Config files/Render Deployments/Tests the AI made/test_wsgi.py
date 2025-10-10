#!/usr/bin/env python3
"""
Test script to verify that socket_wsgi.py exports a valid WSGI application
"""
import sys
import os

# Add src directory to path
sys.path.insert(0, '/workspaces/tastebook/src')

try:
    # Test importing the WSGI application
    from socket_wsgi import application
    
    print("✅ Successfully imported application from socket_wsgi.py")
    print(f"   Application type: {type(application)}")
    print(f"   Application callable: {callable(application)}")
    
    # Check if it has WSGI interface
    if hasattr(application, '__call__'):
        print("✅ Application is callable (required for WSGI)")
    else:
        print("❌ Application is not callable")
        
    # Try to get the wrapped Flask app
    if hasattr(application, 'app'):
        print(f"✅ SocketIO wraps Flask app: {type(application.app)}")
    
    print("\n🎉 WSGI application appears to be correctly configured!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)