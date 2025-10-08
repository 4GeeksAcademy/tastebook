

# THIS FILE WAS IN THE "/src" DIRECTORY
# and is not only needed for Heroku but also for Render.com !!!


# This file was created to run the application on heroku using gunicorn.
# Read more about it here: https://devcenter.heroku.com/articles/python-gunicorn

from app import app as application

if __name__ == "__main__":
    application.run()
