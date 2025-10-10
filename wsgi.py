# Root-level WSGI file for Render deployment
# This imports the application from the src directory

# THIS IS A TEMPORARY FILE TO TEST RENDER DEPLOYMENT

from src.app import app

# For WSGI servers
application = app

if __name__ == "__main__":
    app.run()