
# THIS FILE IS NEEDED FOR DEPLOYMENT IN RENDER.COM !!!


# This file is required for Render.com deployment using gunicorn.
# Read more about it here: https://devcenter.heroku.com/articles/python-gunicorn

# Import the SocketIO app for WebSocket support
from app import app, socketio

# For regular WSGI servers (if needed)
application = app

# For SocketIO deployment with eventlet
if __name__ == "__main__":
    socketio.run(app)