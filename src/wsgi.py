
# THIS FILE IS NEEDED FOR DEPLOYMENT IN RENDER.COM !!!


# This file is required for Render.com deployment using gunicorn.
# Read more about it here: https://devcenter.heroku.com/articles/python-gunicorn

# Import the main Flask app (WebSocket functionality is now in a separate service)
from app import app

# For WSGI servers
application = app

if __name__ == "__main__":
    app.run()